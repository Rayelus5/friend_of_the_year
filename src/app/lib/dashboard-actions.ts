'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/plans";
import { redirect } from "next/navigation";

export async function createEvent(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    // 1. Verificar usuario y límites (Código existente...)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { _count: { select: { events: true } } }
    });

    if (!user) return { error: "Usuario no encontrado" };

    const plan = getPlanFromUser(user);
    const currentEvents = user._count.events;

    if (currentEvents >= plan.quota) {
        return {
            success: false,
            error: `Has alcanzado el límite de tu plan ${plan.name} (${currentEvents}/${plan.quota}). Actualiza a Premium.`
        };
    }

    // 2. Preparar datos
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    // Generar Slug único
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);

    // Calculamos la fecha actual + 2 días
    const defaultGalaDate = new Date();
    defaultGalaDate.setDate(defaultGalaDate.getDate() + 2);
    // --------------------------------------------------------

    try {
        const newEvent = await prisma.event.create({
            data: {
                title,
                description,
                slug,
                userId: session.user.id,
                isPublic: false,
                galaDate: defaultGalaDate, // <--- Guardamos la fecha calculada
                // accessKey se genera auto por el @default(uuid()) del schema
            }
        });

        return { success: true, eventId: newEvent.id };
    } catch (error) {
        console.error(error);
        return { error: "Error al crear evento" };
    }
}