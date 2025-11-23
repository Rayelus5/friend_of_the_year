"use client";

import { useState } from "react";
import { updateEvent, deleteEvent, rotateEventKey } from "@/app/lib/event-actions";
import { Save, Trash2, AlertTriangle, RefreshCw, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormStatus } from 'react-dom';
import { Bouncy } from 'ldrs/react'
import 'ldrs/react/Bouncy.css'


type EventData = {
    id: string;
    title: string;
    description: string | null;
    galaDate: Date | null;
    isPublic: boolean;
    slug: string;
    accessKey: string;
    isAnonymousVoting: boolean;
};

// --- HELPER PARA FECHAS LOCALES ---
// Convierte una fecha UTC a string "YYYY-MM-DDTHH:mm" en HORA LOCAL
function formatLocalDatetime(date: Date | string | null) {
    if (!date) return "";
    const d = new Date(date);
    // Truco: Restamos el offset de la zona horaria para que toISOString()
    // nos devuelva los números correspondientes a la hora local, no UTC.
    const offsetMs = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
}

// --- COMPONENTE BOTÓN (FUERA DEL PRINCIPAL) ---
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 w-full justify-center px-4 py-2 md:py-4 text-md md:text-xl bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 shadow-lg shadow-blue-900/20 cursor-pointer"
        >
            <span className="flex items-center gap-2">
                {pending ? <Bouncy size="45" speed="1.25" color="#fff" /> : <Save size={20} />}
                <span>{pending ? "" : "Guardar Cambios"}</span>
            </span>
        </button>
    );
}

