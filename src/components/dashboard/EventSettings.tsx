"use client";

import { useState } from "react";
import { updateEvent, deleteEvent, rotateEventKey, requestEventPublication } from "@/app/lib/dashboard-actions"; // Importa requestEventPublication (asegúrate de que esté exportada donde la pusiste, si fue en dashboard-actions o event-actions)
// Nota: Si pusiste requestEventPublication en dashboard-actions.ts, impórtala de ahí.
// Si prefieres tener todo lo del evento en un solo sitio, muévela a event-actions.ts. 
// Asumiré que la pusiste en dashboard-actions.ts como en el paso anterior.

import { Save, Trash2, AlertTriangle, RefreshCw, Copy, Send, Clock, Check, CheckCircle, XCircle } from "lucide-react";
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
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'DENIED'; // Nuevo campo
    reviewReason: string | null; // Nuevo campo
};

function formatLocalDatetime(date: Date | string | null) {
    if (!date) return "";
    const d = new Date(date);
    const offsetMs = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-80 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 min-w-[180px] cursor-pointer"
        >
            {pending ? (
                <Bouncy size="30" speed="1.75" color="white" />
            ) : (
                <>
                    <Save size={18} />
                    Guardar Cambios
                </>
            )}
        </button>
    );
}

export default function EventSettings({ event, planSlug }: { event: EventData, planSlug: string }) {
    const [currentEvent, setCurrentEvent] = useState(event);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);


    const router = useRouter();
    const isPlus = planSlug === 'plus';

    // 👇 NUEVO: lógica de estado de moderación
    const isApproved = currentEvent.status === "APPROVED";
    const isPending = currentEvent.status === "PENDING";
    const isDraft = currentEvent.status === "DRAFT";
    const isDenied = currentEvent.status === "DENIED";

    // Solo se puede tocar la visibilidad cuando está aprobado
    const canEditVisibility = isApproved;

    const defaultDate = formatLocalDatetime(currentEvent.galaDate);

    const handleCopy = async () => {
        const origin =
            typeof window !== "undefined" ? window.location.origin : "";
        const path = `/e/${event.slug}${
            !currentEvent.isPublic ? `?key=${event.accessKey}` : ""
        }`;

        const fullUrl = `${origin}${path}`;
        await navigator.clipboard.writeText(fullUrl);

        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };


    const handleFormSubmit = async (formData: FormData) => {
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

    const handleRotateKey = async () => { setShowConfirm(true); };
    const confirmRotate = async () => {
        setShowConfirm(false);
        setIsRegenerating(true);
        await rotateEventKey(event.id);
        setIsRegenerating(false);
    };

    // --- LÓGICA NUEVA: SOLICITAR PUBLICACIÓN ---

    // Abre el modal
    const handleOpenRequestModal = () => {
        setShowRequestModal(true);
    };

    // Confirmación dentro del modal
    const confirmRequestPublication = async () => {
        setIsRequesting(true);
        try {
            const res = await requestEventPublication(event.id);

            // Si hubo error en la server action, opcionalmente lo puedes mostrar con un toast
            if (!res || !("success" in res) || !res.success || !res.event) {
                console.error("Error al solicitar publicación:", res?.error);
                // aquí podrías hacer setAlgúnError(...) si quieres
                return;
            }

            // Actualizamos el estado local con los datos devueltos
            setCurrentEvent(prev => ({
                ...prev,
                status: res.event.status,
                reviewReason: res.event.reviewReason ?? null,
            }));

            setShowRequestModal(false);

            // Opcional: si quieres forzar que el resto del dashboard se sincronice:
            router.refresh();
        } catch (e) {
            console.error("Error al solicitar publicación", e);
        } finally {
            setIsRequesting(false);
        }
    };


    const shareUrl = `/e/${event.slug}${!currentEvent.isPublic ? `?key=${event.accessKey}` : ''}`;


    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* COLUMNA 1: FORMULARIO */}
            <div className="space-y-8">

                {/* NUEVO: CAJA DE ESTADO DE PUBLICACIÓN */}
                <div className={`p-6 rounded-xl border ${isApproved ? 'bg-green-900/20 border-green-500/30' :
                    isPending ? 'bg-yellow-900/20 border-yellow-500/30' :
                        isDenied ? 'bg-red-900/20 border-red-500/30' :
                            'bg-neutral-900 border-white/10'
                    }`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Estado:
                                <span className={`uppercase tracking-wider text-sm px-2 py-0.5 rounded ${isApproved ? 'text-green-400 bg-green-500/10' :
                                    isPending ? 'text-yellow-400 bg-yellow-500/10' :
                                        isDenied ? 'text-red-400 bg-red-500/10' :
                                            'text-gray-400 bg-gray-700/30'
                                    }`}>
                                    {isPending ? 'En Revisión' :
                                        isApproved ? 'Aprobado' :
                                            isDenied ? 'Rechazado' : 'Borrador'}
                                </span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {isDraft && "El evento es privado. Solicita revisión para que aparezca en el buscador público."}
                                {isPending && "Los moderadores están revisando tu evento. Te avisaremos pronto."}
                                {isApproved && "¡Tu evento es público y visible para toda la comunidad!"}
                                {isDenied && "Tu solicitud fue denegada. Revisa el motivo abajo."}
                            </p>
                        </div>

                        <div className="p-2 bg-black/20 rounded-full">
                            {isPending ? <Clock className="text-yellow-500" /> :
                                isApproved ? <CheckCircle className="text-green-500" /> :
                                    isDenied ? <XCircle className="text-red-500" /> :
                                        <Send className="text-gray-500" />}
                        </div>
                    </div>

                    {/* MOTIVO DE RECHAZO */}
                    {isDenied && currentEvent.reviewReason && (
                        <div className="mb-4 p-3 bg-red-950/30 border border-red-500/20 rounded-lg">
                            <p className="text-xs text-red-300 font-bold uppercase mb-1">Motivo del rechazo:</p>
                            <p className="text-sm text-white">{currentEvent.reviewReason}</p>
                        </div>
                    )}

                    {/* BOTÓN DE ACCIÓN */}
                    {(isDraft || isDenied) && (
                        <button
                            onClick={handleOpenRequestModal}
                            disabled={isRequesting}
                            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isRequesting ? (
                                <Bouncy size="20" color="black" />
                            ) : (
                                <>
                                    <Send size={16} />
                                    {isDenied ? "Corregir y Solicitar de Nuevo" : "Solicitar Publicación"}
                                </>
                            )}
                        </button>
                    )}

                </div>

                {/* FORMULARIO ORIGINAL */}
                <form action={handleFormSubmit} className="space-y-6 p-6 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg">
                    {/* ... (Mismo contenido del formulario que tenías: Título, Descripción, Fecha...) ... */}
                    {/* COPIA AQUÍ EL RESTO DEL FORMULARIO QUE YA TENÍAS EN EL ARCHIVO PREVIO */}
                    <h2 className="text-2xl font-bold text-white mb-4 border-b border-neutral-700 pb-3">Configuración General</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Evento</label>
                        <input name="title" maxLength={40} defaultValue={currentEvent.title} className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                        <textarea name="description" maxLength={100} defaultValue={currentEvent.description || ""} rows={3} className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors resize-none" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de la Gala</label>
                            <input type="datetime-local" name="galaDate" defaultValue={defaultDate} className="w-full bg-black border border-white/20 rounded-lg p-3 text-white dark-calendar focus:border-blue-500 outline-none" />
                        </div>
                        {/* VISIBILIDAD (solo editable si el evento está APROBADO) */}
                        <div className={!canEditVisibility ? "opacity-60" : ""}>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Visibilidad
                            </label>

                            <label
                                className={`flex items-center gap-3 p-3 border border-white/10 rounded-lg bg-black transition-colors h-[50px] ${canEditVisibility
                                    ? "cursor-pointer hover:border-white/30"
                                    : "cursor-not-allowed"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    name="isPublic"
                                    disabled={!canEditVisibility} // 👈 AQUÍ SE BLOQUEA REALMENTE
                                    defaultChecked={currentEvent.isPublic}
                                    onChange={(e) => {
                                        if (!canEditVisibility) return; // doble seguridad
                                        setCurrentEvent({
                                            ...currentEvent,
                                            isPublic: e.target.checked,
                                        });
                                    }}
                                    className="accent-blue-500 w-5 h-5 disabled:opacity-50"
                                />
                                <span className="text-sm text-gray-300">Evento Público</span>
                            </label>

                            {/* Mensajito explicativo según estado */}
                            {!canEditVisibility && (
                                isDenied ? (
                                    <p className="mt-1 text-xs text-red-400">
                                        El evento ha sido <strong>DENEGADO</strong>. Revisa los motivos en la sección
                                        de solicitudes y corrige el contenido antes de volver a enviarlo.
                                    </p>
                                ) : (
                                    <p className="mt-2 text-xs text-yellow-400">
                                        Tu evento todavía no ha sido aprobado por el equipo de revisión.
                                        No puedes cambiar la visibilidad hasta que esté <strong>APROBADO</strong>.
                                    </p>
                                )
                            )}

                            
                        </div>
                    </div>
                    <div className={`p-4 rounded-lg border transition-colors ${isPlus ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/10 bg-white/5 opacity-70'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <label htmlFor="isAnonymous" className={`font-bold text-sm ${isPlus ? 'cursor-pointer text-white' : 'text-gray-400'}`}>Votación Anónima</label>
                                {!isPlus && <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded uppercase">Plus Only</span>}
                            </div>
                            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="isAnonymousVoting" id="isAnonymous" checked={currentEvent.isAnonymousVoting} onChange={(e) => { if (isPlus) setCurrentEvent({ ...currentEvent, isAnonymousVoting: e.target.checked }); }} disabled={!isPlus} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer disabled:cursor-not-allowed z-10 opacity-0 inset-0" />
                                <div className={`block overflow-hidden h-6 rounded-full transition-colors duration-300 ${currentEvent.isAnonymousVoting ? (isPlus ? 'bg-purple-600' : 'bg-gray-600') : 'bg-gray-700'}`}></div>
                                <div className={`absolute left-0 top-0 bottom-0 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 pointer-events-none ${currentEvent.isAnonymousVoting ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{isPlus ? "Si desactivas esto, podrás ver la identidad de los votantes en las estadísticas avanzadas." : "Por defecto, los votos son 100% anónimos. Actualiza a Premium+ para rastrear votantes."}</p>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <SubmitButton />
                    </div>
                </form>
            </div>

            {showRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-blue-500">
                        <h2 className="text-xl font-bold text-white mb-2">Enviar a revisión</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            ¿Estás seguro de que quieres enviar <strong>{event.title}</strong> a revisión?
                            <br />
                            Un administrador revisará el contenido antes de hacerlo público.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRequestModal(false)}
                                disabled={isRequesting}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold cursor-pointer disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRequestPublication}
                                disabled={isRequesting}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isRequesting ? (
                                    <Bouncy size={20} color="white" />
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Enviar a revisión
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* COLUMNA 2: ENLACES Y ZONA PELIGRO (MANTENER IGUAL) */}
            <div className="space-y-8">
                <div className="p-6 border border-blue-500/20 bg-blue-500/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                            {currentEvent.isPublic ? '🌍 Enlace Público' : '🔒 Enlace Privado (Con Clave)'}
                        </h3>
                        {!currentEvent.isPublic && (
                            <button onClick={handleRotateKey} disabled={isRegenerating} className="text-[10px] flex items-center gap-1 text-blue-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer">
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

                <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 mb-1"><AlertTriangle size={16} /> Zona de Peligro</h3>
                            <p className="text-xs text-red-300/60">Esta acción es irreversible.</p>
                        </div>
                        <button onClick={() => setIsDeleteModalOpen(true)} className="text-xs font-bold text-red-200 bg-red-500/20 border border-red-500/30 px-4 py-3 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"><Trash2 size={14} /> Eliminar</button>
                    </div>
                </div>
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