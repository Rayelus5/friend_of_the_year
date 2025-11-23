"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Rocket,
    Code2,
    Heart,
    Mail,
    ArrowRight,
    Github,
    Linkedin,
    Map,
    Smartphone,
    Zap
} from "lucide-react";

// --- CONFIGURACIÓN DE ANIMACIONES ---

const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" }
    }
};

const staggerContainer = {
    visible: { transition: { staggerChildren: 0.2 } }
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-x-hidden">

            {/* --- 1. HERO SECTION: LA MISIÓN --- */}
            <section className="relative pt-32 pb-20 px-6 min-h-[60vh] flex flex-col items-center justify-center text-center">

                {/* Fondo Ambiental */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-[100%] blur-[120px] pointer-events-none" />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="relative z-10 max-w-4xl"
                >
                    <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                        <span className="text-xs font-medium text-gray-300 tracking-widest uppercase">Nuestra Historia</span>
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="text-5xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-8">
                        Más que una app, <br /> una <span className="text-blue-500">tradición.</span>
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        POLLNOW nació de una necesidad simple: poner fin a las discusiones sobre quién llegó más tarde o quién contó el peor chiste. Lo que empezó como una broma interna, hoy es la plataforma definitiva para celebrar la amistad.
                    </motion.p>
                </motion.div>
            </section>


            {/* --- 2. EL CREADOR (PERFIL) --- */}
            <section className="py-24 px-6 border-t border-white/5 bg-neutral-950/50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="grid md:grid-cols-2 gap-12 items-center"
                    >
                        {/* Imagen / Tarjeta */}
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-sky-600 rounded-3xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
                            <div className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-neutral-900">
                                {/* REEMPLAZA ESTA URL CON TU FOTO REAL */}
                                <Image
                                    src="https://placehold.co/500x500"
                                    alt="Rayelus Image"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                                    <h3 className="text-2xl font-bold text-white">Rayelus</h3>
                                    <p className="text-blue-400 font-mono text-sm">Full Stack Developer & Creator</p>
                                </div>
                            </div>
                        </div>

                        {/* Texto Bio */}
                        <div className="space-y-8">
                            <h2 className="text-4xl font-bold text-white">Creador de Pollnow</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Hola! soy Rayelus, el desarrollador detrás de este proyecto. Como apasionado de la tecnología y las comunidades, quería crear algo que uniera a las personas de una manera divertida y moderna.
                            </p>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                POLLNOW está construido con las últimas tecnologías web (Next.js 14, TypeScript, Tailwind CSS) para asegurar una experiencia fluida, rápida y segura.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <a
                                    href="https://rayelus.com/portfolio"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <Code2 size={20} /> Ver Portfolio
                                </a>
                                <a
                                    href="https://github.com/Rayelus5"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 border border-white/20 rounded-full font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                    <Github size={20} /> GitHub
                                </a>
                                <a
                                    href="#"
                                    className="px-6 py-3 border border-white/20 rounded-full font-bold hover:bg-blue-600/20 hover:border-blue-500/50 transition-colors flex items-center gap-2 text-blue-400"
                                >
                                    <Linkedin size={20} /> LinkedIn
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* --- 3. ROADMAP (BENTO GRID) --- */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4">El Futuro de POLLNOW</h2>
                        <p className="text-gray-400">Esto es solo el principio. Novedades que llegarán pronto.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <RoadmapCard
                            icon={<Smartphone className="text-blue-400" />}
                            title="App Móvil Nativa"
                            desc="Llevando la experiencia a iOS y Android con notificaciones push en tiempo real."
                            status="En Diseño"
                            colSpan="md:col-span-2"
                        />
                        {/* Card 2 */}
                        <RoadmapCard
                            icon={<Zap className="text-yellow-400" />}
                            title="Modo Live"
                            desc="Votaciones en directo a través de WebSockets durante la gala."
                            status="Q3 2025"
                        />
                        {/* Card 3 */}
                        <RoadmapCard
                            icon={<Map className="text-purple-400" />}
                            title="Eventos Locales"
                            desc="Descubre galas públicas cerca de tu ubicación."
                            status="Planeado"
                        />
                        {/* Card 4 */}
                        <RoadmapCard
                            icon={<Heart className="text-red-400" />}
                            title="POLLNOW Likes"
                            desc="Sistema de Me gusta para eventos públicos. Valoraciones de la gala entre otras cosas."
                            status="Concepto"
                            colSpan="md:col-span-2"
                        />
                    </div>
                </div>
            </section>


            {/* --- 4. CONTACTO --- */}
            <section id="contact" className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-black to-blue-950/20">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="bg-neutral-900/50 border border-white/10 p-8 md:p-12 rounded-3xl backdrop-blur-xl shadow-2xl"
                    >
                        <motion.div variants={fadeInUp} className="text-center mb-10">
                            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                                <Mail size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Hablemos</h2>
                            <p className="text-gray-400">¿Tienes una idea, un bug o simplemente quieres saludar?</p>
                        </motion.div>

                        <motion.form variants={fadeInUp} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre</label>
                                    <input type="text" placeholder="Tu nombre" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                    <input type="email" placeholder="tu@email.com" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Mensaje</label>
                                <textarea rows={4} placeholder="¿En qué estás pensando?" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none transition-colors"></textarea>
                            </div>

                            <button className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4">
                                Enviar Mensaje <ArrowRight size={18} />
                            </button>
                        </motion.form>

                    </motion.div>
                </div>
            </section>

        </main>
    );
}

// --- COMPONENTE AUXILIAR PARA EL GRID ---
function RoadmapCard({ icon, title, desc, status, colSpan = "" }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className={`p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all duration-300 ${colSpan} flex flex-col justify-between`}
        >
            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">{icon}</div>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-white/5">
                        {status}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
        </motion.div>
    )
}