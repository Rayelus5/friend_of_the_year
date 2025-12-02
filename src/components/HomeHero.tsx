"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import Countdown from "@/components/Countdown";
import ReportButton from "@/components/ReportButton";
import { House } from "lucide-react";
import { CustomAdBannerVertical } from "@/components/ads/CustomAdBannerVertical";

type Props = {
    firstPollId: string | undefined;
    isGalaTime: boolean;
    galaDate: Date;
    title?: string;
    description?: string;
    eventId: string;
    slug?: string;
    showAds?: boolean; // controlar banners laterales
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
};

const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0, filter: "blur(10px)" },
    visible: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: "easeOut" },
    },
};

export default function HomeHero({
    firstPollId,
    isGalaTime,
    galaDate,
    title = "Evento",
    description = "Descripción del evento",
    eventId,
    slug,
    showAds = true,
}: Props) {
    const [loading, setLoading] = useState(false);

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

            <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden selection:bg-sky-500/30 w-full">
                {/* Background Blobs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/30 rounded-full blur-[120px] pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-900/20 rounded-full blur-[100px] pointer-events-none"
                />

                {/* Content */}
                <motion.div
                    className="z-10 min-w-5xl max-w-5xl w-full px-6 text-center flex flex-col items-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        variants={itemVariants}
                        className="mb-8 inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg shadow-sky-500/10"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-sky-400 mr-2 animate-pulse shadow-[0_0_10px_#38bdf8]" />
                        <span className="text-xs font-medium tracking-[0.2em] text-gray-300 uppercase">
                            Evento Oficial
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-5xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-6 drop-shadow-2xl break-words w-full"
                    >
                        {title}
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-light leading-relaxed overflow-y-auto max-h-[200px] break-words tail-line-clamp-3"
                    >
                        {description}
                    </motion.p>

                    {/* Buttons & Logic */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-6 items-center">
                        {!isGalaTime ? (
                            firstPollId ? (
                                <>
                                    <Link
                                        onClick={() => setLoading(true)}
                                        href={`/polls/${firstPollId}`}
                                        className="group relative"
                                    >
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                                        <div className="relative px-10 py-4 bg-black rounded-full leading-none flex items-center">
                                            <span className="text-gray-200 group-hover:text-white transition duration-200 font-bold tracking-wide">
                                                {loading ? (
                                                    <Bouncy color="white" size="40" speed="1.75" />
                                                ) : (
                                                    "COMENZAR VOTACIÓN"
                                                )}
                                            </span>
                                        </div>
                                    </Link>

                                    <Link href={`/`} className="group relative">
                                        <div className="px-10 py-3 bg-white/5 border border-white/10 rounded-full text-gray-500 font-medium">
                                            <House
                                                size={20}
                                                color="white"
                                                className="group-hover:text-white transition duration-200"
                                            />
                                        </div>
                                    </Link>
                                </>
                            ) : (
                                <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-gray-500 font-medium backdrop-blur-md">
                                    Las urnas están cerradas.
                                </div>
                            )
                        ) : (
                            <div className="relative group cursor-pointer">
                                <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 rounded-full blur-xl opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x" />
                                <Link
                                    onClick={() => setLoading(true)}
                                    href={slug ? `/e/${slug}/results` : `/`}
                                    className="relative flex items-center justify-center px-10 py-5 rounded-full font-extrabold text-xl shadow-2xl hover:scale-[1.02] transition-transform active:scale-95 overflow-hidden bg-black min-w-[300px] max-w-[300px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-sky-300 to-blue-500 opacity-100" />
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 mix-blend-overlay" />
                                    <span className="relative z-10 text-blue-950 tracking-wide flex items-center gap-2">
                                        {loading ? <Bouncy size="40" speed="1.75" /> : "VER RESULTADOS"}
                                    </span>
                                </Link>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="mt-12 border-t border-white/10 pt-8 w-full max-w-md"
                    >
                        <p className="text-xs text-gray-600 uppercase tracking-[0.3em] mb-4">
                            Countdown to Gala
                        </p>
                        <div className="text-gray-300 opacity-80 hover:opacity-100 transition-opacity">
                            <Countdown targetDate={galaDate} />
                        </div>
                    </motion.div>
                </motion.div>

                <div className="absolute top-6 right-6 z-50">
                    <ReportButton eventId={eventId} />
                </div>
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