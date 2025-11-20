"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import Countdown from "@/components/Countdown";

type Props = {
    firstPollId: string | undefined;
    isGalaTime: boolean;
    galaDate: Date;
    // Nuevas props opcionales para personalización
    title?: string;
    description?: string;
    slug?: string;
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
    title = "FOTY 2025", // Valor por defecto
    description = "Celebramos los momentos, los memes y las leyendas.",
    slug
}: Props) {
    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black selection:bg-sky-500/30">

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
                className="z-10 max-w-5xl w-full px-6 text-center flex flex-col items-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >

                <motion.div variants={itemVariants} className="mb-8 inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg shadow-sky-500/10">
                    <span className="flex h-2 w-2 rounded-full bg-sky-400 mr-2 animate-pulse shadow-[0_0_10px_#38bdf8]"></span>
                    <span className="text-xs font-medium tracking-[0.2em] text-gray-300 uppercase">
                        Evento Oficial
                    </span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-6 drop-shadow-2xl break-words w-full">
                    {title}
                </motion.h1>

                <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-light leading-relaxed">
                    {description}
                </motion.p>

                {/* Buttons & Logic */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6 items-center">
                    {!isGalaTime ? (
                        firstPollId ? (
                            <Link href={`/polls/${firstPollId}`} className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                                <div className="relative px-10 py-4 bg-black rounded-full leading-none flex items-center">
                                    <span className="text-gray-200 group-hover:text-white transition duration-200 font-bold tracking-wide">COMENZAR VOTACIÓN</span>
                                </div>
                            </Link>
                        ) : (
                            <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-gray-500 font-medium backdrop-blur-md">
                                Las urnas están cerradas.
                            </div>
                        )
                    ) : (
                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 rounded-full blur-xl opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
                            <Link href={slug ? `/e/${slug}/results` : `/`} className="relative flex items-center justify-center px-10 py-5 rounded-full font-extrabold text-xl shadow-2xl hover:scale-[1.02] transition-transform active:scale-95 overflow-hidden bg-black">
                                <div className="absolute inset-0 bg-gradient-to-r from-sky-300 to-blue-500 opacity-100" />
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 mix-blend-overlay" />
                                <span className="relative z-10 text-blue-950 tracking-wide flex items-center gap-2">
                                    VER RESULTADOS
                                </span>
                            </Link>
                        </div>
                    )}
                </motion.div>

                <motion.div variants={itemVariants} className="mt-24 border-t border-white/5 pt-8 w-full max-w-md">
                    <p className="text-xs text-gray-600 uppercase tracking-[0.3em] mb-4">Countdown to Gala</p>
                    <div className="text-gray-300 opacity-80 hover:opacity-100 transition-opacity">
                        <Countdown targetDate={galaDate} />
                    </div>
                </motion.div>

            </motion.div>

            {/* (Footer eliminado de aquí para usar el del Layout global si se prefiere, o mantenlo) */}
        </main>
    );
}