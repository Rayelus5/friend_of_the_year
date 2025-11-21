"use client";

import { useState } from "react";
import { createEvent } from "@/app/lib/dashboard-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { set } from "zod";

export default function CreateEventButton({ planSlug }: { planSlug: string }) {
    const isFree = planSlug === 'free';

    const isPremium = planSlug === 'premium';
    const isPlus = planSlug === 'plus';

    const [isOpen, setIsOpen] = useState(false);
    const [isQuotaExceded, setIsQuotaExceeded] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();


    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const res = await createEvent(formData);
        if (res?.success) {
            setIsQuotaExceeded(false);
            setIsOpen(false);
            router.push(`/dashboard/event/${res.eventId}`); // Ir al panel del nuevo evento
        } else {
            setIsQuotaExceeded(true);
        }
        setLoading(false);
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2  cursor-pointer `}
            >
                 {/*${isFree && 'filter grayscale opacity-50 cursor-not-allowed'}*/}
                <span>+</span> Nuevo Evento
            </button>

            {isOpen && (
                isQuotaExceded ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h4 className="text-xl font-bold text-indigo-600 mb-4 py-2 border-b border-indigo-600">¡Ups!</h4>
                        <p className="text-white">
                            Para crear más eventos, necesitas unirte a <b>Premium</b>. Haz clic en "Unirme ahora" para disfrutar de todas las características de nuestra plataforma.
                        </p>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <Link
                                    href={'/premium'}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-bold transition-colors disabled:opacity-50 text-center"
                                >
                                    {loading ? "Cargando..." : "Unirme Ahora"}
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">Crear Nuevo Evento</h2>

                            <form action={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">Nombre del Evento</label>
                                    <input
                                        name="title"
                                        required
                                        placeholder="Ej: Premios Verano 2025"
                                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">Descripción</label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        placeholder="¿De qué va esta gala?"
                                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors disabled:opacity-50"
                                    >
                                        {loading ? "Creando..." : "Crear"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            )}
        </>
    );
}