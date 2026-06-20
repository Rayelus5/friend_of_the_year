"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { sendSupportMessage } from "@/app/lib/support-actions";
import { getPusherClient, PUSHER_EVENTS } from "@/lib/pusher";
import { isToday, isYesterday, format } from "date-fns";
import { es } from "date-fns/locale";
import { Send, Lock, AlertTriangle, MessageSquare } from "lucide-react";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import Avatar from "@/components/ui/Avatar";

type ChatUser = {
    id: string;
    name: string | null;
    image?: string | null;
};

type ChatMessageType = {
    id: string;
    content: string;
    createdAt: string;
    sender: ChatUser;
    senderId: string;
};

type OtherParty = {
    name: string | null;
    image?: string | null;
    email?: string | null;
    isSupportTeam?: boolean;
};

type ChatInterfaceProps = {
    chatId: string;
    initialMessages: ChatMessageType[];
    currentUserId: string;
    isClosed: boolean;
    otherParty: OtherParty;
};

const GROUP_GAP_MS = 5 * 60 * 1000; // 5 min: corta el grupo de burbujas

function dayLabel(date: Date): string {
    if (isToday(date)) return "Hoy";
    if (isYesterday(date)) return "Ayer";
    return format(date, "d 'de' MMMM yyyy", { locale: es });
}

