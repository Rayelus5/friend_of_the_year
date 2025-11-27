"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Crear un nuevo chat de soporte (usuario)
export async function createSupportChat() {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };

    // Si ya tiene un chat abierto, puedes reutilizarlo (opcional)
    const existingOpen = await prisma.supportChat.findFirst({
        where: {
            userId: session.user.id,
            isClosed: false,
        },
        select: { id: true },
    });

    if (existingOpen) {
        return { chatId: existingOpen.id };
    }

    const chat = await prisma.supportChat.create({
        data: {
            userId: session.user.id,
            isClosed: false,
        },
        select: { id: true },
    });

    // Notificar a todos los admins de que hay nuevo ticket
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
    });

    if (admins.length > 0) {
        await prisma.notification.createMany({
            data: admins.map((admin) => ({
                adminUserId: admin.id,
                message: "Nuevo ticket de soporte abierto",
                link: `/admin/chats/${chat.id}`,
            })),
        });
        revalidatePath("/admin/notifications");
    }

    revalidatePath("/admin/chats");
    revalidatePath("/dashboard/support");

    return { chatId: chat.id };
}

// Enviar mensaje (usuario o admin)
export async function sendSupportMessage(chatId: string, content: string) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };
    if (!content.trim()) return { error: "Mensaje vacío" };

    const chat = await prisma.supportChat.findUnique({
        where: { id: chatId },
        include: { user: true },
    });

    if (!chat) return { error: "Chat no encontrado" };

    const isAdminOrMod =
        session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    // Seguridad básica: el usuario solo puede escribir en SUS chats
    // y los admins en cualquiera
    if (!isAdminOrMod && chat.userId !== session.user.id) {
        return { error: "No autorizado a escribir en este chat" };
    }

    const message = await prisma.chatMessage.create({
        data: {
            chatId,
            senderId: session.user.id,
            content,
        },
        select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            sender: { select: { id: true, name: true } },
        },
    });

    // Actualizar lastMessageAt
    await prisma.supportChat.update({
        where: { id: chatId },
        data: { lastMessageAt: new Date() },
    });

    // Notificación a admin cuando escribe el usuario
    if (session.user.id === chat.userId) {
        // si hay admin asignado, se lo mandamos a él; si no, a todos los admins
        if (chat.adminId) {
            await prisma.notification.create({
                data: {
                    adminUserId: chat.adminId,
                    message: `Nuevo mensaje de ${chat.user.name} en soporte`,
                    link: `/admin/chats/${chat.id}`,
                },
            });
        } else {
            const admins = await prisma.user.findMany({
                where: { role: "ADMIN" },
                select: { id: true },
            });
            if (admins.length > 0) {
                await prisma.notification.createMany({
                    data: admins.map((admin) => ({
                        adminUserId: admin.id,
                        message: `Nuevo mensaje de ${chat.user.name} en soporte`,
                        link: `/admin/chats/${chat.id}`,
                    })),
                });
            }
        }
        revalidatePath("/admin/notifications");
    }

    revalidatePath(`/admin/chats/${chatId}`);
    revalidatePath(`/dashboard/support/${chatId}`);

    return { message };
}

// Asignarse un chat (admin)
export async function assignChat(chatId: string) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
        return { error: "Solo admins o moderadores" };
    }

    const chat = await prisma.supportChat.update({
        where: { id: chatId },
        data: { adminId: session.user.id },
        select: { id: true, adminId: true },
    });

    revalidatePath("/admin/chats");
    revalidatePath(`/admin/chats/${chatId}`);

    return { chat };
}

// Cerrar chat (admin)
export async function closeChat(chatId: string) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
        return { error: "Solo admins o moderadores" };
    }

    const chat = await prisma.supportChat.update({
        where: { id: chatId },
        data: { isClosed: true },
        select: { id: true, isClosed: true },
    });

    revalidatePath("/admin/chats");
    revalidatePath(`/admin/chats/${chatId}`);

    return { chat };
}

// Reabrir chat (admin / moderador)
export async function reopenChat(chatId: string) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };

    const isAdminOrMod =
        session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    if (!isAdminOrMod) {
        return { error: "Solo admins o moderadores" };
    }

    const chat = await prisma.supportChat.update({
        where: { id: chatId },
        data: { isClosed: false },
        select: { id: true, isClosed: true },
    });

    revalidatePath("/admin/chats");
    revalidatePath(`/admin/chats/${chatId}`);
    revalidatePath("/dashboard/support");

    return { chat };
}

// Eliminar chat (admin / moderador)
export async function deleteSupportChat(chatId: string) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };

    const isAdminOrMod =
        session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    if (!isAdminOrMod) {
        return { error: "Solo admins o moderadores" };
    }

    // Gracias al onDelete: Cascade en ChatMessage, se borran todos sus mensajes
    await prisma.supportChat.delete({
        where: { id: chatId },
    });

    revalidatePath("/admin/chats");
    revalidatePath("/dashboard/support");

    return { success: true };
}
