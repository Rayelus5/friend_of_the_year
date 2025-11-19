'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- EVENTO PRINCIPAL ---

export async function updateEvent(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) return;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const galaDateStr = formData.get('galaDate') as string;
    const isPublic = formData.get('isPublic') === 'on';

    // Validación de fecha segura
    let galaDate: Date | null = null;
    if (galaDateStr && galaDateStr !== "") {
        const parsedDate = new Date(galaDateStr);
        if (!isNaN(parsedDate.getTime())) {
            galaDate = parsedDate;
        }
    }

    await prisma.event.update({
        where: { id: eventId, userId: session.user.id },
        data: {
            title,
            description,
            galaDate,
            isPublic
        }
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    // Si cambiamos el slug o la privacidad, revalidamos la home pública también
    if (isPublic) revalidatePath('/polls');
}

export async function deleteEvent(eventId: string) {
    const session = await auth();
    if (!session?.user) return;

    await prisma.event.delete({
        where: { id: eventId, userId: session.user.id }
    });

    revalidatePath('/dashboard');
    redirect('/dashboard');
}

// --- SEGURIDAD (ESTA ES LA QUE TE FALTABA) ---

export async function rotateEventKey(eventId: string) {
    const session = await auth();
    if (!session?.user) return;

    // Generar nueva clave aleatoria
    const newKey = crypto.randomUUID();

    await prisma.event.update({
        where: { id: eventId, userId: session.user.id },
        data: { accessKey: newKey }
    });

    revalidatePath(`/dashboard/event/${eventId}`);
}

// --- PARTICIPANTES ---

export async function createEventParticipant(eventId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;
    if (!name) return;

    await prisma.participant.create({
        data: { name, imageUrl, eventId }
    });
    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function updateEventParticipant(participantId: string, eventId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;

    await prisma.participant.update({
        where: { id: participantId },
        data: { name, imageUrl }
    });
    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function deleteEventParticipant(participantId: string, eventId: string) {
    await prisma.participant.delete({ where: { id: participantId } });
    revalidatePath(`/dashboard/event/${eventId}`);
}

// --- ENCUESTAS (POLLS) ---

export async function createEventPoll(eventId: string, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const endAtStr = formData.get('endAt') as string;
    const participantIds = formData.getAll('participantIds') as string[];

    if (!title || !endAtStr) return;

    // Validación fecha encuesta
    const endAt = new Date(endAtStr);
    if (isNaN(endAt.getTime())) return; // Evitar crash si fecha inválida

    const lastPoll = await prisma.poll.findFirst({
        where: { eventId },
        orderBy: { order: 'desc' }
    });
    const newOrder = (lastPoll?.order ?? 0) + 1;

    await prisma.poll.create({
        data: {
            title,
            description,
            endAt,
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

export async function updateEventPoll(pollId: string, eventId: string, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const endAtStr = formData.get('endAt') as string;
    const participantIds = formData.getAll('participantIds') as string[];

    const endAt = new Date(endAtStr);

    await prisma.poll.update({
        where: { id: pollId },
        data: { title, description, endAt: isNaN(endAt.getTime()) ? undefined : endAt }
    });

    // Sincronizar Participantes
    const currentOptions = await prisma.option.findMany({ where: { pollId } });

    // Borrar desmarcados
    const toDelete = currentOptions.filter(o => !participantIds.includes(o.participantId));
    for (const opt of toDelete) {
        await prisma.option.delete({ where: { id: opt.id } });
    }

    // Crear nuevos marcados
    const currentIds = currentOptions.map(o => o.participantId);
    const toCreate = participantIds.filter(pId => !currentIds.includes(pId));
    for (const pId of toCreate) {
        await prisma.option.create({ data: { pollId, participantId: pId } });
    }

    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function deleteEventPoll(pollId: string, eventId: string) {
    await prisma.poll.delete({ where: { id: pollId } });
    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function reorderEventPolls(items: { id: string, order: number }[], eventId: string) {
    await prisma.$transaction(
        items.map((item) =>
            prisma.poll.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        )
    );
    revalidatePath(`/dashboard/event/${eventId}`);
}