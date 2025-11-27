'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs"; // 👈 Añade esto si no estaba

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

export async function toggleUserBan(userId: string) {
    await checkAdminPermissions();
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await prisma.user.update({
        where: { id: userId },
        data: { ipBan: !user.ipBan } 
    });
    
    revalidatePath(`/admin/users/${userId}`);
}

export async function changeUserRole(userId: string, newRole: 'USER' | 'ADMIN' | 'MODERATOR') {
    await checkAdminPermissions();

    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
    });

    revalidatePath(`/admin/users/${userId}`);
}

export async function deleteUser(userId: string) {
    await checkAdminPermissions();
    
    // El borrado en cascada de Prisma se encargará de eventos, votos, etc.
    await prisma.user.delete({ where: { id: userId } });
    
    revalidatePath('/admin/users');
}

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

export async function markNotificationRead(notificationId: string) {
    const session = await checkAdminPermissions(); // Reutiliza tu helper de seguridad
    
    await prisma.notification.update({
        where: { id: notificationId, adminUserId: session.id },
        data: { isRead: true }
    });
    
    revalidatePath('/admin/notifications');
}

// ─────────────────────────────────────────────
// GESTIÓN AVANZADA DE USUARIOS (PANEL ADMIN)
// ─────────────────────────────────────────────

type AdminUpdateUserPayload = {
    name: string;
    username: string;
    email: string;
    stripePriceId: string | null;
    subscriptionStatus: string;              // "free" | "active"
    subscriptionEndDate: string | null;      // fecha en formato "YYYY-MM-DD" o null
    cancelAtPeriodEnd: boolean;
};

export async function adminUpdateUser(
    userId: string,
    data: AdminUpdateUserPayload
) {
    await checkAdminPermissions();

    const {
        name,
        username,
        email,
        stripePriceId,
        subscriptionStatus,
        subscriptionEndDate,
        cancelAtPeriodEnd,
    } = data;

    // Normalizamos strings
    const safeName = (name || "").trim();
    const safeUsername = (username || "").trim();
    const safeEmail = (email || "").trim();

    if (!safeName || !safeUsername || !safeEmail) {
        return { error: "Nombre, usuario y email son obligatorios." };
    }

    // Validar username único (excluyendo al propio userId)
    const existingUsername = await prisma.user.findFirst({
        where: {
            username: safeUsername,
            NOT: { id: userId },
        },
        select: { id: true },
    });

    if (existingUsername) {
        return { error: "Ese nombre de usuario ya está en uso por otro usuario." };
    }

    // Validar email único
    const existingEmail = await prisma.user.findFirst({
        where: {
            email: safeEmail,
            NOT: { id: userId },
        },
        select: { id: true },
    });

    if (existingEmail) {
        return { error: "Ese email ya está en uso por otro usuario." };
    }

    // Parsear fecha de fin de suscripción
    let subscriptionEnd: Date | null = null;
    if (subscriptionEndDate) {
        const d = new Date(subscriptionEndDate);
        if (!isNaN(d.getTime())) {
            subscriptionEnd = d;
        }
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            name: safeName,
            username: safeUsername,
            email: safeEmail,
            stripePriceId: stripePriceId || null,
            subscriptionStatus: subscriptionStatus || "free",
            subscriptionEndDate: subscriptionEnd,
            cancelAtPeriodEnd,
        },
    });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}

export async function adminSetUserPassword(userId: string, newPassword: string) {
    await checkAdminPermissions();

    const pwd = (newPassword || "").trim();

    if (pwd.length < 6) {
        return { error: "La nueva contraseña debe tener al menos 6 caracteres." };
    }

    const hash = await bcrypt.hash(pwd, 10);

    await prisma.user.update({
        where: { id: userId },
        data: {
            passwordHash: hash,
        },
    });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}