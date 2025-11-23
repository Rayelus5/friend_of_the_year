"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Wrench, Clock, ArrowRight } from "lucide-react";
import { MAINTENANCE_MODE } from "@/lib/config";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: "easeOut" }
    }
};

const stagger = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15
        }
    }
};



export default function MaintenancePage() {
    const router = useRouter();

    // Si la web NO está en mantenimiento, redirigimos automáticamente
    useEffect(() => {
        if (!MAINTENANCE_MODE) {
            router.replace("/");
        }
    }, []);

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 selection:bg-blue-500/30 overflow-hidden">
            {/* Glows animados con Framer Motion */}
            <div className="pointer-events-none fixed inset-0">
                <motion.div
                    initial={{ 
                        opacity: 0.15,
                        x: -500,
                        y: -100,
                        scale: 1,
                        rotate: 0
                    }}
                    animate={{
                        opacity: [0.15, 0.25, 0.15],
                        x: [-500, -400, -450, -400, -500],
                        y: [-100, -90, -40, -20, -100],
                        scale: [1, 1.5, 1],
                        rotate: [0, 8, -6, 3, 0]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="
                        absolute -top-40 left-1/2 -translate-x-1/2 
                        w-[700px] h-[450px]
                        bg-gradient-to-br from-indigo-500/90 to-blue-500/20 
                        rounded-[100%] blur-[150px]
                    "
                />

                <motion.div
                    initial={{ 
                        opacity: 0.15,
                        x: 500,
                        y: 1000,
                        scale: 1,
                        rotate: 0
                    }}
                    animate={{
                        opacity: [0.15, 0.25, 0.15],
                        x: [500, 400, 450, 400, 500],
                        y: [1000, 900, 800, 900, 1000],
                        scale: [1, 1.5, 1],
                        rotate: [0, 8, -6, 3, 0]
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="
                        absolute -top-40 left-1/2 -translate-x-1/2 
                        w-[500px] h-[450px]
                        bg-gradient-to-br from-blue-500/20 to-indigo-500/80 
                        rounded-[100%] blur-[150px]
                    "
                />
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="relative z-10 max-w-xl w-full"
            >
                {/* Badge */}
                <motion.div
                    variants={fadeInUp}
                    className="flex justify-center mb-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-[11px] font-medium text-gray-300 tracking-[0.25em] uppercase">
                            Mantenimiento activo
                        </span>
                    </div>
                </motion.div>

                {/* Tarjeta principal */}
                <motion.div
                    variants={fadeInUp}
                    className="bg-neutral-900/60 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl"
                >
                    <div className="flex flex-col items-center text-center gap-5 mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-500/15 rounded-full flex items-center justify-center text-indigo-300">
                            <Wrench size={36} />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                En Mantenimiento
                            </h1>
                            <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
                                POLLNOW se encuentra en mantenimiento temporal para aplicar mejoras y nuevas funciones. Volveremos a estar disponibles en breve.
                            </p>
                        </div>
                    </div>

                    {/* Bloque informativo */}
                    <div className="mb-8 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-gray-300 flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-2 text-gray-200 text-sm">
                            <Clock size={16} className="text-indigo-300" />
                            <span>Mantenimiento programado</span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-400">
                            Si necesitas contactar con el creador o reportar un problema urgente, puedes usar el formulario de contacto en cuanto el servicio vuelva a estar disponible.
                        </p>
                    </div>
                </motion.div>

                <motion.p
                    variants={fadeInUp}
                    className="mt-6 text-center text-[11px] text-gray-500"
                >
                    POLLNOW · Mejorando la experiencia para tu próximo evento
                </motion.p>
            </motion.div>
        </main>
    );
}