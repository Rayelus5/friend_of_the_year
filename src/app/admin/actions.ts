'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- PARTICIPANTES ---

export async function createParticipant(formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;

    if (!name) return;

    await prisma.participant.create({
        data: { name, imageUrl }
    });

    revalidatePath('/admin/participants');
}

export async function deleteParticipant(id: string) {
    await prisma.participant.delete({ where: { id } });
    revalidatePath('/admin/participants');
}

// --- ENCUESTAS (POLLS) ---

export async function createPoll(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const endAt = formData.get('endAt') as string;

    // Obtenemos todos los IDs de participantes seleccionados
    // Nota: En HTML los checkboxes con el mismo nombre envían múltiples valores
    const participantIds = formData.getAll('participantIds') as string[];

    if (!title || !endAt) return;

    await prisma.poll.create({
        data: {
            title,
            description,
            endAt: new Date(endAt),
            votingType: 'SINGLE', // MVP: Siempre single choice por ahora
            isPublished: true,
            options: {
                create: participantIds.map((pId) => ({
                    participantId: pId,
                    // Opcional: Podríamos añadir un campo "subtitle" en el form si quisiéramos
                }))
            }
        }
    });

    revalidatePath('/admin/polls');
    revalidatePath('/'); // Para actualizar la Home
}

export async function deletePoll(id: string) {
    await prisma.poll.delete({ where: { id } });
    revalidatePath('/admin/polls');
    revalidatePath('/');
}