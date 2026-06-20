"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getEventStats, getModeStats } from "@/app/lib/stats-actions";

export type SnapshotMode = "GALA" | "TIERLIST" | "PREGUNTAS";

export type SnapshotItem = { name: string; imageUrl: string | null; count: number };

// Un "grupo" de resultados: categoría (GALA), nominado (TIERLIST) o pregunta (PREGUNTAS).
export type SnapshotGroup = {
    title: string;
    totalVotes: number;
    winner: string | null;
    items: SnapshotItem[];
};

// Resultados agregados que se guardan en VoteSnapshot.data.
export type SnapshotData = {
    mode: SnapshotMode;
    totalVotes: number;
    totalGroups: number;
    groups: SnapshotGroup[];
};

export type VoteSnapshotDTO = {
    id: string;
    title: string;
    totalVotes: number;
    galaDate: Date;
    createdAt: Date;
    data: SnapshotData;
};

// Solo el dueño del evento o un admin/moderador pueden gestionar snapshots
// (crear uno borra los votos actuales: es una acción destructiva).
async function resolveOwnerOrAdmin(eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" as const };
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, userId: true, galaDate: true, mode: true },
    });
    if (!event) return { error: "Evento no encontrado" as const };
    if (!isAdmin && event.userId !== session.user.id) return { error: "Sin permisos" as const };
    return { event, userId: session.user.id, isAdmin };
}

export async function listVoteSnapshots(eventId: string): Promise<VoteSnapshotDTO[]> {
    const ctx = await resolveOwnerOrAdmin(eventId);
    if ("error" in ctx) return [];

    const rows = await prisma.voteSnapshot.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, totalVotes: true, galaDate: true, createdAt: true, data: true },
    });

    return rows.map((r) => ({
        id: r.id,
        title: r.title,
        totalVotes: r.totalVotes,
        galaDate: r.galaDate,
        createdAt: r.createdAt,
        data: r.data as unknown as SnapshotData,
    }));
}

// Construye los resultados agregados (data) según el modo del evento.
async function buildSnapshotData(eventId: string, mode: SnapshotMode): Promise<SnapshotData | null> {
    if (mode === "GALA") {
        const s = await getEventStats(eventId);
        if (!s) return null;
        return {
            mode,
            totalVotes: s.totalVotes,
            totalGroups: s.totalPolls,
            groups: s.pollsDetail.map((p) => ({
                title: p.title,
                totalVotes: p.totalVotes,
                winner: p.options[0]?.votesCount ? p.options[0].name : null,
                items: p.options.map((o) => ({ name: o.name, imageUrl: o.imageUrl, count: o.votesCount })),
            })),
        };
    }

    if (mode === "TIERLIST") {
        const s = await getModeStats(eventId, "TIERLIST");
        if (!s || s.mode !== "TIERLIST") return null;
        return {
            mode,
            totalVotes: s.totalVotes,
            totalGroups: s.participants.length,
            groups: s.participants.map((p) => ({
                title: p.name,
                totalVotes: p.placements,
                winner: p.topTier?.label ?? null,
                items: p.tiers.map((t) => ({ name: t.label, imageUrl: null, count: t.count })),
            })),
        };
    }

    // PREGUNTAS
    const s = await getModeStats(eventId, "PREGUNTAS");
    if (!s || s.mode !== "PREGUNTAS") return null;
    return {
        mode,
        totalVotes: s.totalRespondents,
        totalGroups: s.questions.length,
        groups: s.questions.map((q) => {
            const items = q.options.map((o) => ({ name: o.text, imageUrl: null, count: o.count }));
            const top = [...items].sort((a, b) => b.count - a.count)[0];
            return {
                title: q.text,
                totalVotes: q.totalAnswers,
                winner: top?.count ? top.name : null,
                items,
            };
        }),
    };
}

// Borra todos los votos del evento según su modo (reinicio de estadísticas).
async function resetVotes(tx: Prisma.TransactionClient, eventId: string, mode: SnapshotMode) {
    if (mode === "GALA") {
        const votes = await tx.vote.findMany({ where: { poll: { eventId } }, select: { id: true } });
        const voteIds = votes.map((v) => v.id);
        if (voteIds.length) {
            await tx.voteOption.deleteMany({ where: { voteId: { in: voteIds } } });
            await tx.vote.deleteMany({ where: { id: { in: voteIds } } });
        }
        return;
    }
    if (mode === "TIERLIST") {
        // Las entries (TierlistVoteEntry) se borran en cascada al borrar el voto.
        await tx.tierlistVote.deleteMany({ where: { eventId } });
        return;
    }
    // PREGUNTAS
    await tx.questionAnswer.deleteMany({ where: { eventId } });
}

/**
 * Guarda los resultados actuales del evento como un snapshot ("edición") y
 * REINICIA las votaciones borrando todos los votos. Disponible en GALA, TIERLIST
 * y PREGUNTAS (no en DIBUJO). Pensado para repetir un evento en otra edición.
 */
export async function createVoteSnapshot(eventId: string, titleRaw: string) {
    const ctx = await resolveOwnerOrAdmin(eventId);
    if ("error" in ctx) return { error: ctx.error };

    if (ctx.event.mode === "DIBUJO") {
        return { error: "Las ediciones no están disponibles en modo dibujo." };
    }
    const mode = ctx.event.mode as SnapshotMode;

    const title = (titleRaw ?? "").trim();
    if (!title) return { error: "El título es obligatorio." };
    if (title.length > 120) return { error: "El título supera los 120 caracteres." };

    const data = await buildSnapshotData(eventId, mode);
    if (!data) return { error: "No se pudieron calcular los resultados." };
    if (data.totalVotes === 0) return { error: "No hay votos que guardar todavía." };

    await prisma.$transaction(async (tx) => {
        await tx.voteSnapshot.create({
            data: {
                eventId,
                title,
                data: data as unknown as Prisma.InputJsonValue,
                totalVotes: data.totalVotes,
                galaDate: ctx.event.galaDate,
            },
        });
        await resetVotes(tx, eventId, mode);
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    return { success: true };
}

export async function deleteVoteSnapshot(snapshotId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    const snap = await prisma.voteSnapshot.findUnique({
        where: { id: snapshotId },
        select: { eventId: true, event: { select: { userId: true } } },
    });
    if (!snap) return { error: "Snapshot no encontrado" };
    if (!isAdmin && snap.event.userId !== session.user.id) return { error: "Sin permisos" };

    await prisma.voteSnapshot.delete({ where: { id: snapshotId } });
    revalidatePath(`/dashboard/event/${snap.eventId}`);
    return { success: true };
}
