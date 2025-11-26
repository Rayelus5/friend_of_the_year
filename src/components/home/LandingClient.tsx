"use client";

import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Trophy, Lock, Palette, ArrowRight, Sparkles, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import LiquidGlass from 'liquid-glass-react'
import { text } from "stream/consumers";
import { AwardMockup3D } from "@/components/home/AwardMockup3D";
import next from "next";
import { is } from "date-fns/locale";

// --- DATOS DE ANIMACIÓN DEL TÍTULO ---
const WORDS = [
    {
        text: "Game Awards.",
        // Degradado de Texto
        gradient: "from-cyan-400 via-blue-500 to-indigo-600",
        // Degradado de la Sombra/Glow
        shadow: "from-cyan-500/50 via-blue-500/50 to-indigo-500/50"
    },
    {
        text: "Oscars.",
        gradient: "from-amber-200 via-yellow-400 to-orange-500",
        shadow: "from-amber-300/50 via-yellow-500/50 to-orange-500/50"
    },
    {
        text: "Grammys.",
        gradient: "from-pink-300 via-purple-500 to-indigo-500",
        shadow: "from-pink-500/50 via-purple-500/50 to-indigo-500/50"
    },
    {
        text: "ESLANDs.",
        gradient: "from-emerald-300 via-teal-500 to-cyan-600",
        shadow: "from-emerald-500/50 via-teal-500/50 to-cyan-500/50"
    },
    {
        text: "Tierlists.",
        gradient: "from-teal-300 via-emerald-500 to-green-600",
        shadow: "from-teal-500/50 via-emerald-500/50 to-green-500/50"
    }
];

const TITLES = [
    {
        text: "Crea tus propios"
    },
    {
        text: "Crea tus propias"
    },
]

// --- VARIANTES DE ANIMACIÓN ---

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
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

const featureContainerVariants: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.2 }
    }
};

