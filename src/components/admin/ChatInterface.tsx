"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { sendSupportMessage } from "@/app/lib/support-actions";
import { Zoomies } from 'ldrs/react'
import 'ldrs/react/Zoomies.css'
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

type ChatUser = {
    id: string;
    name: string | null;
};

type ChatMessageType = {
    id: string;
    content: string;
    createdAt: string;
    sender: ChatUser;
    senderId: string;
};

type ChatInterfaceProps = {
    chatId: string;
    initialMessages: ChatMessageType[];
    currentUserId: string;
    isClosed: boolean;
    otherUserLabel?: string;
};

export default function ChatInterface({
    chatId,
    initialMessages,
    currentUserId,
    isClosed,
    otherUserLabel,
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    const isOwn = (msg: ChatMessageType) => msg.senderId === currentUserId;

    // Scroll al final cuando cambien los mensajes
    // useEffect(() => {
    //     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // }, [messages.length]);

    // Función de sincronización reutilizable
    const fetchMessages = async () => {
        try {
            setSyncError(null);
            setIsSyncing(true);

            const res = await fetch(`/api/support/messages/${chatId}`, {
                cache: "no-store",
            });
            if (!res.ok) {
                setSyncError("Error al sincronizar mensajes.");
                return;
            }

            const data: ChatMessageType[] = await res.json();

            setMessages((prev) => {
                if (
                    prev.length === data.length &&
                    prev[prev.length - 1]?.id === data[data.length - 1]?.id
                ) {
                    return prev;
                }
                return data;
            });
        } catch (err) {
            console.error("Error fetching chat messages", err);
            setSyncError("Error de conexión al actualizar el chat.");
        } finally {
            setIsSyncing(false);
        }
    };

    // Polling más inteligente:
    // - Solo mientras el chat está abierto
    // - Solo cuando la pestaña está visible
    useEffect(() => {
        let isMounted = true;
        let intervalId: number | undefined;

        const startPolling = () => {
            if (!isMounted) return;
            if (typeof window === "undefined") return;

            // Limpia cualquier intervalo previo
            if (intervalId) window.clearInterval(intervalId);

            // Si el chat está cerrado, no seguimos haciendo polling continuo
            if (isClosed) return;

            // Frecuencia: 4s mientras la pestaña está activa
            intervalId = window.setInterval(() => {
                if (document.hidden) return;
                fetchMessages();
            }, 4000);
        };

        // Primera carga siempre
        fetchMessages();

        if (typeof document !== "undefined") {
            const handleVisibility = () => {
                if (document.hidden) {
                    if (intervalId) window.clearInterval(intervalId);
                } else {
                    // Al volver, sincronizamos una vez y retomamos polling
                    fetchMessages();
                    startPolling();
                }
            };

            document.addEventListener("visibilitychange", handleVisibility);

            // Arrancamos polling
            startPolling();

            return () => {
                isMounted = false;
                if (intervalId) window.clearInterval(intervalId);
                document.removeEventListener("visibilitychange", handleVisibility);
            };
        }

        return () => {
            isMounted = false;
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [chatId, isClosed]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isClosed) return;

        const optimistic: ChatMessageType = {
            id: `optimistic-${Date.now()}`,
            content: input,
            createdAt: new Date().toISOString(),
            senderId: currentUserId,
            sender: { id: currentUserId, name: "Tú" },
        };

        setMessages((prev) => [...prev, optimistic]);
        setInput("");
        setIsSending(true);

        try {
            const res = await sendSupportMessage(chatId, optimistic.content);

            if (res?.error) {
                console.error(res.error);
                setSyncError(res.error);
            }

            // Forzamos una sincronización inmediata para sustituir el mensaje "optimista"
            await fetchMessages();
        } catch (err) {
            console.error(err);
            setSyncError("Error de conexión al enviar el mensaje.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[70vh] max-h-[600px] border border-white/10 rounded-xl bg-neutral-950/60">
            {/* Cabecera simple */}
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                <div className="text-sm text-gray-300 flex items-center justify-between w-full">
                    <div>
                        Chat de soporte
                        {otherUserLabel && (
                            <span className="ml-1 text-xs text-gray-500">
                                · {otherUserLabel}
                            </span>
                        )}
                    </div>

                    <span className="ml-2 text-[10px] text-white bg-green-600/20 px-2 py-1 rounded-full opacity-90">
                        {isSyncing ? "Cargando..." : "Conectado"}
                    </span>
                </div>
                {isClosed && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                        Cerrado
                    </span>
                )}
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm">
                {messages.length === 0 && (
                    <p className="text-gray-500 text-center mt-4">
                        No hay mensajes todavía. Escribe el primero.
                    </p>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${
                            isOwn(msg) ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-xs md:max-w-md min-w-[100px] px-3 py-2 rounded-lg text-md ${
                                isOwn(msg)
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-neutral-800 text-gray-100 rounded-bl-none"
                            } wrap-break-word `}
                        >
                            {!isOwn(msg) && (
                                <div className="text-[12px] text-gray-400 mb-0.5">
                                    {msg.sender.name ?? "Usuario"}
                                </div>
                            )}
                            <div>{msg.content}</div>
                            <div className="mt-1 text-[9px] text-gray-300/70 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Mensaje de error de sync opcional */}
            {syncError && (
                <div className="px-4 pb-2 text-[11px] text-red-400 bg-red-500/5 border-t border-red-500/20 flex items-center justify-between">
                    <span>{syncError}</span>
                    <button
                        onClick={fetchMessages}
                        className="text-xs underline underline-offset-2 cursor-pointer"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                className="px-4 py-3 border-t border-white/10 flex gap-2"
            >
                <input
                    type="text"
                    value={input}
                    maxLength={1000}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isClosed || isSending}
                    placeholder={isClosed ? "Chat cerrado" : "Escribe tu mensaje..."}
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={isClosed || isSending || !input.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:opacity-60 cursor-pointer flex items-center justify-center min-w-[90px]"
                >
                    {isSending ? <Bouncy size={16} color="white" /> : "Enviar"}
                </button>
            </form>
        </div>
    );
}