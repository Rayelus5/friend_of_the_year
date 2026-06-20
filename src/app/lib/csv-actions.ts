'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getPlanFromUser } from "@/lib/user-plan";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParticipantImportRow = {
    name: string;
    imageUrl?: string;
};

export type PollImportRow = {
    title: string;
    description?: string;
    votingType: "SINGLE" | "MULTIPLE" | "LIMITED_MULTIPLE";
    maxOptions?: number;
};

export type TierImportRow = {
    label: string;
    color?: string;
};

export type QuestionImportRow = {
    text: string;
    description?: string;
    type: "RADIO" | "CHECKBOX";
    isRequired?: boolean;
    pageIndex?: number;
    options: string[];
};

export type BulkImportError = {
    row: number;
    value: string;
    reason: string;
};

export type BulkImportResult = {
    created: number;
    errors: BulkImportError[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function triggerDataChanged(eventId: string, triggeredBy: string, dataType: string) {
    try {
        await pusherServer.trigger(eventChannel(eventId), PUSHER_EVENTS.DATA_CHANGED, {
            dataType,
            triggeredBy,
        });
    } catch {
        // no-op: Pusher failures must never break the action
    }
}

async function getEventAccessAndPlan(eventId: string, userId: string, permission: "canManageNominees" | "canManagePolls") {
    const [event, collab, user] = await Promise.all([
        prisma.event.findUnique({
            where: { id: eventId },
            select: { userId: true, mode: true, status: true },
        }),
        prisma.eventCollaborator.findUnique({
            where: { eventId_userId: { eventId, userId } },
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    ]);

    if (!event) return { hasAccess: false, owner: null, mode: null };

    const isOwner = event.userId === userId;
    // Los administradores y moderadores pueden gestionar cualquier evento (igual que en Gala).
    const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

    if (!isOwner && !isAdmin && !collab) return { hasAccess: false, owner: null, mode: null };

    const permGranted = isOwner || isAdmin || !!(collab?.[permission]);
    if (!permGranted) return { hasAccess: false, owner: null, mode: null };

    // Bloqueo de edición: no se permite importar por CSV mientras el evento esté
    // publicado (APPROVED) o en revisión (PENDING). Los admins sí pueden.
    if (!isAdmin && (event.status === "APPROVED" || event.status === "PENDING")) {
        return { hasAccess: false, owner: null, mode: null };
    }

    // El plan se calcula siempre sobre el dueño real del evento, no sobre el admin.
    const owner = await prisma.user.findUnique({ where: { id: event.userId } });
    return { hasAccess: true, owner, mode: event.mode };
}

// ─── Bulk create participants ─────────────────────────────────────────────────

export async function bulkCreateParticipants(
    eventId: string,
    rows: ParticipantImportRow[]
): Promise<BulkImportResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { created: 0, errors: [{ row: 0, value: "", reason: "No autenticado" }] };
    }

    if (!rows.length) {
        return { created: 0, errors: [] };
    }

    const { hasAccess, owner, mode } = await getEventAccessAndPlan(eventId, session.user.id, "canManageNominees");
    if (!hasAccess || !owner) {
        return { created: 0, errors: [{ row: 0, value: "", reason: "Sin permisos para gestionar nominados" }] };
    }

    const plan = await getPlanFromUser(owner);
    // En TIERLIST los "nominados" se rigen por tierlistMaxOptions; en GALA por participantsPerEvent
    // (mismo criterio que el alta interactiva en event-actions.ts).
    const limit = mode === "TIERLIST" ? plan.limits.tierlistMaxOptions : plan.limits.participantsPerEvent;

    let currentCount = await prisma.participant.count({ where: { eventId } });
    // Orden secuencial a partir del máximo actual: el orden del CSV = orden mostrado.
    const lastP = await prisma.participant.findFirst({ where: { eventId }, orderBy: { order: "desc" }, select: { order: true } });
    let nextOrder = (lastP?.order ?? -1) + 1;
    const errors: BulkImportError[] = [];
    let created = 0;

    // 1) Validar todas las filas y acumular las válidas (respetando el límite del plan)
    const valid: { rowNum: number; value: string; data: { name: string; imageUrl: string | null; eventId: string; order: number } }[] = [];
    for (let i = 0; i < rows.length; i++) {
        const { name, imageUrl } = rows[i];
        const rowNum = i + 1;

        if (!name?.trim()) {
            errors.push({ row: rowNum, value: name ?? "", reason: "El nombre es obligatorio" });
            continue;
        }
        if (name.trim().length > 80) {
            errors.push({ row: rowNum, value: name, reason: "El nombre supera los 80 caracteres" });
            continue;
        }
        if (currentCount >= limit) {
            errors.push({ row: rowNum, value: name, reason: `Límite de ${limit} nominados alcanzado` });
            continue;
        }
        currentCount++;
        valid.push({
            rowNum,
            value: name,
            data: { name: name.trim(), imageUrl: imageUrl?.trim() || null, eventId, order: nextOrder },
        });
        nextOrder++;
    }

    // 2) Insertar en lotes con createMany (chunks de 50) en vez de N round-trips
    const CHUNK = 50;
    for (let i = 0; i < valid.length; i += CHUNK) {
        const chunk = valid.slice(i, i + CHUNK);
        try {
            const res = await prisma.participant.createMany({ data: chunk.map((c) => c.data) });
            created += res.count;
        } catch {
            for (const c of chunk) {
                errors.push({ row: c.rowNum, value: c.value, reason: "Error al guardar en base de datos" });
            }
        }
    }

    if (created > 0) {
        revalidatePath(`/dashboard/event/${eventId}`);
        await triggerDataChanged(eventId, session.user.id, "participants");
    }

    return { created, errors };
}

// ─── Bulk create polls (categories) ──────────────────────────────────────────

export async function bulkCreatePolls(
    eventId: string,
    rows: PollImportRow[]
): Promise<BulkImportResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { created: 0, errors: [{ row: 0, value: "", reason: "No autenticado" }] };
    }

    if (!rows.length) {
        return { created: 0, errors: [] };
    }

    const { hasAccess, owner } = await getEventAccessAndPlan(eventId, session.user.id, "canManagePolls");
    if (!hasAccess || !owner) {
        return { created: 0, errors: [{ row: 0, value: "", reason: "Sin permisos para gestionar categorías" }] };
    }

    const plan = await getPlanFromUser(owner);
    const limit = plan.limits.pollsPerEvent;

    let currentCount = await prisma.poll.count({ where: { eventId } });
    const lastPoll = await prisma.poll.findFirst({
        where: { eventId },
        orderBy: { order: "desc" },
        select: { order: true },
    });
    let nextOrder = (lastPoll?.order ?? 0) + 1;

    const errors: BulkImportError[] = [];
    let created = 0;
    const validVotingTypes = ["SINGLE", "MULTIPLE", "LIMITED_MULTIPLE"];

    type PollData = {
        title: string;
        description: string | null;
        order: number;
        isPublished: boolean;
        votingType: "SINGLE" | "MULTIPLE" | "LIMITED_MULTIPLE";
        maxOptions: number;
        eventId: string;
    };

    // 1) Validar todas las filas y acumular las válidas (con su order secuencial)
    const valid: { rowNum: number; value: string; data: PollData }[] = [];
    for (let i = 0; i < rows.length; i++) {
        const { title, description, votingType, maxOptions } = rows[i];
        const rowNum = i + 1;

        if (!title?.trim()) {
            errors.push({ row: rowNum, value: title ?? "", reason: "El título es obligatorio" });
            continue;
        }
        if (title.trim().length > 100) {
            errors.push({ row: rowNum, value: title, reason: "El título supera los 100 caracteres" });
            continue;
        }
        if (!validVotingTypes.includes(votingType)) {
            errors.push({ row: rowNum, value: title, reason: `Tipo de votación inválido: "${votingType}". Usa SINGLE, MULTIPLE o LIMITED_MULTIPLE` });
            continue;
        }
        if (currentCount >= limit) {
            errors.push({ row: rowNum, value: title, reason: `Límite de ${limit} categorías alcanzado` });
            continue;
        }

        const computedMaxOptions =
            votingType === "LIMITED_MULTIPLE"
                ? (maxOptions && maxOptions >= 2 ? maxOptions : 2)
                : votingType === "SINGLE"
                    ? 1
                    : 999;

        valid.push({
            rowNum,
            value: title,
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                order: nextOrder,
                isPublished: true,
                votingType,
                maxOptions: computedMaxOptions,
                eventId,
            },
        });
        nextOrder++;
        currentCount++;
    }

    // 2) Insertar en lotes con createMany (chunks de 50)
    const CHUNK = 50;
    for (let i = 0; i < valid.length; i += CHUNK) {
        const chunk = valid.slice(i, i + CHUNK);
        try {
            const res = await prisma.poll.createMany({ data: chunk.map((c) => c.data) });
            created += res.count;
        } catch {
            for (const c of chunk) {
                errors.push({ row: c.rowNum, value: c.value, reason: "Error al guardar en base de datos" });
            }
        }
    }

    if (created > 0) {
        revalidatePath(`/dashboard/event/${eventId}`);
        await triggerDataChanged(eventId, session.user.id, "polls");
    }

    return { created, errors };
}

