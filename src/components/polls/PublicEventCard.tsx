"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Vote, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Bouncy } from "ldrs/react";
import { LineSpinner } from 'ldrs/react'
import { DotPulse } from 'ldrs/react'
import 'ldrs/react/DotPulse.css'
import 'ldrs/react/LineSpinner.css'
import "ldrs/react/Bouncy.css";

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
    const [loading, setLoading] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Evita doble click mientras está cargando
        if (loading) {
            e.preventDefault();
            return;
        }
        setLoading(true);
    };

    return (
        <motion.div variants={cardVariants} layout>
            <Link
                href={`/e/${event.slug}`}
                onClick={handleClick}
                className={`group relative flex flex-col h-full bg-neutral-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/40 transition-colors duration-500 ${
                    loading ? "opacity-80 pointer-events-none" : ""
                }`}
            >
                {/* Efecto Hover: Glow de fondo */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-transparent to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-sky-600/10 transition-all duration-500 ease-out" />

                {/* Overlay suave mientras carga (opcional) */}
                {loading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[5px]">
                        {/* <Bouncy size="40" speed="1.75" color="#ffffff" /> */}
                        <DotPulse
                        size="60"
                        speed="1.3"
                        color="white" 
                        />
                    </div>
                )}

                <div className="p-7 flex-1 relative z-10 flex flex-col">

                    {/* Header: Autor y Fecha */}
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden relative border border-white/10">
                            {event.user.image ? (
                                <img
                                    src={event.user.image}
                                    alt={event.user.name?.charAt(0)}
                                    className="w-full h-full object-cover text-center text-[12px] content-center"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                    {event.user.name?.[0] || "?"}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <div className="flex flex-col items-start">
                                <span className="text-gray-300">{event.user.name || "Anónimo"}</span>
                                <span className="max-w-[120px] text-gray-600 text-[11px] align-middle truncate ...">
                                    @{event.user.username || "@username"}
                                </span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                            <span className="text-[11px] bg-white/5 px-3 py-1 rounded-full">
                                {formatDistanceToNow(event.createdAt, {
                                    addSuffix: true,
                                    locale: es
                                })
                                    .replace(/alrededor de /i, "")
                                    .replace(/^./i, (c) => c.toUpperCase())}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-1 tracking-tight">
                        {event.title}
                    </h3>

                    <p className="text-sm text-gray-400 mb-6 line-clamp-2 flex-1 leading-relaxed">
                        {event.description || "Sin descripción disponible para este evento."}
                    </p>

                    {/* Stats & Footer */}
                    <div className="mt-auto space-y-3 sm:space-y-5">
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

                        {/* Tags y Botón Flecha / Loader */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex flex-wrap gap-2">
                                {event.tags.slice(0, 2).map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[10px] text-gray-500 font-medium"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                                {event.tags.length > 2 && (
                                    <span className="text-[10px] text-gray-600">
                                        +{event.tags.length - 2}
                                    </span>
                                )}
                            </div>

                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-110 group-hover:-rotate-45">
                                {loading ? (
                                    // Default values shown
                                    <LineSpinner
                                    size="40"
                                    stroke="3"
                                    speed="1.5"
                                    color="white" 
                                    />
                                    
                                ) : (
                                    <ArrowRight size={14} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
