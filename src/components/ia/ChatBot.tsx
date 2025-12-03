"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, ArrowUp, Sparkles } from "lucide-react";

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    async function sendMessage() {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: "user", content: input }];
        setMessages(newMessages);
        setInput("");
        setIsTyping(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            const data = await res.json();
            if (data.reply) {
                setMessages([...newMessages, { role: "assistant", content: data.reply }]);
            }
        } finally {
            setIsTyping(false);
        }
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-5 right-5 md:right-10 z-50 backdrop-blur-[3px] transition-all duration-400 font-medium cursor-pointer hover:animate-bounceDrop bounce-hover flex items-center justify-center border border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/30 text-white p-4 lg:p-5 rounded-full shadow-lg focus:outline-none hover:scale-110 hover:opacity-100 ${isOpen ? "scale-80 mr-2 opacity-50" : ""}`}
            >
                {isOpen ? <X size={22} /> : <MessageCircle size={24} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.50 }}
                            onClick={() => setIsOpen(false)} // clic fuera cierra el chat
                            className="fixed inset-0 bg-black/20 backdrop-blur-[3px] z-30"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.25 }}
                            className="fixed bottom-20 lg:bottom-23 right-5 md:right-10 lg:right-11 w-[90vw] max-w-sm lg:max-w-md h-[450px] xl:h-[600px] rounded-2xl backdrop-blur-[8px] hover:backdrop-blur-[15px] transition-colors duration-400 font-medium hover:animate-bounceDropCardBot bounce-card-bot-hover border border-white/30 hover:border-white/20 bg-white/10 hover:bg-black/20 text-white z-49 flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-3 backdrop-blur-md  bg-black/50 text-white-800 font-bold rounded-t-2xl border-b border-white/20 text-md sm:text-mds flex justify-between">
                                Pollnow Support
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/20 border border-indigo-600/40 backdrop-blur-sm items-center">
                                    <Sparkles size={14} className="text-indigo-400" />
                                    <span className="text-xs font-bold text-indigo-300 tracking-widest uppercase">AI Chat</span>
                                </div>
                            </div>

                            {/* Área de mensajes con scroll interno */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm scroll-smooth overflow-x-hidden">
                                {messages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        <span
                                            className={`inline-block px-3 py-2 rounded-lg max-w-[80%] break-words ${m.role === "user"
                                                    ? "bg-indigo-500/45 hover:bg-indigo-500/60 text-white border border-white/20 hover:border-white/40 transition-colors duration-400 cursor-pointer hover:animate-bounceDrop bounce-hover"
                                                    : "bg-gray-900/45 hover:bg-gray-900/60 text-white border border-white/20 hover:border-white/40 transition-colors duration-400 cursor-pointer hover:animate-bounceDrop bounce-hover"
                                                }`}
                                        >
                                            {m.content}
                                        </span>
                                    </div>
                                ))}

                                {/* ✨ Indicador de escritura */}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="px-3 py-2 rounded-full bg-gray-900/45 hover:bg-gray-900/60 text-white border border-white/20 hover:border-white/40 transition-colors duration-400 cursor-pointer hover:animate-bounceDrop bounce-hover flex gap-1 items-center">
                                            <span className="animate-bounce">●</span>
                                            <span className="animate-bounce [animation-delay:0.2s]">●</span>
                                            <span className="animate-bounce [animation-delay:0.4s]">●</span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 backdrop-blur-md  bg-black/50 text-white-800 font-bold rounded-2xl border-t border-white/20">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        rows={1}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Escribe tu mensaje..."
                                        className="flex-1 resize-none border border-white/30 hover:border-white/50 rounded-xl px-3 py-3 text-sm p-3 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white-800 font-semibold focus:outline-none focus:ring-1 focus:ring-white/50 transition-colors duration-500 overflow-y-auto hover:animate-bounceDropCardFast bounce-card-fast-hover"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        className="bg-indigo-500/40 hover:bg-indigo-500/50 border border-white/30 hover:border-white/30 text-white px-3 py-3 rounded-full text-sm hover:animate-bounceDrop bounce-hover cursor-pointer transition-colors duration-400"
                                    >
                                        <ArrowUp size={20}></ArrowUp>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}