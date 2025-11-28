"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Users, Lock, Eye, ChevronRight, X } from "lucide-react";
import Link from "next/link";
// import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

// Tipos actualizados
type Voter = {
    name: string;
    image: string | null;
    isAnonymous: boolean;
};

type PollDetail = {
    id: string;
    title: string;
    totalVotes: number;
    options: {
        id: string;
        name: string;
        imageUrl: string | null;
        votesCount: number;
        voters: Voter[];
    }[];
};

type StatsData = {
    totalVotes: number;
    totalPolls: number;
    votesByPoll: { name: string; votes: number }[];
    activityTimeline: { date: string; count: number }[];
    pollsDetail: PollDetail[];
    isAnonymousConfig: boolean;
};

type Props = {
    stats: StatsData | null;
    planSlug: string;
};

export default function EventStatistics({ stats, planSlug }: Props) {
    const isFree = planSlug === 'free';
    const isPlus = planSlug === 'plus';
    const [selectedPoll, setSelectedPoll] = useState<PollDetail | null>(null);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

    // Datos Mock o Reales
    const displayStats = isFree ? MOCK_STATS : (stats || {
        totalVotes: 0,
        totalPolls: 0,
        votesByPoll: [],
        activityTimeline: [],
        pollsDetail: [],
        isAnonymousConfig: true
    });

    const maxTimelineVotes = Math.max(...displayStats.activityTimeline.map(d => d.count), 1);
    const maxPollVotes = Math.max(displayStats.totalVotes, 1);

    return (
        <div className="relative min-h-[600px] space-y-8 tour-stats-section">

            {/* --- PAYWALL --- */}
            {isFree && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center animate-in fade-in duration-700">
                    {/* ... Mismo contenido de paywall anterior ... */}
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]">
                        <Lock className="text-white w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Desbloquea las Estadísticas</h3>
                    <p className="text-gray-300 max-w-md mb-8">
                        Obtén insights detallados, gráficos de participación y control total con el plan Premium.
                    </p>
                    <Link
                        href="/premium"
                        className="px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform shadow-xl"
                    >
                        Actualizar a Premium
                    </Link>
                </div>
            )}

            <div className={`space-y-8 transition-all ${isFree ? 'opacity-20 filter blur-sm pointer-events-none select-none' : ''}`}>

                {/* 1. KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KpiCard
                        title="Votos Totales"
                        value={displayStats.totalVotes}
                        icon={<TrendingUp className="text-blue-400" />}
                    />
                    <KpiCard
                        title="Categorías Activas"
                        value={displayStats.totalPolls}
                        icon={<BarChart3 className="text-purple-400" />}
                    />
                    <KpiCard
                        title="Participación"
                        value={displayStats.totalVotes > 0 ? "Activa" : "Sin datos"}
                        icon={<Users className="text-green-400" />}
                        subtext="Estado del evento"
                    />
                </div>

                
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* 2. GRÁFICO BARRAS */}
                    
                    <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 flex flex-col max-h-[400px] cursor-grab">
                        <h3 className="text-lg font-bold text-white mb-6">Rendimiento General</h3>
                        <div className="overflow-y-auto space-y-4">
                            {displayStats.votesByPoll.map((item, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-300">{item.name}</span>
                                        <span className="text-gray-500 font-mono mr-3">{item.votes} votos</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full"
                                            style={{ width: `${(item.votes / maxPollVotes) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. LISTA DETALLADA DE CATEGORÍAS (SCROLL) */}
                    <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-8 flex flex-col max-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Desglose por Categoría</h3>
                            {!isPlus && !isFree && (
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                                    Mejora a Unlimited para ver usuarios
                                </span>
                            )}
                        </div>

                        <div className="overflow-y-auto pr-2 custom-scrollbar space-y-2 flex-1">
                            {displayStats.pollsDetail.map((poll) => (
                                <button
                                    key={poll.id}
                                    onClick={() => {
                                        setSelectedPoll(poll);
                                        // Seleccionar por defecto la opción ganadora
                                        if (poll.options.length > 0) setSelectedOptionId(poll.options[0].id);
                                    }}
                                    className="w-full text-left p-4 rounded-xl bg-black/40 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group flex justify-between items-center cursor-pointer"
                                >
                                    <div>
                                        <p className="font-bold text-gray-200 text-sm group-hover:text-white">{poll.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">{poll.totalVotes} votos registrados</p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL DETALLE (POPUP) --- */}
            <AnimatePresence>
                {selectedPoll && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setSelectedPoll(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-neutral-900 border border-white/10 w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header Modal */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-neutral-900 sticky top-0 z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedPoll.title}</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {isPlus && !displayStats.isAnonymousConfig
                                            ? "Mostrando identidades de votantes (Modo Transparente)"
                                            : "Identidades ocultas (Modo Anónimo o Plan insuficiente)"}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedPoll(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                                    <X className="text-gray-400" />
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row h-full overflow-hidden">
                                {/* Sidebar: Selector de Opciones */}
                                <div className="w-full md:w-1/3 border-r border-white/10 bg-black/20 overflow-y-auto custom-scrollbar p-4 space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pl-2">Resultados</p>
                                    {selectedPoll.options.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSelectedOptionId(opt.id)}
                                            className={clsx(
                                                "w-full p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer",
                                                selectedOptionId === opt.id
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center overflow-hidden border border-white/10">
                                                {opt.imageUrl ? (
                                                    <img src={opt.imageUrl} alt="" width={32} height={32} className="object-cover w-full h-full" />
                                                ) : (
                                                    <span className="text-xs font-bold">{opt.name[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-bold truncate">{opt.name}</p>
                                                <p className={clsx("text-xs", selectedOptionId === opt.id ? "text-blue-200" : "text-gray-500")}>
                                                    {opt.votesCount} votos
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Main: Grid de Votantes */}
                                <div className="flex-1 bg-neutral-900 p-6 overflow-y-auto custom-scrollbar">
                                    {selectedOptionId && (
                                        <>
                                            <h3 className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2">
                                                <Users size={16} />
                                                Votaron por: <span className="text-white">{selectedPoll.options.find(o => o.id === selectedOptionId)?.name}</span>
                                            </h3>

                                            {/* Lógica de Privacidad */}
                                            {(!isPlus || displayStats.isAnonymousConfig) ? (
                                                <div className="flex flex-col items-center justify-center h-64 text-center opacity-50">
                                                    <Lock size={48} className="text-gray-600 mb-4" />
                                                    <p className="text-lg font-bold text-gray-400">Votantes Ocultos</p>
                                                    <p className="text-sm text-gray-600 max-w-xs">
                                                        {!isPlus
                                                            ? "Necesitas el plan Premium+ para ver identidades."
                                                            : "La configuración de este evento está en 'Voto Anónimo'."}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    {selectedPoll.options.find(o => o.id === selectedOptionId)?.voters.map((voter, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                                                {voter.image ? (
                                                                    <img src={voter.image} alt="" width={32} height={32} />
                                                                ) : (
                                                                    voter.name[0]
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-gray-300 truncate">{voter.name}</span>
                                                        </div>
                                                    ))}
                                                    {selectedPoll.options.find(o => o.id === selectedOptionId)?.voters.length === 0 && (
                                                        <p className="text-gray-500 text-sm italic col-span-full">Nadie votó por esta opción aún.</p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function KpiCard({ title, value, icon, subtext }: any) {
    return (
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 flex items-start justify-between">
            <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white">{value}</h4>
                {subtext && <p className="text-xs text-green-400 mt-1 font-medium">{subtext}</p>}
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                {icon}
            </div>
        </div>
    )
}

const MOCK_STATS: StatsData = {
    totalVotes: 1243,
    totalPolls: 8,
    votesByPoll: [],
    activityTimeline: [],
    pollsDetail: [],
    isAnonymousConfig: true
};