// ─── Bulk create tiers (modo TIERLIST) ────────────────────────────────────────

const DEFAULT_TIER_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

export async function bulkCreateTiers(eventId: string, rows: TierImportRow[]): Promise<BulkImportResult> {
    const session = await auth();
    if (!session?.user?.id) return { created: 0, errors: [{ row: 0, value: "", reason: "No autenticado" }] };
    if (!rows.length) return { created: 0, errors: [] };

    const { hasAccess, owner } = await getEventAccessAndPlan(eventId, session.user.id, "canManagePolls");
    if (!hasAccess || !owner) return { created: 0, errors: [{ row: 0, value: "", reason: "Sin permisos para gestionar tiers" }] };

    const plan = await getPlanFromUser(owner);
    const limit = plan.limits.tierlistMaxTiers;

    let currentCount = await prisma.tierlistTier.count({ where: { eventId } });
    const last = await prisma.tierlistTier.findFirst({ where: { eventId }, orderBy: { order: "desc" }, select: { order: true } });
    let nextOrder = (last?.order ?? -1) + 1;

    const errors: BulkImportError[] = [];
    const valid: { rowNum: number; value: string; data: { eventId: string; label: string; color: string; order: number } }[] = [];

    for (let i = 0; i < rows.length; i++) {
        const { label, color } = rows[i];
        const rowNum = i + 1;
        if (!label?.trim()) { errors.push({ row: rowNum, value: label ?? "", reason: "El nombre del tier es obligatorio" }); continue; }
        if (label.trim().length > 50) { errors.push({ row: rowNum, value: label, reason: "El nombre supera los 50 caracteres" }); continue; }
        if (currentCount >= limit) { errors.push({ row: rowNum, value: label, reason: `Límite de ${limit} tiers alcanzado` }); continue; }
        const hex = color && /^#[0-9a-fA-F]{6}$/.test(color.trim()) ? color.trim() : DEFAULT_TIER_COLORS[nextOrder % DEFAULT_TIER_COLORS.length];
        valid.push({ rowNum, value: label, data: { eventId, label: label.trim(), color: hex, order: nextOrder } });
        nextOrder++; currentCount++;
    }

    let created = 0;
    for (let i = 0; i < valid.length; i += 50) {
        const chunk = valid.slice(i, i + 50);
        try {
            const res = await prisma.tierlistTier.createMany({ data: chunk.map((c) => c.data) });
            created += res.count;
        } catch {
            for (const c of chunk) errors.push({ row: c.rowNum, value: c.value, reason: "Error al guardar en base de datos" });
        }
    }

    if (created > 0) {
        revalidatePath(`/dashboard/event/${eventId}`);
        await triggerDataChanged(eventId, session.user.id, "tiers");
    }
    return { created, errors };
}