export default function EventSettings({ event, planSlug }: { event: EventData, planSlug: string }) {
    const [currentEvent, setCurrentEvent] = useState(event);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const isPlus = planSlug === 'plus';

    // --- USAMOS EL HELPER AQUÍ PARA QUE EL INPUT MUESTRE LA HORA REAL ---
    const defaultDate = formatLocalDatetime(currentEvent.galaDate);

    const handleCopy = async () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const shareUrl = `${origin}/e/${event.slug}${!currentEvent.isPublic ? `?key=${event.accessKey}` : ''}`;
        
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleFormSubmit = async (formData: FormData) => {
        // Inyectar valor de checkbox si está deshabilitado (Lógica Premium)
        if (!isPlus) {
            if (currentEvent.isAnonymousVoting) {
                formData.set('isAnonymousVoting', 'on');
            } else {
                formData.delete('isAnonymousVoting');
            }
        }

        const galaDateString = formData.get('galaDate') as string | null;
        const galaDate = galaDateString ? new Date(galaDateString) : null;

        const newIsAnonymous = formData.get('isAnonymousVoting') === 'on';
        const newIsPublic = formData.get('isPublic') === 'on';

        setCurrentEvent(prev => ({
            ...prev,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            isPublic: newIsPublic,
            isAnonymousVoting: newIsAnonymous,
            galaDate: galaDate,
        }));

        await updateEvent(event.id, formData);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        await deleteEvent(event.id);
    };

    const handleRotateKey = async () => {
        setShowConfirm(true);
    };

    const confirmRotate = async () => {
        setShowConfirm(false);
        setIsRegenerating(true);
        await rotateEventKey(event.id);
        setIsRegenerating(false);
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/e/${event.slug}${!currentEvent.isPublic ? `?key=${event.accessKey}` : ''}`;

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* --- COLUMNA 1 --- */}
            <div className="space-y-8">
                <form action={handleFormSubmit} className="space-y-6 p-6 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-4 border-b border-neutral-700 pb-3">Configuración General</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Evento</label>
                        <input
                            name="title"
                            defaultValue={currentEvent.title}
                            className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                        <textarea
                            name="description"
                            defaultValue={currentEvent.description || ""}
                            rows={3}
                            className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de la Gala</label>
                            {/* USAMOS defaultDate FORMATEADO LOCALMENTE */}
                            <input
                                type="datetime-local"
                                name="galaDate"
                                defaultValue={defaultDate}
                                className="w-full bg-black border border-white/20 rounded p-3 text-white dark-calendar focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Visibilidad</label>
                            <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg bg-black cursor-pointer hover:border-white/30 transition-colors h-[50px]">
                                <input
                                    type="checkbox"
                                    name="isPublic"
                                    defaultChecked={currentEvent.isPublic}
                                    onChange={(e) => setCurrentEvent({...currentEvent, isPublic: e.target.checked})}
                                    className="accent-blue-500 w-5 h-5"
                                />
                                <span className="text-sm text-gray-300">Evento Público</span>
                            </label>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg border transition-colors ${isPlus ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/10 bg-white/5 opacity-70'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <label htmlFor="isAnonymous" className={`font-bold text-sm ${isPlus ? 'cursor-pointer text-white' : 'text-gray-400'}`}>Votación Anónima</label>
                                {!isPlus && <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded uppercase">Plus Only</span>}
                            </div>

                            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    name="isAnonymousVoting"
                                    id="isAnonymous"
                                    checked={currentEvent.isAnonymousVoting}
                                    onChange={(e) => {
                                        if (isPlus) {
                                            setCurrentEvent({ ...currentEvent, isAnonymousVoting: e.target.checked });
                                        }
                                    }}
                                    disabled={!isPlus}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer disabled:cursor-not-allowed z-10 opacity-0 inset-0"
                                />
                                <div className={`block overflow-hidden h-6 rounded-full transition-colors duration-300 ${currentEvent.isAnonymousVoting ? (isPlus ? 'bg-purple-600' : 'bg-gray-600') : 'bg-gray-700'}`}></div>
                                <div className={`absolute left-0 top-0 bottom-0 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 pointer-events-none ${currentEvent.isAnonymousVoting ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            {isPlus
                                ? "Si desactivas esto, podrás ver la identidad de los votantes en las estadísticas avanzadas."
                                : "Por defecto, los votos son 100% anónimos. Actualiza a Premium+ para rastrear votantes."}
                        </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <SubmitButton />
                    </div>
                </form>
            </div>

            {/* --- COLUMNA 2 --- */}
            <div className="space-y-8">
                {/* ZONA DE ENLACES */}
                <div className="p-6 border border-blue-500/20 bg-blue-500/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                            {currentEvent.isPublic ? '🌍 Enlace Público' : '🔒 Enlace Privado (Con Clave)'}
                        </h3>
                        {!currentEvent.isPublic && (
                            <button
                                onClick={handleRotateKey}
                                disabled={isRegenerating}
                                className="text-[10px] flex items-center gap-1 text-blue-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <RefreshCw size={12} className={isRegenerating ? "animate-spin" : ""} />
                                {isRegenerating ? "Generando..." : "Regenerar Clave"}
                            </button>
                        )}
                        {showConfirm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-blue-500">
                                    <h2 className="text-xl font-bold text-white mb-2">¿Regenerar clave?</h2>
                                    <p className="text-gray-400 text-sm mb-6">El enlace anterior dejará de funcionar.</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold cursor-pointer">Cancelar</button>
                                        <button onClick={confirmRotate} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer">Sí, regenerar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 bg-black/50 p-3 rounded border border-white/10 text-sm text-gray-400 font-mono truncate select-all">
                            {shareUrl || "Cargando..."}
                        </div>
                        <button onClick={handleCopy} className={`text-xs font-bold w-[100px] px-2 py-3 rounded transition-all flex items-center justify-center gap-2 cursor-pointer ${copied ? "bg-green-600" : "bg-blue-600"}`}>
                            {copied ? <Check size={16} /> : <Copy size={14} />}
                            {copied ? "Listo" : "Copiar"}
                        </button>
                    </div>
                </div>

                {/* ZONA DE PELIGRO */}
                <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                     {/* ... (Sin cambios aquí, mantenemos tu lógica de borrado) ... */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                                <AlertTriangle size={16} /> Zona de Peligro
                            </h3>
                            <p className="text-xs text-red-300/60">Esta acción es irreversible.</p>
                        </div>
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="text-xs font-bold text-red-200 bg-red-500/20 border border-red-500/30 px-4 py-3 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                        >
                            <Trash2 size={14} /> Eliminar
                        </button>
                    </div>
                </div>

                {/* MODAL BORRAR */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-red-500">
                            <h2 className="text-xl font-bold text-white mb-2">¿Estás seguro?</h2>
                            <p className="text-gray-400 text-sm mb-6">Vas a eliminar <strong>{event.title}</strong>.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold cursor-pointer" disabled={isDeleting}>Cancelar</button>
                                <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer flex justify-center items-center" disabled={isDeleting}>
                                    {isDeleting ? <Bouncy size={20} color="white" /> : "Sí, eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}