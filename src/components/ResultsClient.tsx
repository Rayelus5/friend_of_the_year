"use client";

import { motion, Variants } from "framer-motion"; // <--- 1. Importamos Variants
import Link from "next/link";
import WinnerConfetti from "@/components/WinnerConfetti";
import { clsx } from "clsx";

type Result = {
    id: string;
    name: string;
    votes: number;
    percentage: number;
};

type Props = {
    pollTitle: string;
    pollDescription: string | null;
    results: Result[];
    winners: Result[];
    winnerImage: string | null | undefined;
    backUrl: string;
};

export default function ResultsClient({ pollTitle, pollDescription, results, winners, winnerImage, backUrl }: Props) {

    // 2. Tipamos explícitamente como :Variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    // 3. Tipamos explícitamente como :Variants
    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 50 }
        }
    };

    return (
        <main className="min-h-screen bg-neutral-950 p-4 md:p-10 text-white selection:bg-blue-500/30 flex flex-col items-center overflow-hidden">
            <motion.div
                className="max-w-3xl w-full mx-auto relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >

                {/* HEADER */}
                <motion.header variants={itemVariants} className="text-center mb-12">
                    <span className="text-blue-500 text-xs font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        Resultados Oficiales
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-4 tracking-tight">
                        {pollTitle}
                    </h1>
                    <Link
                        href={backUrl}
                        className="text-sm text-gray-500 hover:text-white transition-colors border-b border-transparent hover:border-white pb-0.5"
                    >
                        ← Volver a la Ceremonia
                    </Link>
                </motion.header>

                {/* TARJETA DEL GANADOR */}
                {winners.length > 0 ? (
                    <motion.div
                        variants={itemVariants}
                        className="relative overflow-hidden rounded-3xl border border-blue-500/30 p-10 text-center mb-12 shadow-[0_0_80px_-20px_rgba(37,99,235,0.4)] min-h-[400px] flex flex-col justify-center items-center group"
                    >
                        <WinnerConfetti />

                        {/* 1. IMAGEN DE FONDO */}
                        {winnerImage && (
                            <div className="absolute inset-0 z-0">
                                <motion.img
                                    initial={{ scale: 1.1, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 0.6 }}
                                    transition={{ duration: 1.5 }}
                                    src={winnerImage}
                                    alt="Winner Background"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s] ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-blue-950/30 mix-blend-multiply"></div>
                            </div>
                        )}

                        {/* 2. CONTENIDO */}
                        <div className="relative z-10 w-full">
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-blue-500"></div>

                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", bounce: 0.5, delay: 0.5 }}
                                className="text-7xl mb-6 drop-shadow-2xl filter"
                            >
                                🏆
                            </motion.div>

                            <div className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl mb-6">
                                {winners.map(w => w.name).join(" & ")}
                            </div>

                            <div className="inline-block relative">
                                <div className="absolute -inset-1 bg-blue-500/20 blur-lg rounded-full"></div>
                                <h2 className="relative text-lg md:text-xl text-blue-200 font-light uppercase tracking-[0.2em] border-t border-b border-blue-500/30 py-3 px-6">
                                    {winners[0].name.endsWith('a') ? 'GANADORA' : 'GANADOR'} DE {pollDescription || "ESTA CATEGORÍA"}
                                </h2>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants} className="text-center p-10 text-gray-500 bg-neutral-900/50 rounded-2xl border border-white/5">
                        No hubo votos suficientes.
                    </motion.div>
                )}

                {/* TABLA DE RESULTADOS */}
                <div className="space-y-6 max-w-2xl mx-auto">
                    {results.map((result, index) => (
                        <motion.div key={result.id} variants={itemVariants} className="group">
                            <div className="flex justify-between items-end mb-2 px-1">
                                <span className={clsx(
                                    "font-medium text-lg flex items-center gap-3 transition-colors",
                                    index === 0 ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                                )}>
                                    <span className={clsx(
                                        "font-mono text-xs px-2 py-0.5 rounded",
                                        index === 0 ? "bg-blue-500 text-black font-bold" : "bg-white/5 text-gray-500"
                                    )}>
                                        #{index + 1}
                                    </span>
                                    {result.name}
                                </span>
                                <span className="text-sm font-mono text-gray-500">
                                    {Math.round(result.percentage)}%
                                </span>
                            </div>

                            {/* Barra de progreso */}
                            <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden border border-white/5 relative">
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.percentage}%` }}
                                    transition={{ duration: 1.2, delay: 0.5, ease: "circOut" }}
                                    className={clsx(
                                        "h-full rounded-full relative",
                                        index === 0 ? 'bg-gradient-to-r from-blue-600 to-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]' : 'bg-gray-700'
                                    )}
                                >
                                    {index === 0 && (
                                        <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-md transform skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </motion.div>
        </main>
    );
}