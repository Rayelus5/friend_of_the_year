import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import ChatInterface from "@/components/admin/ChatInterface";
import {
    assignChat,
    closeChat,
    reopenChat,
    deleteSupportChat,
} from "@/app/lib/support-actions";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCheck, Lock, RotateCcw, Trash2, CheckCircle2 } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

// Server actions wrapper para usar en <form action={...}>
async function assignChatAction(formData: FormData) {
    "use server";
    const chatId = formData.get("chatId");
    if (typeof chatId !== "string") return;
    await assignChat(chatId);
}

async function closeChatAction(formData: FormData) {
    "use server";
    const chatId = formData.get("chatId");
    if (typeof chatId !== "string") return;
    await closeChat(chatId);
}

async function reopenChatAction(formData: FormData) {
    "use server";
    const chatId = formData.get("chatId");
    if (typeof chatId !== "string") return;
    await reopenChat(chatId);
}

async function deleteChatAction(formData: FormData) {
    "use server";
    const chatId = formData.get("chatId");
    if (typeof chatId !== "string") return;
    await deleteSupportChat(chatId);
    redirect("/admin/chats");
}

type PageProps = {
    params: Promise<{ chatId: string }>;
};

export default async function AdminChatDetailPage({ params }: PageProps) {
    const { chatId } = await params;

    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const isAdminOrMod =
        session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    if (!isAdminOrMod) {
        notFound();
    }

    if (!chatId) {
        notFound();
    }

    const chat = await prisma.supportChat.findUnique({
        where: { id: chatId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            messages: {
                orderBy: { createdAt: "asc" },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
        },
    });

    if (!chat) notFound();

    let assignedAdminName: string | null = null;
    if (chat.adminId) {
        const admin = await prisma.user.findUnique({
            where: { id: chat.adminId },
            select: { name: true },
        });
        assignedAdminName = admin?.name ?? null;
    }

    const initialMessages = chat.messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        sender: {
            id: m.sender.id,
            name: m.sender.name,
            image: m.sender.image,
        },
    }));

    const currentUserId = session.user.id;
    const isAssignedToCurrent =
        chat.adminId !== null && chat.adminId === currentUserId;

    return (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
            {/* Breadcrumb */}
            <Link href="/admin/chats" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit">
                <ArrowLeft size={16} /> Volver a los chats
            </Link>

            {/* Cabecera del ticket */}
            <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <Avatar name={chat.user.name} image={chat.user.image} size="lg" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold text-white truncate">{chat.user.name || "Usuario"}</h1>
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border-2 ${chat.isClosed
                                ? "bg-red-500/10 text-red-300 border-red-500/40"
                                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
                                }`}
                        >
                            {chat.isClosed ? <Lock size={11} /> : <CheckCircle2 size={11} />}
                            {chat.isClosed ? "Cerrado" : "Abierto"}
                        </span>
                        {chat.adminId && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-500/10 text-blue-300 border-2 border-blue-500/30">
                                Asignado a: {isAssignedToCurrent ? "Tú" : assignedAdminName ?? "Otro administrador"}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{chat.user.email}</p>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2 shrink-0">
                    <form action={assignChatAction}>
                        <input type="hidden" name="chatId" value={chat.id} />
                        <button
                            type="submit"
                            disabled={isAssignedToCurrent}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <UserCheck size={14} />
                            {isAssignedToCurrent ? "Asignado a ti" : chat.adminId ? "Reasignarme" : "Asignarme"}
                        </button>
                    </form>

                    {chat.isClosed ? (
                        <form action={reopenChatAction}>
                            <input type="hidden" name="chatId" value={chat.id} />
                            <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors">
                                <RotateCcw size={14} /> Reabrir
                            </button>
                        </form>
                    ) : (
                        <form action={closeChatAction}>
                            <input type="hidden" name="chatId" value={chat.id} />
                            <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border-2 border-white/10 font-bold cursor-pointer transition-colors">
                                <Lock size={14} /> Cerrar
                            </button>
                        </form>
                    )}

                    <form action={deleteChatAction}>
                        <input type="hidden" name="chatId" value={chat.id} />
                        <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold cursor-pointer border-2 border-red-500/30 transition-colors">
                            <Trash2 size={14} /> Eliminar
                        </button>
                    </form>
                </div>
            </div>

            {/* Interfaz de Chat */}
            <div className="h-[calc(100dvh-20rem)] min-h-[480px]">
                <ChatInterface
                    chatId={chat.id}
                    initialMessages={initialMessages}
                    currentUserId={currentUserId}
                    isClosed={chat.isClosed}
                    otherParty={{ name: chat.user.name, image: chat.user.image, email: chat.user.email }}
                />
            </div>
        </main>
    );
}