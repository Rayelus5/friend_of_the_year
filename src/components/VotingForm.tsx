"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { motion, Variants } from "framer-motion"; // <--- 1. Importamos Framer Motion

// Tipos
type PollData = {
    id: string;
    title: string;
    description: string | null;
    votingType: string;
    maxChoices: number | null;
    options: {
        id: string;
        name: string;
        imageUrl: string | null;
        subtitle: string | null
    }[];
};

// --- CONFIGURACIÓN DE ANIMACIONES ---

// 1. Contenedor (Grid): Controla el ritmo (stagger)
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08, // Muy rápido entre carta y carta (efecto ráfaga)
            delayChildren: 0.2,
        },
    },
};

// 2. Tarjetas: Entrada agresiva
const cardVariants: Variants = {
    hidden: { 
        y: 100, // Empieza muy abajo
        opacity: 0, 
        scale: 0.8,
        filter: "blur(10px)", // Empieza borroso
    },
    show: { 
        y: 0, 
        opacity: 1, 
        scale: 1,
        filter: "blur(0px)", // Termina nítido
        transition: { 
            type: "spring", 
            stiffness: 200, // Tensión alta = Movimiento rápido/agresivo
            damping: 20,    // Freno para que no rebote demasiado
            mass: 1
        } 
    },
};

// 3. Textos: Entrada suave para acompañar
const textVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};


