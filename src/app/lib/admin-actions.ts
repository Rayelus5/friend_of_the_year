'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper para verificar permisos de admin
async function checkAdminPermissions() {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;

    if (!session || (role !== 'ADMIN' && role !== 'MODERATOR')) {
        throw new Error("Acceso denegado: Se requieren permisos de administrador.");
    }
    return session.user;
}

// --- GESTIÓN DE EVENTOS (REVISIÓN) ---

export async function approveEvent(eventId: string) {
    const admin = await checkAdminPermissions();

    const event = await prisma.event.update({
        where: { id: eventId },
        data: {
            status: 'APPROVED',
            isPublic: true, // Al aprobar, se hace público automáticamente
            reviewReason: null // Limpiamos cualquier motivo de rechazo previo
        },
        include: { user: true }
    });

    // Crear notificación para el usuario
    await prisma.notification.create({
        data: {
            userId: event.userId,
            adminUserId: admin.id!,
            message: `✅ Tu evento "${event.title}" ha sido aprobado y publicado en el directorio.`,
            link: `/dashboard/event/${event.id}`,
            isRead: false
        }
    });

    revalidatePath('/admin/reviews');
    revalidatePath('/polls'); // Actualizar el explorador público
}

export async function rejectEvent(eventId: string, reason: string) {
    const admin = await checkAdminPermissions();

    const event = await prisma.event.update({
        where: { id: eventId },
        data: {
            status: 'DENIED',
            isPublic: false,
            reviewReason: reason
        },
        include: { user: true }
    });

    // Notificar al usuario con el motivo
    await prisma.notification.create({
        data: {
            userId: event.userId,
            adminUserId: admin.id!,
            message: `⚠️ Tu evento "${event.title}" ha sido rechazado. Motivo: ${reason}`,
            link: `/dashboard/event/${event.id}`,
            isRead: false
        }
    });

    revalidatePath('/admin/reviews');
}

// --- GESTIÓN DE USUARIOS ---

export async function toggleIpBan(userId: string) {
    await checkAdminPermissions();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await prisma.user.update({
        where: { id: userId },
        data: { ipBan: !user.ipBan }
    });

    revalidatePath('/admin/users');
}