export default function LandingClient( { session } : { session: any } ) {
    const [index, setIndex] = useState(0);

    const loggedIn = session?.user?.id ? true : false;

    // Rotación de palabras cada 3 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % WORDS.length);

        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const specificIndexes = [4]; // Indexes específicos
    const currentTitle = specificIndexes.includes(index) ? TITLES[1] : TITLES[0];
    const currentWord = WORDS[index];

    return (
        <div className="relative overflow-hidden">

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">

                {/* Fondo Ambiental Hero */}
                <motion.div
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 rounded-[100%] blur-[120px] pointer-events-none -z-10"
                />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center w-full"
                >
                    {/* Badge */}
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-gray-300 tracking-wide">Ahora disponible para todos</span>
                    </motion.div>

                    {/* Título con Animación Compleja */}
                    <div className="relative z-20 mb-6">
                        <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-extrabold tracking-tighter text-white drop-shadow-xl">
                            {currentTitle.text} <br />

                            {/* Contenedor de la palabra cambiante */}
                            <div className="relative inline-block min-w-[500px] md:min-w-[900px] h-[1.2em]">
                                <AnimatePresence mode="wait">

                                    <motion.span
                                        key={index}
                                        initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
                                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                        exit={{ y: -40, opacity: 0, filter: "blur(10px)" }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className={clsx(
                                            "absolute left-0 right-0 mx-auto bg-clip-text text-transparent bg-gradient-to-b pb-4 max-w-[800px]", // pb-4 para que no se corte la g o j
                                            currentWord.gradient
                                        )}
                                    >
                                        {currentWord.text}
                                    </motion.span>
                                </AnimatePresence>

                                {/* Sombra / Glow Trasero Circular en Movimiento */}
                                <div className="absolute m-auto inset-0 -z-10 pointer-events-none select-none flex justify-center items-center max-w-[300px] md:max-w-[500px]">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`glow-${index}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1.2, rotate: 360 }}
                                            exit={{ opacity: 0, scale: 1.5 }}
                                            transition={{
                                                opacity: { duration: 0.5 },
                                                rotate: { duration: 10, repeat: Infinity, ease: "linear" } // Rotación continua
                                            }}
                                            className={clsx(
                                                "w-[120%] h-[150%] rounded-[100%] blur-[90px] opacity-40 bg-gradient-to-r",
                                                currentWord.shadow
                                            )}
                                        />
                                    </AnimatePresence>
                                </div>

                                {/* Destello / Shimmer sobre el texto */}
                                <motion.div
                                    key={`shimmer-${index}`}
                                    className="absolute bg-clip-text inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '200%' }}
                                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                                />
                            </div>
                        </motion.h1>
                    </div>

                    {/* Descripción */}
                    <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
                        POLLNOW es la plataforma definitiva para organizar votaciones épicas entre amigos, comunidades o eventos. Diseño premium, votos anónimos por defecto y con modo "Gala".
                    </motion.p>

                    {/* Botones */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 relative z-30">
                        <Link
                            href={loggedIn ? "/dashboard" : "/register"}
                            className="group px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            {loggedIn ? <Plus size={18} className="text-black" /> : <Sparkles size={18} className="text-black" />}
                            {loggedIn ? "Crear evento" : "Empezar Gratis"}
                        </Link>
                        <Link
                            href="/polls"
                            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all  hover:border-white/20"
                        >
                            Explorar Eventos
                        </Link>
                    </motion.div>

                    {/* MOCKUP VISUAL 3D */}

                    {/* <motion.div
                        variants={itemVariants}
                        className="mt-20 relative w-full max-w-5xl aspect-video bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden group z-10"
                    >
                        <Link href={"/dashboard"}>
                            <AwardMockup3D />
                        </Link>
                        
                    </motion.div> */}

                    
                    <motion.div
                        variants={itemVariants}
                        className="hidden lg:flex mt-20 relative w-full max-w-5xl aspect-video rounded-3xl border border-white/10 bg-black overflow-hidden z-10 [perspective:1400px]"
                    >
                        {/* Glow muy suave de fondo */}
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.2),_transparent_55%)] opacity-80" />

                        {/* CAPA DE TARJETAS FONDO (ahora más visibles, con bucle 0 → visible → 0) */}
                        {[
                            {
                                id: "bg-1",
                                top: "10%",
                                left: "6%",
                                rotateY: -18,
                                rotateX: 8,
                                depthScale: 0.85,
                                blur: "blur-[4px]",
                                maxOpacity: 0.55,
                                delay: 0,
                            },
                            {
                                id: "bg-2",
                                top: "65%",
                                left: "10%",
                                rotateY: 15,
                                rotateX: -6,
                                depthScale: 0.88,
                                blur: "blur-[5px]",
                                maxOpacity: 0.5,
                                delay: 0.8,
                            },
                            {
                                id: "bg-3",
                                top: "15%",
                                left: "68%",
                                rotateY: 18,
                                rotateX: -5,
                                depthScale: 0.9,
                                blur: "blur-[4px]",
                                maxOpacity: 0.52,
                                delay: 1.4,
                            },
                            {
                                id: "bg-4",
                                top: "68%",
                                left: "70%",
                                rotateY: -16,
                                rotateX: 7,
                                depthScale: 0.87,
                                blur: "blur-[5px]",
                                maxOpacity: 0.48,
                                delay: 2.1,
                            },
                        ].map((card) => (
                            <motion.div
                                key={card.id}
                                className={`
                                    absolute w-60 h-40 rounded-3xl border border-white/10 bg-neutral-900/70 
                                    shadow-[0_0_35px_rgba(15,23,42,0.9)] overflow-hidden ${card.blur}
                                `}
                                style={{ top: card.top, left: card.left }}
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: [0, card.maxOpacity, 0],
                                    y: [0, -10, 0],
                                    rotateY: [card.rotateY, card.rotateY + 2, card.rotateY],
                                    rotateX: [card.rotateX, card.rotateX - 2, card.rotateX],
                                    scale: [card.depthScale, card.depthScale * 0.97, card.depthScale],
                                }}
                                transition={{
                                    duration: 16,
                                    delay: card.delay,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900" />
                                <div className="relative h-full w-full p-4 flex flex-col justify-between text-[10px] text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/15 flex items-center justify-center text-[9px] text-gray-200">
                                            P
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-gray-200 font-semibold">
                                                Evento destacado
                                            </span>
                                            <span className="text-[9px] text-gray-500">@pollnow</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-2 rounded-full bg-white/15 w-4/5" />
                                        <div className="h-2 rounded-full bg-white/8 w-3/5" />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] text-gray-400">
                                        <span>24 nominados · 6 categorías</span>
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px]">
                                            LIVE
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* CAPA DE TARJETAS MEDIO-PLANO (también 0 → visible → 0) */}
                        {[
                            {
                                id: "mid-1",
                                top: "5%",
                                left: "10%",
                                rotateY: -10,
                                rotateX: 5,
                                depthScale: 0.98,
                                delay: 0.4,
                            },
                            {
                                id: "mid-2",
                                top: "70%",
                                left: "65%",
                                rotateY: 9,
                                rotateX: -4,
                                depthScale: 1.0,
                                delay: 1.2,
                            },
                        ].map((card) => (
                            <motion.div
                                key={card.id}
                                className="absolute w-64 h-44 rounded-3xl border border-white/15 bg-neutral-900/90 shadow-[0_0_40px_rgba(15,23,42,1)] overflow-hidden z-0"
                                style={{ top: card.top, left: card.left }}
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: [0, 0.8, 0],
                                    x: [-20, 0, -20],
                                    y: [-20, -40, 0],
                                    rotateY: [card.rotateY, card.rotateY - 4, card.rotateY],
                                    rotateX: [card.rotateX, card.rotateX + 3, card.rotateX],
                                    scale: [card.depthScale, card.depthScale * 1.03, card.depthScale],
                                }}
                                transition={{
                                    duration: 20,
                                    delay: card.delay,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/16 via-slate-950 to-purple-500/16" />
                                <div className="relative h-full w-full p-4 flex flex-col justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[10px] text-gray-100 font-bold">
                                            P
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-300">
                                            <span className="text-gray-100 font-semibold">
                                                Premios Comunidad
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                                            <span className="bg-white/8 px-2 py-0.5 rounded-full">
                                                En curso
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-[10px] text-gray-300">
                                        <div className="h-2.5 rounded-full bg-white/25 w-3/4" />
                                        <div className="h-2 rounded-full bg-white/12 w-1/2" />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-[9px] text-gray-300">
                                        <div className="flex gap-2">
                                            <span className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">
                                                18 nominados
                                            </span>
                                            <span className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">
                                                4 categorías
                                            </span>
                                        </div>
                                        <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-gray-100">
                                            →
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* TARJETA PRINCIPAL EN PRIMER PLANO (también 0 → visible → 0) */}
                        <motion.div
                            className="absolute left-1/2 top-1/2 w-72 md:w-80 h-48 md:h-52 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/25 bg-neutral-950/95 shadow-[0_0_60px_rgba(59,130,246,0.2)] overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0, 0.8, 1, 0.8, 0],
                                y: [0, -8, 0],
                                rotateY: [-4, 8, -4],
                                rotateX: [6, 30, 6],
                                scale: [1, 1.06, 1],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/22 via-slate-900 to-indigo-500/22" />
                            <div className="relative h-full w-full p-5 flex flex-col justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-black/70 border border-white/40 flex items-center justify-center text-[11px] font-bold text-sky-300">
                                        PN
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] text-gray-100 font-semibold tracking-wide text-left">
                                            Evento en tendencia
                                        </span>
                                        <span className="text-[10px] text-gray-300">
                                            Miles de votos en tiempo real.
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="h-3 rounded-full bg-white/40 w-4/5" />
                                    <div className="h-2 rounded-full bg-white/20 w-2/3" />
                                </div>

                                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-100">
                                    <div className="flex gap-2">
                                        <span className="px-2.5 py-1 rounded-full bg-black/50 border border-white/20">
                                            32 nominados
                                        </span>
                                        <span className="px-2.5 py-1 rounded-full bg-black/50 border border-white/20">
                                            7 categorías
                                        </span>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                        Votación abierta
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* TEXTO CENTRAL /pollnow (0 → visible → 0 en loop) */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0.8, 1, 0.8],
                                scale: [0.96, 1.5, 0.96],
                            }}
                            transition={{
                                duration: 14,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >

                            <span className="text-6xl md:text-8xl font-extrabold tracking-tight text-white/85 drop-shadow-[0_0_35px_rgba(15,23,42,1)] mix-blend-screen">
                                /pollnow
                            </span>
                            
                        </motion.div>

                        

                        {/* Fade inferior sutil */}
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/85 to-transparent" />
                    </motion.div>

                </motion.div>
            </section>

            

            {/* --- FEATURES SECTION --- */}
            <section className="py-32 bg-neutral-950 border-t border-white/5 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        variants={featureContainerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        
                        <FeatureCard
                            icon={<Trophy className="text-yellow-400" size={32} />}
                            title="Modo Gala"
                            desc="Resultados sellados hasta la fecha del evento. Vive la emoción del directo sin spoilers y con confeti."
                        />
                        <FeatureCard
                            icon={<Lock className="text-green-400" size={32} />}
                            title="Voto Anónimo"
                            desc="Tecnología de huella digital para garantizar un voto por persona sin necesidad de registros forzosos."
                        />
                        <FeatureCard
                            icon={<Palette className="text-purple-400" size={32} />}
                            title="Diseño Épico"
                            desc="Una interfaz oscura, limpia y animada con Framer Motion que hará que tu evento parezca una producción de TV."
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- CTA FINAL --- */}
            <section className="py-32 px-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 to-blue-950/20 pointer-events-none" />
                            
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                        ¿Listo para organizar <br /> tu evento?
                    </h2>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full font-bold text-xl text-white shadow-lg shadow-blue-900/30 hover:scale-105 transition-transform group"
                    >
                        Crear Cuenta Gratis
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                </motion.div>

                <div className="absolute top-80 inset-0 bg-[radial-gradient(farthest-side,rgba(150,150,255,0.7),rgba(100,100,200,0.1))] blur-[100px] pointer-events-none" />
            </section>

        </div>
    );
}

// Subcomponente para las tarjetas
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -10 }}
            className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
        >
            <div className="mb-6 p-4 bg-black/50 rounded-2xl w-fit border border-white/5 group-hover:border-white/20 transition-colors">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </motion.div>
    )
}