export default function VotingForm({
    poll,
    nextPollId,
    initialHasVoted = false,
    initialSelected = [] ,
    eventSlug
}: {
    poll: PollData,
    nextPollId: string | null,
    initialHasVoted?: boolean,
    initialSelected?: string[],
    eventSlug: string
}) {
    const [selected, setSelected] = useState<string[]>(initialSelected);
    const [loading, setLoading] = useState(false);
    const [hasVoted, setHasVoted] = useState(initialHasVoted);
    const router = useRouter();

    const handleSelect = (id: string) => {
        if (hasVoted) return;

        if (poll.votingType === "SINGLE") {
            setSelected([id]);
        } else {
            if (selected.includes(id)) {
                setSelected(selected.filter((s) => s !== id));
            } else {
                if (poll.maxChoices && selected.length >= poll.maxChoices) return;
                setSelected([...selected, id]);
            }
        }
    };

    const handleSubmit = async () => {
        const doRedirect = () => {
            if (nextPollId) {
                router.push(`/polls/${nextPollId}`);
            } else {
                // CAMBIO AQUÍ: Redirigir a la página específica del evento
                router.push(`/e/${eventSlug}/completed`);
            }
        };

        if (hasVoted) {
            doRedirect();
            return;
        }

        if (selected.length === 0) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/polls/${poll.id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ optionIds: selected }),
            });

            if (res.ok) {
                setHasVoted(true);
                localStorage.setItem(`voted_${poll.id}`, "true");
                
                setTimeout(() => {
                    doRedirect(); // Usar la función auxiliar
                }, 500);
            } else {
                if (res.status === 403) {
                    alert("Ya has votado en esta categoría.");
                    setHasVoted(true);
                } else {
                    const json = await res.json();
                    alert(json.error || "Error al enviar voto");
                }
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 pb-32">

            {/* Navegación */}
            <motion.nav 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-start mb-8"
            >
                <Link 
                    href={`/e/${eventSlug}`}
                    className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al Lobby
                </Link>
            </motion.nav>

            {/* Header Animado */}
            <motion.header 
                initial="hidden"
                animate="show"
                variants={textVariants}
                className="text-center mb-10 space-y-4"
            >
                <span className="text-blue-500 text-xs font-bold tracking-[0.3em] uppercase">Categoría</span>
                <motion.h1 
                    className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 leading-snug"
                    initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                >
                    {poll.title}
                </motion.h1>
                {poll.description && (
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">{poll.description}</p>
                )}
            </motion.header>

            {/* Feedback Animado */}
            {hasVoted && (
                <motion.div 
                    initial={{ marginBottom: 0, opacity: 0, filter: "blur(10px)", transform: "scale(2)" }}
                    animate={{ marginBottom: 24, opacity: 1, filter: "blur(0px)", transform: "scale(1)" }}
                    className="mb-8 max-w-xl mx-auto overflow-hidden "
                >
                    <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-xl text-center">
                        <p className="text-blue-500 font-bold flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Voto Registrado
                        </p>
                        <p className="text-sm text-gray-400 mt-1">A continuación verás tu selección.</p>
                    </div>
                </motion.div>
            )}

            {/* --- GRID DE CANDIDATOS CON FRAMER MOTION --- */}
            <motion.div 
                className={clsx(
                    "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12",
                    hasVoted ? "pointer-events-none" : ""
                )}
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {poll.options.map((opt) => {
                    const isSelected = selected.includes(opt.id);

                    return (
                        <motion.button
                            key={opt.id}
                            variants={cardVariants} // Aplicamos la animación individual agresiva
                            whileHover={{ scale: hasVoted ? 1 : 1.03 }} // Hover effect
                            whileTap={{ scale: hasVoted ? 1 : 0.97 }}   // Click effect
                            onClick={() => handleSelect(opt.id)}
                            disabled={hasVoted}
                            className={clsx(
                                "group relative h-[350px] rounded-2xl overflow-hidden text-left transition-colors duration-300 cursor-pointer", // Quitamos transition-all de CSS para dejar a Framer trabajar
                                
                                // Lógica Visual
                                hasVoted 
                                    ? (isSelected 
                                        ? "ring-4 ring-green-500 opacity-100 z-10 cursor-default shadow-[0_0_30px_rgba(34,197,94,0.4)]" 
                                        : "opacity-20 grayscale ring-0 cursor-not-allowed")
                                    : (isSelected
                                        ? "ring-4 ring-blue-500 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] z-10"
                                        : "ring-1 ring-white/10 hover:ring-white/30")
                            )}
                        >
                            {/* Imagen */}
                            <div className="absolute inset-0 bg-gray-900">
                                {opt.imageUrl ? (
                                    <img
                                        src={opt.imageUrl}
                                        alt={opt.name}
                                        className={clsx(
                                            "w-full h-full object-cover transition-transform duration-700",
                                            isSelected ? "scale-110 grayscale-0" : (hasVoted ? "grayscale" : "grayscale-[0.5] group-hover:grayscale-0 scale-100")
                                        )}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-700 text-9xl font-black">
                                        {opt.name.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                            </div>

                            {/* Info */}
                            <div className="absolute bottom-0 left-0 w-full p-8">
                                <h3 className={clsx(
                                    "text-3xl font-bold mb-2 transition-colors",
                                    isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
                                )}>
                                    {opt.name}
                                </h3>
                                {opt.subtitle && (
                                    <p className={clsx(
                                        "text-sm font-medium uppercase tracking-wide border-l-2 pl-3",
                                        isSelected ? (hasVoted ? "text-green-300 border-green-500" : "text-blue-200/80 border-blue-500") : "text-gray-500 border-gray-500"
                                    )}>
                                        {opt.subtitle}
                                    </p>
                                )}
                            </div>

                            {/* Checkmark */}
                            {isSelected && (
                                <motion.div 
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className={clsx(
                                        "absolute top-4 right-4 text-black rounded-full p-2 shadow-lg",
                                        hasVoted ? "bg-green-500" : "bg-blue-500"
                                    )}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </motion.div>
                            )}
                            
                            {/* Etiqueta TU VOTO */}
                            {hasVoted && isSelected && (
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="absolute top-4 left-4 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full"
                                >
                                    TU VOTO
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* Barra Flotante */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none px-4"
            >
                <button
                    onClick={handleSubmit}
                    disabled={loading || (!hasVoted && selected.length === 0)}
                    className="pointer-events-auto bg-white text-black px-12 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all active:scale-95 flex items-center gap-3 cursor-pointer"
                >
                    {loading ? (
                        "Procesando..."
                    ) : (
                        hasVoted ? (
                            <>
                                <span>{nextPollId ? "Continuar Siguiente" : "Ver Resumen"}</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </>
                        ) : (
                            <>
                                <span>Finalizar Votación</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </>
                        )
                    )}
                </button>
            </motion.div>

        </div>
    );
}