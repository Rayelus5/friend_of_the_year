'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlanFromUser } from "@/lib/plans"; // <--- Importamos los planes

// --- EVENTO PRINCIPAL ---

export async function updateEvent(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) return;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const galaDateStr = formData.get('galaDate') as string;
    const isPublic = formData.get('isPublic') === 'on';
    const isAnonymousVoting = formData.get('isAnonymousVoting') === 'on';

    let galaDate: Date | null = null;
    if (galaDateStr && galaDateStr !== "") {
        const parsedDate = new Date(galaDateStr);
        if (!isNaN(parsedDate.getTime())) {
            galaDate = parsedDate;
        }
    }

    await prisma.event.update({
        where: { id: eventId, userId: session.user.id },
        data: { title, description, galaDate, isPublic, isAnonymousVoting }
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    if (isPublic) revalidatePath('/polls');
}

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

// --- PARTICIPANTES (CON LÍMITE) ---

export async function createEventParticipant(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) return;

    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;
    if (!name) return;

    // 1. OBTENER PLAN Y LÍMITES
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { _count: { select: { events: true } } } // Necesario para getPlanFromUser si usara eventos, pero aquí usaremos el user directo
    });
    if (!user) return;
    const plan = getPlanFromUser(user);

    // 2. CONTAR PARTICIPANTES ACTUALES
    const currentParticipantsCount = await prisma.participant.count({
        where: { eventId }
    });

    if (currentParticipantsCount >= plan.limits.participantsPerEvent) {
        // Como estamos en un server action void, no podemos devolver error fácilmente al toast.
        // En un refactor futuro, idealmente devolveríamos { error: ... }
        console.error("Límite de participantes alcanzado");
        return;
    }

    await prisma.participant.create({
        data: { name, imageUrl, eventId }
    });
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

// --- ENCUESTAS (CON LÍMITE Y OPCIONES) ---

export async function createEventPoll(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) return;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const endAtStr = formData.get('endAt') as string;
    const participantIds = formData.getAll('participantIds') as string[];

    // NUEVOS CAMPOS
    const votingType = formData.get('votingType') as 'SINGLE' | 'MULTIPLE' | 'LIMITED_MULTIPLE';
    const maxChoicesStr = formData.get('maxChoices') as string;
    const maxChoices = maxChoicesStr ? parseInt(maxChoicesStr) : null;

    if (!title) return;

    // 1. VALIDAR LÍMITE DE CATEGORÍAS (POLLS)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return;
    const plan = getPlanFromUser(user);

    const currentPollsCount = await prisma.poll.count({ where: { eventId } });

    if (currentPollsCount >= plan.limits.pollsPerEvent) {
        console.error("Límite de categorías alcanzado");
        return;
    }

    let endAt: Date | null = null;
    if (endAtStr) {
        const d = new Date(endAtStr);
        if (!isNaN(d.getTime())) endAt = d;
    }

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
            votingType: votingType || 'SINGLE', // Default
            maxChoices: votingType === 'LIMITED_MULTIPLE' ? maxChoices : null, // Solo guardar si es limitado
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

    // NUEVOS CAMPOS
    const votingType = formData.get('votingType') as 'SINGLE' | 'MULTIPLE' | 'LIMITED_MULTIPLE';
    const maxChoicesStr = formData.get('maxChoices') as string;
    const maxChoices = maxChoicesStr ? parseInt(maxChoicesStr) : null;

    let endAt: Date | null = null;
    if (endAtStr) {
        const d = new Date(endAtStr);
        if (!isNaN(d.getTime())) endAt = d;
    }

    await prisma.poll.update({
        where: { id: pollId },
        data: {
            title,
            description,
            endAt,
            votingType: votingType || 'SINGLE',
            maxChoices: votingType === 'LIMITED_MULTIPLE' ? maxChoices : null
        }
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

export async function deleteEventPoll(pollId: string, eventId: string) {
    await prisma.poll.delete({ where: { id: pollId } });
    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function reorderEventPolls(items: { id: string, order: number }[], eventId: string) {
    await prisma.$transaction(items.map((item) => prisma.poll.update({ where: { id: item.id }, data: { order: item.order } })));
    revalidatePath(`/dashboard/event/${eventId}`);
}