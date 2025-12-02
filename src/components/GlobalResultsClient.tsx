// src/components/GlobalResultsClient.tsx
"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomAdBannerVertical } from "@/components/ads/CustomAdBannerVertical";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

type Poll = {
    id: string;
    title: string;
};

type Props = {
    polls: Poll[];
    eventSlug: string;
    showAds?: boolean; // controlar banners laterales
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0, filter: "blur(6px)" },
    visible: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: "easeOut" },
    },
};

export default function GlobalResultsClient({
    polls,
    eventSlug,
    showAds = true,
}: Props) {
    const router = useRouter();
    const [loadingPollId, setLoadingPollId] = useState<string | null>(null);

    const handlePollClick = (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
        pollId: string
    ) => {
        e.preventDefault();
        setLoadingPollId(pollId);
        router.push(`/polls/${pollId}/results`);
    };

    return (
        <div className="relative z-10 flex justify-center gap-6 bg-black text-white selection:bg-sky-500/30 min-h-screen">
            {/* BANNER IZQUIERDO (solo desktop grande) */}
            {showAds && (
                <motion.aside
                    className="hidden xl:flex sticky top-16 h-full w-[250px]"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <CustomAdBannerVertical />
                </motion.aside>
            )}

            {/* CONTENIDO PRINCIPAL */}
            <main className="relative flex-1 min-h-screen flex flex-col items-center justify-start overflow-hidden py-10 w-full">
                {/* Background blobs (estilo HomeHero) */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[120px] pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.18, 0.08] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-900/20 rounded-full blur-[110px] pointer-events-none"
                />

                {/* Contenedor central */}
                <motion.div
                    className="z-10 max-w-7xl w-full px-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* HEADER */}
                    <motion.header
                        variants={itemVariants}
                        className="py-8 border-b border-white/10 mb-10 flex flex-col md:flex-row justify-between items-center gap-6"
                    >
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                Ceremonia de premios
                            </h1>
                            <p className="text-gray-400 mt-2 text-lg font-light">
                                Comienza la gala de premios del evento.
                            </p>
                        </div>

                        <Link
                            href={`/e/${eventSlug}`}
                            className="group relative px-6 py-2 rounded-full overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-colors"
                        >
                            <span className="relative z-10 text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                Volver al Lobby
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Link>
                    </motion.header>

                    {/* GRID DE CATEGORÍAS */}
                    <motion.div
                        variants={itemVariants}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {polls.map((poll, index) => {
                            const isLoadingThisCard = loadingPollId === poll.id;

                            return (
                                <motion.div key={poll.id} variants={itemVariants}>
                                    <Link
                                        href={`/polls/${poll.id}/results`}
                                        onClick={(e) => handlePollClick(e, poll.id)}
                                        className={`
                                            group relative aspect-video bg-neutral-900/40 rounded-2xl overflow-hidden 
                                            border border-white/5 hover:border-sky-500/50 transition-all duration-500 block
                                            ${isLoadingThisCard ? "pointer-events-none opacity-80" : ""}
                                        `}
                                    >
                                        {/* CONTENIDO NORMAL DE LA TARJETA */}
                                        <div className="absolute inset-0 p-8 flex flex-col justify-between z-20">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-mono text-sky-500/80 uppercase tracking-[0.2em] border border-sky-500/20 px-2 py-1 rounded bg-sky-500/5">
                                                    Cat. {index + 1}
                                                </span>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sky-400 transform translate-x-2 group-hover:translate-x-0 duration-300">
                                                    🏆
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-200 group-hover:text-white group-hover:scale-105 origin-left transition-all duration-300 ease-out break-words">
                                                    {poll.title}
                                                </h3>
                                            </div>

                                            <div className="flex items-center text-sm text-gray-500 group-hover:text-sky-300 transition-colors font-medium mt-4">
                                                Ver resultados
                                                <svg
                                                    className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                                                    />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* capas decorativas */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/0 via-sky-900/0 to-blue-900/0 group-hover:via-sky-900/10 group-hover:to-blue-600/20 transition-all duration-700" />
                                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* LOADER BOUNCE (overlay) */}
                                        {isLoadingThisCard && (
                                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
                                                <Bouncy color="white" size="40" speed="1.6" />
                                            </div>
                                        )}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </motion.div>
            </main>

            {/* BANNER DERECHO (solo desktop grande) */}
            {showAds && (
                <motion.aside
                    className="hidden xl:flex sticky top-16 h-full w-[250px]"
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