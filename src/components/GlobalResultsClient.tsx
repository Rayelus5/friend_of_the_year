"use client";

import { motion, Variants } from "framer-motion"; // <--- Importar Variants
import Link from "next/link";

type Poll = {
    id: string;
    title: string;
};

export default function GlobalResultsClient({ polls, eventSlug }: { polls: Poll[], eventSlug: string }) {

    // Tipamos explícitamente las variantes
    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } },
    };

    return (
        <main className="min-h-screen bg-black text-white p-6 selection:bg-sky-500/30 overflow-hidden relative">

            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">

                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="py-12 border-b border-white/10 mb-12 flex flex-col md:flex-row justify-between items-center gap-6"
                >
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            Ceremonia de Premios
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg font-light">
                            La noche donde las leyendas se consagran.
                        </p>
                    </div>

                    <Link href={`/e/${eventSlug}`} className="group relative px-6 py-2 rounded-full overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-colors">
                        <span className="relative z-10 text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Volver al Lobby</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                </motion.header>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {polls.map((poll, index) => (
                        <motion.div key={poll.id} variants={item}>
                            <Link
                                href={`/polls/${poll.id}/results`}
                                className="group relative aspect-video bg-neutral-900/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 hover:border-sky-500/50 transition-all duration-500 block"
                            >
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
                                        <h3 className="text-2xl font-bold text-gray-200 group-hover:text-white group-hover:scale-105 origin-left transition-all duration-300 ease-out">
                                            {poll.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 group-hover:text-sky-300 transition-colors font-medium mt-4">
                                        Ver Ganador
                                        <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-br from-sky-900/0 via-sky-900/0 to-blue-900/0 group-hover:via-sky-900/10 group-hover:to-blue-600/20 transition-all duration-700" />

                                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </main>
    );
}