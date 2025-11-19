"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

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

export default function VotingForm({
    poll,
    nextPollId,
    initialHasVoted = false
}: {
    poll: PollData,
    nextPollId: string | null,
    initialHasVoted?: boolean
}) {
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    // Estado local para controlar si ya votó (inicia con lo que diga el servidor)
    const [hasVoted, setHasVoted] = useState(initialHasVoted);
    const router = useRouter();

    const handleSelect = (id: string) => {
        // Si ya votó, no permitimos seleccionar nada
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
        // CASO 1: Si ya votó, el botón sirve solo para avanzar
        if (hasVoted) {
            if (nextPollId) {
                router.push(`/polls/${nextPollId}`);
            } else {
                router.push(`/completed`);
            }
            return;
        }

        // CASO 2: Enviar voto nuevo
        if (selected.length === 0) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/polls/${poll.id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ optionIds: selected }),
            });

            if (res.ok) {
                setHasVoted(true); // Marcamos visualmente
                localStorage.setItem(`voted_${poll.id}`, "true");

                // Pequeña pausa para que el usuario vea que se marcó
                setTimeout(() => {
                    if (nextPollId) {
                        router.push(`/polls/${nextPollId}`);
                    } else {
                        router.push(`/completed`);
                    }
                }, 500);
            } else {
                // Si devuelve 403, es que ya votó antes (cookie/db)
                if (res.status === 403) {
                    alert("Ya has votado en esta categoría.");
                    setHasVoted(true); // Bloqueamos la UI
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
        <div className="max-w-6xl mx-auto px-4 py-12 pb-32">

            {/* Header de la Categoría */}
            <header className="text-center mb-10 space-y-4 animate-in slide-in-from-top-5 duration-700">
                <span className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase">Categoría</span>
                <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                    {poll.title}
                </h1>
                {poll.description && (
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">{poll.description}</p>
                )}
            </header>

            {/* Mensaje Feedback si ya votó */}
            {hasVoted && (
                <div className="mb-8 max-w-xl mx-auto p-4 bg-amber-500/10 border border-amber-500/50 rounded-xl text-center animate-in fade-in zoom-in duration-300">
                    <p className="text-amber-500 font-bold flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Tu voto ha sido registrado
                    </p>
                    <p className="text-sm text-gray-400 mt-1">Pulsa abajo para continuar.</p>
                </div>
            )}

            {/* Grid de Candidatos */}
            <div className={clsx(
                "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-12 transition-all duration-500",
                // Si ya votó, ponemos todo en gris y desactivamos clicks
                hasVoted ? "opacity-50 grayscale pointer-events-none" : "opacity-100"
            )}>
                {poll.options.map((opt) => {
                    const isSelected = selected.includes(opt.id);

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleSelect(opt.id)}
                            className={clsx(
                                "group relative h-[400px] rounded-2xl overflow-hidden transition-all duration-300 ease-out text-left",
                                // Estado Normal vs Seleccionado
                                isSelected
                                    ? "ring-4 ring-amber-500 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] scale-[1.02] z-10"
                                    : "ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.01] opacity-80 hover:opacity-100"
                            )}
                        >
                            {/* Imagen de Fondo Full */}
                            <div className="absolute inset-0 bg-gray-900">
                                {opt.imageUrl ? (
                                    <img
                                        src={opt.imageUrl}
                                        alt={opt.name}
                                        className={clsx(
                                            "w-full h-full object-cover transition-transform duration-700",
                                            isSelected ? "scale-110 grayscale-0" : "grayscale-[0.5] group-hover:grayscale-0 scale-100"
                                        )}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-700 text-9xl font-black">
                                        {opt.name.charAt(0)}
                                    </div>
                                )}
                                {/* Gradiente overlay */}
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
                                    <p className="text-sm text-amber-200/80 font-medium uppercase tracking-wide border-l-2 border-amber-500 pl-3">
                                        {opt.subtitle}
                                    </p>
                                )}
                            </div>

                            {/* Checkmark */}
                            {isSelected && (
                                <div className="absolute top-4 right-4 bg-amber-500 text-black rounded-full p-2 shadow-lg animate-in zoom-in duration-300">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Barra Flotante */}
            <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
                <button
                    onClick={handleSubmit}
                    disabled={loading || (!hasVoted && selected.length === 0)}
                    className="pointer-events-auto bg-white text-black px-12 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all active:scale-95 flex items-center gap-3"
                >
                    {loading ? (
                        "Procesando..."
                    ) : (
                        hasVoted ? (
                            // Texto si ya votó (Navegación)
                            <>
                                <span>{nextPollId ? "Continuar Siguiente" : "Ver Resumen"}</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </>
                        ) : (
                            // Texto para votar
                            <>
                                <span>Finalizar Votación</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </>
                        )
                    )}
                </button>
            </div>

        </div>
    );
}