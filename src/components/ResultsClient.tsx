"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import WinnerConfetti from "@/components/WinnerConfetti";
import { clsx } from "clsx";
import { CustomAdBannerVertical } from "./ads/CustomAdBannerVertical";

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
    showAds?: boolean; // <- control de banners laterales
};

export default function ResultsClient({
    pollTitle,
    pollDescription,
    results,
    winners,
    winnerImage,
    backUrl,
    showAds = true,
}: Props) {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 },
        },
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 50 },
        },
    };

    return (
        <div className="relative z-10 flex justify-center gap-6">
            {/* BANNER IZQUIERDO (solo desktop grande) */}
            {showAds && (
                <motion.aside
                    className="hidden xl:flex sticky top-16 h-full w-[350px]"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <CustomAdBannerVertical />
                </motion.aside>
            )}

            <main className="min-h-screen bg-neutral-950 p-4 md:p-10 text-white selection:bg-blue-500/30 flex flex-col items-center overflow-hidden w-full">
                <motion.div
                    className="w-full max-w-5xl mx-auto relative z-10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* HEADER */}
                    <motion.header variants={itemVariants} className="text-center mb-10 md:mb-12 px-2">
                        <span className="text-blue-500 text-xs font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                            Resultados Oficiales
                        </span>
                        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mt-2 mb-4 tracking-tight break-words">
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
                            className="relative overflow-hidden rounded-3xl border border-blue-500/30 p-6 md:p-10 text-center mb-10 md:mb-12 shadow-[0_0_80px_-20px_rgba(37,99,235,0.4)] min-h-[420px] md:min-h-[550px] w-full max-w-4xl mx-auto flex flex-col justify-center items-center group"
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-blue-950/30 mix-blend-multiply" />
                                </div>
                            )}

                            {/* 2. CONTENIDO */}
                            <div className="relative z-10 w-full px-2">
                                <div className="hidden sm:block absolute -top-16 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-blue-500" />

                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", bounce: 0.5, delay: 0.5 }}
                                    className="text-6xl md:text-7xl mb-4 md:mb-6 drop-shadow-2xl filter"
                                >
                                    🏆
                                </motion.div>

                                <div className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl mb-4 md:mb-6 break-words">
                                    {winners.map((w) => w.name).join(" & ")}
                                </div>

                                <div className="inline-block relative max-w-full">
                                    <div className="absolute -inset-1 bg-blue-500/20 blur-lg rounded-full" />
                                    <h2 className="relative text-sm sm:text-base md:text-lg text-blue-200 font-light uppercase tracking-[0.2em] border-t border-b border-blue-500/30 py-2 sm:py-3 px-4 sm:px-6 break-words">
                                        {winners[0].name.endsWith("a") ? "GANADORA" : "GANADOR"} DE{" "}
                                        {pollDescription || "ESTA CATEGORÍA"}
                                    </h2>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={itemVariants}
                            className="text-center p-6 md:p-10 text-gray-500 bg-neutral-900/50 rounded-2xl border border-white/5 max-w-xl mx-auto"
                        >
                            No hubo votos suficientes.
                        </motion.div>
                    )}

                    {/* TABLA DE RESULTADOS */}
                    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto w-full px-1">
                        {results.map((result, index) => (
                            <motion.div key={result.id} variants={itemVariants} className="group">
                                <div className="flex justify-between items-end mb-1 md:mb-2 px-1 gap-2">
                                    <span
                                        className={clsx(
                                            "font-medium text-base md:text-lg flex items-center gap-2 md:gap-3 transition-colors truncate",
                                            index === 0
                                                ? "text-white"
                                                : "text-gray-400 group-hover:text-gray-300"
                                        )}
                                    >
                                        <span
                                            className={clsx(
                                                "font-mono text-[11px] md:text-xs px-2 py-0.5 rounded whitespace-nowrap",
                                                index === 0
                                                    ? "bg-blue-500 text-black font-bold"
                                                    : "bg-white/5 text-gray-500"
                                            )}
                                        >
                                            #{index + 1}
                                        </span>
                                        <span className="truncate">{result.name}</span>
                                    </span>
                                    <span className="text-xs md:text-sm font-mono text-gray-500 whitespace-nowrap">
                                        {Math.round(result.percentage)}%
                                    </span>
                                </div>

                                {/* Barra de progreso */}
                                <div className="h-2.5 md:h-3 w-full bg-gray-900 rounded-full overflow-hidden border border-white/5 relative">
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${result.percentage}%` }}
                                        transition={{ duration: 1.2, delay: 0.5, ease: "circOut" }}
                                        className={clsx(
                                            "h-full rounded-full relative",
                                            index === 0
                                                ? "bg-gradient-to-r from-blue-600 to-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                                                : "bg-gray-700"
                                        )}
                                    >
                                        {index === 0 && (
                                            <div className="absolute top-0 right-0 bottom-0 w-8 md:w-10 bg-white/30 blur-md transform skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                                        )}
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </main>

            {/* BANNER DERECHO (solo desktop grande) */}
            {showAds && (
                <motion.aside
                    className="hidden xl:flex sticky top-16 h-full w-[350px]"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <CustomAdBannerVertical />
                </motion.aside>
            )}
        </div>
    );
}
