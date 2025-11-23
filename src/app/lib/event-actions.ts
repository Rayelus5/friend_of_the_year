'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validación estricta de títulos
const titleSchema = z.string()
    .min(3, "El título es muy corto")
    .max(50, "El título es muy largo")
    .regex(/^[\w\s\-\.,:;!¡?¿'`´"()áéíóúÁÉÍÓÚñÑüÜ]+$/, "El título contiene caracteres no permitidos.");

// --- EVENTO PRINCIPAL ---

export async function updateEvent(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) return;

    const titleRaw = formData.get('title') as string;

    // Validación
    const titleResult = titleSchema.safeParse(titleRaw);
    if (!titleResult.success) {
        // En server actions void no podemos devolver error fácilmente al cliente sin useFormState
        // Por ahora, si falla, no actualizamos el título.
        return;
    }

    const description = formData.get('description') as string;
    const galaDateStr = formData.get('galaDate') as string;
    const isPublic = formData.get('isPublic') === 'on';
    const isAnonymousVoting = formData.get('isAnonymousVoting') === 'on';

    let galaDate: Date | null = null;
    if (galaDateStr && galaDateStr !== "") {
        const parsedDate = new Date(galaDateStr);
        if (!isNaN(parsedDate.getTime())) galaDate = parsedDate;
    }

    await prisma.event.update({
        where: { id: eventId, userId: session.user.id },
        data: {
            title: titleRaw,
            description,
            galaDate,
            isPublic,
            isAnonymousVoting
        }
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    if (isPublic) revalidatePath('/polls');
}

// ... (deleteEvent, rotateEventKey IGUAL que antes) ...
export async function deleteEvent(eventId: string) {
    const session = await auth();
    if (!session?.user) return;
    await prisma.event.delete({ where: { id: eventId, userId: session.user.id } });
    revalidatePath('/dashboard');
    redirect('/dashboard');
}

export async function rotateEventKey(eventId: string) {
    const session = await auth();
    if (!session?.user) return;
    await prisma.event.update({
        where: { id: eventId, userId: session.user.id },
        data: { accessKey: crypto.randomUUID() }
    });
    revalidatePath(`/dashboard/event/${eventId}`);
}
// ...

// --- ENCUESTAS (POLLS) - SIN FECHA OBLIGATORIA ---

export async function createEventPoll(eventId: string, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    // Fecha opcional
    const endAtStr = formData.get('endAt') as string;
    let endAt: Date | null = null;
    if (endAtStr) {
        const d = new Date(endAtStr);
        if (!isNaN(d.getTime())) endAt = d;
    }

    const participantIds = formData.getAll('participantIds') as string[];

    if (!title) return;

    const lastPoll = await prisma.poll.findFirst({
        where: { eventId },
        orderBy: { order: 'desc' }
    });
    const newOrder = (lastPoll?.order ?? 0) + 1;

    await prisma.poll.create({
        data: {
            title,
            description,
            endAt, // Puede ser null
            eventId,
            order: newOrder,
            isPublished: true,
            options: {
                create: participantIds.map((pId) => ({ participantId: pId }))
            }
        }
    });

    revalidatePath(`/dashboard/event/${eventId}`);
}

// ... (updateEventPoll igual, pero aceptando endAt null) ...
export async function updateEventPoll(pollId: string, eventId: string, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const endAtStr = formData.get('endAt') as string;
    const participantIds = formData.getAll('participantIds') as string[];

    let endAt: Date | null = null;
    if (endAtStr) {
        const d = new Date(endAtStr);
        if (!isNaN(d.getTime())) endAt = d;
    }

    await prisma.poll.update({
        where: { id: pollId },
        data: { title, description, endAt }
    });

    // Sincronizar Participantes
    const currentOptions = await prisma.option.findMany({ where: { pollId } });
    const toDelete = currentOptions.filter(o => !participantIds.includes(o.participantId));
    for (const opt of toDelete) await prisma.option.delete({ where: { id: opt.id } });
    const currentIds = currentOptions.map(o => o.participantId);
    const toCreate = participantIds.filter(pId => !currentIds.includes(pId));
    for (const pId of toCreate) await prisma.option.create({ data: { pollId, participantId: pId } });

    revalidatePath(`/dashboard/event/${eventId}`);
}

// (deleteEventPoll y reorderEventPolls IGUAL que antes)
export async function deleteEventPoll(pollId: string, eventId: string) {
    await prisma.poll.delete({ where: { id: pollId } });
    revalidatePath(`/dashboard/event/${eventId}`);
}
export async function reorderEventPolls(items: { id: string, order: number }[], eventId: string) {
    await prisma.$transaction(items.map((item) => prisma.poll.update({ where: { id: item.id }, data: { order: item.order } })));
    revalidatePath(`/dashboard/event/${eventId}`);
}

// ... (Participantes IGUAL que antes) ...
export async function createEventParticipant(eventId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;
    if (!name) return;
    await prisma.participant.create({ data: { name, imageUrl, eventId } });
    revalidatePath(`/dashboard/event/${eventId}`);
}
export async function updateEventParticipant(participantId: string, eventId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;
    await prisma.participant.update({ where: { id: participantId }, data: { name, imageUrl } });
    revalidatePath(`/dashboard/event/${eventId}`);
}
export async function deleteEventParticipant(participantId: string, eventId: string) {
    await prisma.participant.delete({ where: { id: participantId } });
    revalidatePath(`/dashboard/event/${eventId}`);
}