export default function ChatInterface({
    chatId,
    initialMessages,
    currentUserId,
    isClosed,
    otherParty,
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    // Las fechas/horas se formatean en la zona horaria local del navegador, que no
    // coincide con la del servidor (UTC) → renderizamos los mensajes solo tras montar
    // para evitar errores de hidratación. El chat es interactivo (re-fetch al montar).
    const [mounted, setMounted] = useState(false);

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const nearBottomRef = useRef(true);

    const isOwn = (msg: ChatMessageType) => msg.senderId === currentUserId;

    // Scroll SOLO dentro del contenedor de mensajes (nunca mueve la página).
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior });
    };

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };

    const fetchMessages = async () => {
        try {
            setSyncError(null);
            setIsSyncing(true);
            const res = await fetch(`/api/support/messages/${chatId}`, { cache: "no-store" });
            if (!res.ok) {
                setSyncError("Error al sincronizar mensajes.");
                return;
            }
            const data: ChatMessageType[] = await res.json();
            setMessages(data);
        } catch (err) {
            console.error("Error fetching chat messages", err);
            setSyncError("Error de conexión al actualizar el chat.");
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchMessages();

        const pusher = getPusherClient();
        const channel = pusher.subscribe(`private-chat-${chatId}`);

        channel.bind(PUSHER_EVENTS.CHAT_NEW_MESSAGE, (newMsg: ChatMessageType) => {
            setMessages(prev => {
                // Sustituir mensaje optimista del mismo sender por el real, o añadir si es ajeno
                const withoutOptimistic = prev.filter(
                    m => !(m.id.startsWith("optimistic-") && m.senderId === newMsg.senderId)
                );
                if (withoutOptimistic.some(m => m.id === newMsg.id)) return withoutOptimistic;
                return [...withoutOptimistic, newMsg];
            });
        });

        const handleVisibility = () => {
            if (!document.hidden) fetchMessages();
        };
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`private-chat-${chatId}`);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId]);

    useEffect(() => setMounted(true), []);

    // Scroll inicial al fondo una vez renderizada la lista (tras montar).
    useEffect(() => {
        if (mounted) scrollToBottom("auto");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]);

    // Auto-scroll SOLO para mensajes entrantes (no cuando el propio usuario envía) y
    // únicamente si ya estaba cerca del fondo. Nunca mueve la página.
    useEffect(() => {
        const last = messages[messages.length - 1];
        if (!last) return;
        if (last.senderId !== currentUserId && nearBottomRef.current) {
            scrollToBottom("smooth");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length]);

    const autoGrow = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    };

    const submit = async () => {
        if (!input.trim() || isClosed || isSending) return;

        const optimistic: ChatMessageType = {
            id: `optimistic-${Date.now()}`,
            content: input.trim(),
            createdAt: new Date().toISOString(),
            senderId: currentUserId,
            sender: { id: currentUserId, name: "Tú" },
        };

        setMessages((prev) => [...prev, optimistic]);
        setInput("");
        setIsSending(true);
        // Mantener el foco en el input y resetear su altura, SIN hacer scroll.
        requestAnimationFrame(() => {
            const el = textareaRef.current;
            if (el) { el.style.height = "auto"; el.focus(); }
        });

        try {
            const res = await sendSupportMessage(chatId, optimistic.content);
            if (res?.error) {
                setMessages(prev => prev.filter(m => m.id !== optimistic.id));
                setSyncError(res.error);
            }
            // Pusher entrega el mensaje real y sustituye el optimista automáticamente
        } catch (err) {
            console.error(err);
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setSyncError("Error de conexión al enviar el mensaje.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submit();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const partyName = otherParty.isSupportTeam
        ? "Equipo de soporte"
        : otherParty.name || otherParty.email || "Usuario";
    const partySubtitle = otherParty.isSupportTeam
        ? "Atención al cliente · Pollnow"
        : otherParty.email ?? "";

    return (
        <div className="flex flex-col h-full min-h-0 border-2 border-white/10 rounded-2xl bg-neutral-950/60 overflow-hidden">
            {/* Cabecera */}
            <div className="shrink-0 px-4 py-3 border-b-2 border-white/10 bg-neutral-900/40 flex items-center gap-3">
                <Avatar
                    name={partyName}
                    image={otherParty.image}
                    variant={otherParty.isSupportTeam ? "support" : "user"}
                    size="md"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white truncate">{partyName}</h2>
                        {isClosed && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border-2 border-red-500/30">
                                <Lock size={10} /> Cerrado
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${isSyncing ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}
                        />
                        {isSyncing ? "Conectando…" : partySubtitle || "Conectado"}
                    </div>
                </div>
            </div>

            {/* Mensajes */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-1"
            >
                {!mounted ? (
                    <div className="h-full flex items-center justify-center">
                        <Bouncy size={28} color="#3b82f6" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-gray-500">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                            <MessageSquare className="w-7 h-7 text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">Aún no hay mensajes</p>
                        <p className="text-xs text-gray-600">Escribe el primero para iniciar la conversación.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const own = isOwn(msg);
                        const date = new Date(msg.createdAt);
                        const prev = messages[i - 1];
                        const prevDate = prev ? new Date(prev.createdAt) : null;

                        const showDayDivider =
                            !prevDate || prevDate.toDateString() !== date.toDateString();
                        const firstOfGroup =
                            showDayDivider ||
                            !prev ||
                            prev.senderId !== msg.senderId ||
                            date.getTime() - (prevDate?.getTime() ?? 0) > GROUP_GAP_MS;

                        return (
                            <div key={msg.id}>
                                {showDayDivider && (
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-white/8" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                                            {dayLabel(date)}
                                        </span>
                                        <div className="flex-1 h-px bg-white/8" />
                                    </div>
                                )}

                                <div className={`flex gap-2.5 ${own ? "justify-end" : "justify-start"} ${firstOfGroup ? "mt-3" : "mt-0.5"}`}>
                                    {/* Avatar (solo mensajes ajenos, solo primero del grupo) */}
                                    {!own && (
                                        <div className="w-8 shrink-0 self-end">
                                            {firstOfGroup && (
                                                <Avatar name={msg.sender.name} image={msg.sender.image} size="sm" />
                                            )}
                                        </div>
                                    )}

                                    <div className={`max-w-[78%] md:max-w-[65%] flex flex-col ${own ? "items-end" : "items-start"}`}>
                                        {firstOfGroup && !own && (
                                            <span className="text-[11px] text-gray-500 mb-1 ml-1">
                                                {msg.sender.name ?? "Usuario"}
                                            </span>
                                        )}
                                        <div
                                            className={`px-3.5 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words ${own
                                                ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                                                : "bg-neutral-800 text-gray-100 rounded-2xl rounded-bl-md"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-gray-600 mt-1 px-1">
                                            {format(date, "HH:mm")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Error de sincronización */}
            {syncError && (
                <div className="shrink-0 px-4 py-2 text-[11px] text-red-300 bg-red-500/5 border-t-2 border-red-500/20 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5"><AlertTriangle size={13} /> {syncError}</span>
                    <button
                        onClick={fetchMessages}
                        className="font-bold underline underline-offset-2 cursor-pointer hover:text-red-200"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Composer */}
            <form
                onSubmit={handleSubmit}
                className="shrink-0 px-4 py-3 border-t-2 border-white/10 bg-neutral-900/40 flex items-end gap-2"
            >
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        rows={1}
                        maxLength={1000}
                        onChange={(e) => { setInput(e.target.value); autoGrow(); }}
                        onKeyDown={handleKeyDown}
                        disabled={isClosed}
                        placeholder={isClosed ? "Este chat está cerrado" : "Escribe tu mensaje…"}
                        className="w-full resize-none bg-black/60 border-2 border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60 max-h-[140px] leading-relaxed"
                    />
                    {input.length > 800 && (
                        <span className="absolute -top-5 right-1 text-[10px] text-gray-600 font-mono">
                            {input.length}/1000
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isClosed || isSending || !input.trim()}
                    aria-label="Enviar mensaje"
                    className="h-11 w-11 shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                    {isSending ? <Bouncy size={18} color="white" /> : <Send size={18} />}
                </button>
            </form>
        </div>
    );
}
