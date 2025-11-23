"use client";

import { useState } from "react";
import { createEvent } from "@/app/lib/dashboard-actions";
import { useRouter } from "next/navigation";
import { useFormStatus } from 'react-dom';
import Link from "next/link";
import { Bouncy } from 'ldrs/react'
import 'ldrs/react/Bouncy.css'
import { Plus, X } from "lucide-react";



// --- COMPONENTE BOTÓN INTERNO (Extraído para que useFormStatus funcione) ---
function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    
    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="flex items-center gap-2 w-full justify-center py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
            <span className="flex items-center gap-2">
                {pending ? <Bouncy size="40" speed="1.75" color="#fff" /> : <Plus size={20} />}
                <span>{pending ? "" : "Crear Evento"}</span>
            </span>
        </button>
    );
}

export default function CreateEventButton({ planSlug }: { planSlug: string }) {
    const isFree = planSlug === 'free';
    const isPremium = planSlug === 'premium';
    // isPlus no se usa explícitamente en el texto pero lo dejamos por si acaso
    // const isPlus = planSlug === 'plus';

    const [isOpen, setIsOpen] = useState(false);
    const [isQuotaExceded, setIsQuotaExceeded] = useState(false);
    const [loading, setLoading] = useState(false); // Estado de carga para el link de premium
    const [serverError, setServerError] = useState<string | null>(null);
    
    // Estado controlado para el título (para filtrar caracteres)
    const [title, setTitle] = useState("");
    
    const router = useRouter();

    // FUNCIÓN DE FILTRADO EN TIEMPO REAL
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Regex: Permite letras, números, espacios y puntuación básica .,:;!¡?¿()
        // Bloquea emojis y símbolos raros como @#$%&/
        if (/^[\w\s\-\.,:;!¡?¿()'áéíóúÁÉÍÓÚñÑüÜ]*$/.test(value)) {
            setTitle(value);
            setServerError(null); // Limpiar error si escribe algo válido
        }
    };

    async function handleSubmit(formData: FormData) {
        // No necesitamos setLoading(true) aquí porque useFormStatus lo maneja en el botón
        // Pero limpiamos errores previos
        setServerError(null);

        const res = await createEvent(formData);
        
        if (res?.success) {
            setIsQuotaExceeded(false);
            setIsOpen(false);
            setTitle(""); // Resetear form
            router.push(`/dashboard/event/${res.eventId}`); 
        } else {
            // Si el error contiene la palabra "límite", activamos la pantalla de cuota
            if (res?.error && res.error.includes("límite")) {
                setIsQuotaExceeded(true);
            } else {
                // Si es otro error (validación, etc), lo mostramos en el form
                setServerError(res?.error || "Error desconocido");
            }
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 cursor-pointer`}
            >
                <span>+</span> Nuevo Evento
            </button>

            {isOpen && (
                isQuotaExceded ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h4 className="text-xl font-bold text-indigo-600 mb-4 py-2 border-b border-indigo-600">¡Ups!</h4>
                        <p className="text-white mb-6">
                            Para crear más eventos, necesitas unirte a {isPremium ? <b>Premium+</b> : <b>Premium</b>}. Haz clic en "Unirme ahora" para disfrutar de todas las características de nuestra plataforma.
                        </p>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsOpen(false); setIsQuotaExceeded(false); }}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <Link
                                    onClick={() => setLoading(true)}
                                    href={'/premium'}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-bold transition-colors disabled:opacity-50 text-center flex justify-center items-center"
                                >
                                    {loading ? <Bouncy size="30" speed="1.75" color="#fff" /> : "Unirme Ahora"}
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white">Crear Nuevo Evento</h2>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                            </div>

                            <form action={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">Nombre del Evento</label>
                                    <input
                                        name="title"
                                        required
                                        value={title} // Controlado por React
                                        onChange={handleTitleChange} // Filtrado activo
                                        placeholder="Ej: Premios Verano 2025"
                                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-gray-600 mt-1">
                                        Solo letras, números y puntuación básica.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">Descripción</label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        placeholder="¿De qué va esta gala?"
                                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors resize-none"
                                    />
                                </div>

                                {/* TODO: Crear etiquetas del evento */}
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">Etiquetas</label>
                                    <input
                                        name="tags"
                                        placeholder="Etiquetas, separadas por comas"
                                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>

                                {/* Mensaje de error del servidor */}
                                {serverError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                                        {serverError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>

                                    <div className="flex-1">
                                        {/* Pasamos disabled si el título es muy corto */}
                                        <SubmitButton disabled={title.length < 3} />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            )}
        </>
    );
}