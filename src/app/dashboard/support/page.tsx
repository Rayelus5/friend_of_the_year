import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessagesSquare, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import CreateTicketButton from "@/components/dashboard/CreateTicketButton";
import Avatar from "@/components/ui/Avatar";

export default async function SupportPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const chats = await prisma.supportChat.findMany({
        where: { userId: session.user.id },
        orderBy: { lastMessageAt: "desc" },
        include: {
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
    });

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Soporte Técnico</h1>
                    <p className="text-gray-400 text-sm">Tus conversaciones con el equipo de Pollnow.</p>
                </div>
                <CreateTicketButton />
            </div>

            {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/10 rounded-2xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                        <MessagesSquare className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">No tienes tickets</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">Crea uno nuevo si necesitas ayuda; el equipo te responderá por aquí.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {chats.map((chat) => (
                        <Link
                            key={chat.id}
                            href={`/dashboard/support/${chat.id}`}
                            className="group flex items-center gap-4 bg-neutral-900/50 border-2 border-white/10 p-4 rounded-2xl hover:border-blue-500/40 transition-colors"
                        >
                            <Avatar name="Soporte" variant="support" size="lg" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-white font-bold group-hover:text-blue-400 transition-colors">
                                        Ticket #{chat.id.slice(0, 8)}
                                    </h3>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border-2 ${chat.isClosed
                                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                            }`}
                                    >
                                        {chat.isClosed ? <Lock size={10} /> : <CheckCircle2 size={10} />}
                                        {chat.isClosed ? "Cerrado" : "Abierto"}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 truncate">
                                    {chat.messages[0]?.content || "Sin mensajes"}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatDistanceToNow(chat.lastMessageAt, { addSuffix: true, locale: es })}
                                </span>
                                <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}