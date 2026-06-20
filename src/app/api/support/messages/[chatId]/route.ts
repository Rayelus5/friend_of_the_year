import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit-redis";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ chatId: string }> }
) {
    const { chatId } = await params;

    const session = await auth();
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const rl = await rateLimit(`support:messages:${session.user.id}`, 30);
    if (!rl.allowed) return tooManyRequests(rl, "Too Many Requests");

    const chat = await prisma.supportChat.findUnique({
        where: { id: chatId },
        include: {
            user: true,
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

    if (!chat) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const isAdminOrMod =
        session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    const isParticipant =
        session.user.id === chat.userId || session.user.id === chat.adminId;

    if (!isAdminOrMod && !isParticipant) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const messages = chat.messages.map((m) => ({
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

    return NextResponse.json(messages);
}
