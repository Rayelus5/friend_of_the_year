"use client";

import Link from "next/link";
import Countdown from "@/components/Countdown";
import { motion, Variants } from "framer-motion";
import { CustomAdBannerVertical } from "./ads/CustomAdBannerVertical";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.3, delayChildren: 0.2 },
    },
};

const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0, filter: "blur(5px)" },
    visible: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: "easeOut" },
    },
};

type Props = {
    targetDate: Date;
    eventSlug: string;
    showAds?: boolean;
};

export default function CompletedView({ targetDate, eventSlug, showAds = true }: Props) {
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

            <main className="min-h-screen flex flex-col items-center justify-center  text-center p-6 selection:bg-blue-500/30 overflow-hidden relative w-full">

                {/* Fondo Ambiental */}
                <motion.div
                    animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none"
                />

                <motion.div
                    className="z-10 space-y-10 max-w-2xl w-full"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >

                    {/* Icono Animado */}
                    <motion.div
                        variants={{
                            hidden: { scale: 0, rotate: -180 },
                            visible: {
                                scale: 1,
                                rotate: 0,
                                transition: { type: "spring", stiffness: 200, damping: 15 }
                            }
                        }}
                        className="w-24 h-24 bg-gradient-to-br from-sky-300 to-blue-700 rounded-full flex items-center justify-center mx-auto shadow-[0_0_60px_-10px_rgba(56,189,248,0.5)] relative group"
                    >
                        <div className="absolute inset-0 rounded-full border border-sky-400/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                            <motion.path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
                            />
                        </svg>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter mb-4 leading-snug">
                            Votos Registrados
                        </h1>
                        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto opacity-50"></div>
                    </motion.div>

                    <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 leading-relaxed">
                        Gracias por tu participación.
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="py-8 px-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm mx-auto inline-block"
                    >
                        <p className="text-xs font-bold text-sky-500 mb-4 tracking-[0.3em] uppercase flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                            LA GALA COMIENZA EN
                            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                        </p>
                        <div className="text-gray-200">
                            <Countdown targetDate={targetDate} />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-8">
                        <Link
                            href={`/e/${eventSlug}`}
                            className="group relative inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
                        >
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-500 transition-all group-hover:w-full"></span>
                            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al Lobby del Evento
                        </Link>
                    </motion.div>

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