// ─── Bulk create questions (modo PREGUNTAS) ───────────────────────────────────

export async function bulkCreateQuestions(eventId: string, rows: QuestionImportRow[]): Promise<BulkImportResult> {
    const session = await auth();
    if (!session?.user?.id) return { created: 0, errors: [{ row: 0, value: "", reason: "No autenticado" }] };
    if (!rows.length) return { created: 0, errors: [] };

    const { hasAccess, owner } = await getEventAccessAndPlan(eventId, session.user.id, "canManagePolls");
    if (!hasAccess || !owner) return { created: 0, errors: [{ row: 0, value: "", reason: "Sin permisos para gestionar preguntas" }] };

    const plan = await getPlanFromUser(owner);
    const limit = plan.limits.preguntasMaxQuestions;
    const maxOptions = plan.limits.preguntasMaxOptions;

    let currentCount = await prisma.question.count({ where: { eventId } });
    const last = await prisma.question.findFirst({ where: { eventId }, orderBy: { order: "desc" }, select: { order: true } });
    let nextOrder = (last?.order ?? -1) + 1;

    const errors: BulkImportError[] = [];
    let created = 0;

    // Crear una a una (cada pregunta lleva opciones anidadas)
    for (let i = 0; i < rows.length; i++) {
        const { text, description, type, isRequired, pageIndex, options } = rows[i];
        const rowNum = i + 1;
        if (!text?.trim()) { errors.push({ row: rowNum, value: text ?? "", reason: "El texto de la pregunta es obligatorio" }); continue; }
        if (text.trim().length > 300) { errors.push({ row: rowNum, value: text, reason: "La pregunta supera los 300 caracteres" }); continue; }
        const opts = (options ?? []).map((o) => o.trim()).filter(Boolean).slice(0, maxOptions);
        if (opts.length < 2) { errors.push({ row: rowNum, value: text, reason: "Cada pregunta necesita al menos 2 opciones" }); continue; }
        if (currentCount >= limit) { errors.push({ row: rowNum, value: text, reason: `Límite de ${limit} preguntas alcanzado` }); continue; }

        try {
            await prisma.question.create({
                data: {
                    eventId,
                    text: text.trim(),
                    description: description?.trim() || null,
                    type: type === "CHECKBOX" ? "CHECKBOX" : "RADIO",
                    isRequired: !!isRequired,
                    pageIndex: Math.max(0, pageIndex ?? 0),
                    order: nextOrder,
                    options: { create: opts.map((o, idx) => ({ text: o.slice(0, 200), order: idx })) },
                },
            });
            created++; nextOrder++; currentCount++;
        } catch {
            errors.push({ row: rowNum, value: text, reason: "Error al guardar en base de datos" });
        }
    }

    if (created > 0) {
        revalidatePath(`/dashboard/event/${eventId}`);
        await triggerDataChanged(eventId, session.user.id, "questions");
    }
    return { created, errors };
}
