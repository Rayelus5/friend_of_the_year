"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MailCheck, ArrowRight, Home } from "lucide-react";

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

export default function ThanksPage() {
    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 selection:bg-blue-500/30 overflow-hidden">
            {/* Glow de fondo */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-600/15 rounded-[100%] blur-[120px]" />
                <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[400px] bg-purple-600/20 rounded-[100%] blur-[130px]" />
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
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[11px] font-medium text-gray-300 tracking-[0.25em] uppercase">
                            Mensaje enviado
                        </span>
                    </div>
                </motion.div>

                {/* Tarjeta principal */}
                <motion.div
                    variants={fadeInUp}
                    className="bg-neutral-900/60 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl"
                >
                    {/* Icono */}
                    <div className="flex flex-col items-center text-center gap-5 mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500/15 rounded-full flex items-center justify-center text-green-400">
                            <MailCheck size={36} />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                ¡Gracias por tu mensaje!
                            </h1>
                            <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
                                Hemos recibido correctamente tu formulario. 
                                Revisaremos tu mensaje y, si es necesario, nos pondremos en contacto contigo lo antes posible.
                            </p>
                        </div>
                    </div>

                    {/* Bloque informativo */}
                    <div className="mb-8 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-gray-300">
                        <p className="mb-1 font-medium text-gray-100">
                            ¿Qué puedes hacer ahora?
                        </p>
                        <p className="text-xs md:text-sm text-gray-400">
                            Puedes volver al inicio para seguir usando POLLNOW o visitar la página de about para conocer más sobre el proyecto.
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center md:justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm md:text-base hover:bg-gray-200 transition-colors"
                        >
                            <Home size={18} />
                            Volver al inicio
                        </Link>

                        <Link
                            href="/about#contact"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/20 text-gray-200 font-semibold text-sm md:text-base hover:bg-white/10 hover:border-blue-400/60 transition-colors"
                        >
                            <ArrowRight size={18} />
                            Enviar otro mensaje
                        </Link>
                    </div>
                </motion.div>

                {/* Pie pequeño */}
                <motion.p
                    variants={fadeInUp}
                    className="mt-6 text-center text-[11px] text-gray-500"
                >
                    POLLNOW · Gracias por formar parte de esta comunidad
                </motion.p>
            </motion.div>
        </main>
    );
}
