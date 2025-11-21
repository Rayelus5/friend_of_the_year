"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Vote, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

type EventSummary = {
    slug: string;
    title: string;
    description: string | null;
    createdAt: Date;
    tags: string[];
    _count: {
        participants: number;
        polls: number;
    };
    user: {
        name: string;
        username: string;
        image: string | null;
    };
};

// Variante para la animación de entrada (controlada por el padre)
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 50, damping: 15 }
    }
};

export default function PublicEventCard({ event }: { event: EventSummary }) {
    return (
        <motion.div variants={cardVariants} layout>
            <Link
                href={`/e/${event.slug}`}
                className="group relative flex flex-col h-full bg-neutral-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/40 transition-colors duration-500"
            >
                {/* Efecto Hover: Glow de fondo */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-transparent to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-sky-600/10 transition-all duration-500 ease-out" />

                <div className="p-7 flex-1 relative z-10 flex flex-col">

                    {/* Header: Autor y Fecha */}
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden relative border border-white/10">
                            {event.user.image ? (
                                <img src={event.user.image} alt={event.user.name?.charAt(0)} className="w-full h-full object-cover text-center text-[12px] content-center" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                    {event.user.name?.[0] || "?"}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                            <div className="flex flex-col items-start">
                                <span className="text-gray-300">{event.user.name || "Anónimo"}</span>
                                <span className="max-w-[120px] text-gray-600 text-[11px] align-middle truncate ...">@{event.user.username || "@username"}</span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                            <span className="bg-white/5 px-3 py-1 rounded-full">{formatDistanceToNow(event.createdAt, { addSuffix: true, locale: es })}</span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-1 tracking-tight">
                        {event.title}
                    </h3>

                    <p className="text-sm text-gray-400 mb-6 line-clamp-2 flex-1 leading-relaxed">
                        {event.description || "Sin descripción disponible para este evento."}
                    </p>

                    {/* Stats & Footer */}
                    <div className="mt-auto space-y-5">
                        {/* Badges */}
                        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                <Users size={12} className="text-blue-400" />
                                <span>{event._count.participants} Nominados</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                <Vote size={12} className="text-purple-400" />
                                <span>{event._count.polls} Categorías</span>
                            </div>
                        </div>

                        {/* Tags y Botón Flecha */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex flex-wrap gap-2">
                                {event.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[10px] text-gray-500 font-medium">#{tag}</span>
                                ))}
                                {event.tags.length > 2 && <span className="text-[10px] text-gray-600">+{event.tags.length - 2}</span>}
                            </div>

                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-110 group-hover:-rotate-45">
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}