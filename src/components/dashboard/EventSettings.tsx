"use client";

import { useState } from "react";
import { updateEvent, deleteEvent, rotateEventKey, requestEventPublication, revertEventToDraft } from "@/app/lib/dashboard-actions";
import TagsInput from "@/components/ui/TagsInput";
import { useToast } from "@/components/ui/ToastProvider";
import {
    Save, Trash2, AlertTriangle, RefreshCw, Copy, Send, Clock, Check, CheckCircle, XCircle,
    Info, Calendar, ShieldCheck, Globe, Lock, EyeOff,
} from "lucide-react";
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
    tags: string[];
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'DENIED';
    reviewReason: string | null;
    mode: 'GALA' | 'TIERLIST' | 'PREGUNTAS' | 'DIBUJO';
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

function SectionCard({
    icon,
    title,
    description,
    children,
    accent = "text-blue-400",
    className = "",
}: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
    accent?: string;
    className?: string;
}) {
    return (
        <div className={`p-6 bg-neutral-900 border-2 border-neutral-800 rounded-xl shadow-lg ${className}`}>
            <div className="flex items-center gap-3 mb-5 border-b-2 border-neutral-800 pb-4">
                <div className={`p-2 rounded-lg bg-white/5 border-2 border-white/5 ${accent}`}>{icon}</div>
                <div>
                    <h3 className="text-base font-bold text-white">{title}</h3>
                    {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

type Permissions = {
    canEditSettings: boolean;
    canDeleteEvent: boolean;
    canRegenerateKey: boolean;
};

export default function EventSettings({ event, planSlug, permissions }: { event: EventData, planSlug: string, permissions?: Permissions }) {
    const canEdit = permissions?.canEditSettings !== false;
    const canDelete = permissions?.canDeleteEvent !== false;
    const canRotateKey = permissions?.canRegenerateKey !== false;
    const [currentEvent, setCurrentEvent] = useState(event);
    const [tags, setTags] = useState<string[]>(event.tags ?? []);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [isReverting, setIsReverting] = useState(false);

    const router = useRouter();
    const toast = useToast();
    const isUnlimited = planSlug === 'unlimited';
    // El control de privacidad de votos está disponible para los tiers más altos.
    const canUseAnonymous = isUnlimited || planSlug === 'enterprise';
    const isDibujo = event.mode === "DIBUJO";
    const isPreguntas = event.mode === "PREGUNTAS";

    const isApproved = currentEvent.status === "APPROVED";
    const isPending = currentEvent.status === "PENDING";
    const isDraft = currentEvent.status === "DRAFT";
    const isDenied = currentEvent.status === "DENIED";

    // Un evento publicado (APROBADO) o en revisión (PENDING) queda bloqueado:
    // hay que pasarlo a borrador con "Quiero hacer cambios" para poder editarlo.
    const isLocked = isApproved || isPending;
    const editable = canEdit && !isLocked;

    // Solo se puede tocar la visibilidad cuando está aprobado
    const canEditVisibility = isApproved && editable;

    const defaultDate = formatLocalDatetime(currentEvent.galaDate);

    const handleCopy = async () => {
        const origin =
            typeof window !== "undefined" ? window.location.origin : "";
        const path = `/e/${event.slug}${!currentEvent.isPublic ? `?key=${event.accessKey}` : ""
            }`;

        const fullUrl = `${origin}${path}`;
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(fullUrl);
        } else {
            const ta = document.createElement("textarea");
            ta.value = fullUrl;
            ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }

        setCopied(true);
        toast.info("Enlace copiado al portapapeles");
        setTimeout(() => setCopied(false), 1500);
    };


    const handleFormSubmit = async (formData: FormData) => {
        if (!canUseAnonymous) {
            if (currentEvent.isAnonymousVoting) {
                formData.set('isAnonymousVoting', 'on');
            } else {
                formData.delete('isAnonymousVoting');
            }
        }
        // Inject current tags state into formData
        formData.set('tags', tags.join(','));

        const galaDateString = formData.get('galaDate') as string | null;
        if (galaDateString) {
            formData.set('galaDate', new Date(galaDateString).toISOString());
        }
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
            tags,
        }));

        try {
            await updateEvent(event.id, formData);
            toast.success("Configuración guardada correctamente");
        } catch (e) {
            console.error("Error al guardar la configuración", e);
            toast.error("No se pudo guardar la configuración. Inténtalo de nuevo.");
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteEvent(event.id);
            // En caso de éxito, deleteEvent redirige al dashboard.
        } catch (e) {
            console.error("Error al eliminar el evento", e);
            toast.error("No se pudo eliminar el evento.");
            setIsDeleting(false);
        }
    };

    const handleRotateKey = async () => { setShowConfirm(true); };
    const confirmRotate = async () => {
        setShowConfirm(false);
        setIsRegenerating(true);
        try {
            await rotateEventKey(event.id);
            toast.success("Clave de acceso regenerada");
        } catch (e) {
            console.error("Error al regenerar la clave", e);
            toast.error("No se pudo regenerar la clave.");
        } finally {
            setIsRegenerating(false);
        }
    };

    // --- LÓGICA: SOLICITAR PUBLICACIÓN ---

    const handleOpenRequestModal = () => {
        setShowRequestModal(true);
    };

    const confirmRequestPublication = async () => {
        setIsRequesting(true);
        try {
            const res = await requestEventPublication(event.id);

            if (!res || !("success" in res) || !res.success || !res.event) {
                console.error("Error al solicitar publicación:", res?.error);
                toast.error(res?.error ?? "No se pudo enviar el evento a revisión.");
                return;
            }

            // Actualizamos el estado local con los datos devueltos
            setCurrentEvent(prev => ({
                ...prev,
                status: res.event.status,
                reviewReason: res.event.reviewReason ?? null,
            }));

            setShowRequestModal(false);
            toast.success("Evento enviado a revisión");
            router.refresh();
        } catch (e) {
            console.error("Error al solicitar publicación", e);
            toast.error("No se pudo enviar el evento a revisión.");
        } finally {
            setIsRequesting(false);
        }
    };


    const confirmRevertToDraft = async () => {
        setIsReverting(true);
        try {
            const res = await revertEventToDraft(event.id);

            if (!res || !("success" in res) || !res.success || !res.event) {
                console.error("Error al volver a borrador:", res?.error);
                toast.error(res?.error ?? "No se pudo poner el evento en borrador.");
                return;
            }

            setCurrentEvent(prev => ({
                ...prev,
                status: res.event.status,
                isPublic: res.event.isPublic,
                reviewReason: res.event.reviewReason ?? null,
            }));

            setShowRevertModal(false);
            toast.success("Evento en borrador. Ya puedes hacer cambios.");
            router.refresh();
        } catch (e) {
            console.error("Error al volver a borrador", e);
            toast.error("No se pudo poner el evento en borrador.");
        } finally {
            setIsReverting(false);
        }
    };

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}${!currentEvent.isPublic ? `?key=${event.accessKey}` : ''}`;


    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* COLUMNA 1: FORMULARIO EN SECCIONES */}
            <div className="space-y-8">

                {!canEdit && (
                    <div className="px-4 py-2.5 rounded-lg bg-amber-500/10 border-2 border-amber-500/20 text-xs text-amber-400 font-medium">
                        No tienes permiso para editar la configuración de este evento.
                    </div>
                )}

                {/* BLOQUEO POR PUBLICACIÓN / REVISIÓN — "Quiero hacer cambios" */}
                {canEdit && isLocked && (
                    <div className="p-5 rounded-xl border-2 border-blue-500/30 bg-blue-500/5">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                                <Lock size={18} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white">
                                    {isApproved ? "Este evento está publicado" : "Este evento está en revisión"}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                    Mientras esté {isApproved ? "público" : "en revisión"} no puedes editarlo. Pulsa
                                    <strong className="text-gray-200"> Quiero hacer cambios</strong> para volver a ponerlo en
                                    privado y borrador; podrás editarlo y luego solicitar la publicación de nuevo.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowRevertModal(true)}
                                    disabled={isReverting}
                                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-60"
                                >
                                    <RefreshCw size={15} />
                                    Quiero hacer cambios
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <form action={handleFormSubmit} className={`space-y-8 tour-event-settings-card ${!editable ? "opacity-60 pointer-events-none" : ""}`}>

                    {/* SECCIÓN: INFORMACIÓN BÁSICA */}
                    <SectionCard
                        icon={<Info size={18} />}
                        title="Información básica"
                        description="Cómo se presenta tu evento a los participantes."
                    >
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Evento</label>
                                <input name="title" maxLength={40} defaultValue={currentEvent.title} className="w-full bg-black border-2 border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors" required disabled={!editable} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                                <textarea name="description" maxLength={100} defaultValue={currentEvent.description || ""} rows={3} className="w-full bg-black border-2 border-white/20 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors resize-none" disabled={!editable} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Etiquetas</label>
                                <TagsInput value={tags} onChange={setTags} name="tags" />
                            </div>
                        </div>
                    </SectionCard>

                    {/* SECCIÓN: FECHAS Y VISIBILIDAD — oculta en DIBUJO */}
                    {isDibujo ? (
                        <div className="p-4 rounded-xl border-2 border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 flex items-start gap-2">
                            <Lock size={16} className="shrink-0 mt-0.5" />
                            <span>
                                Este evento de <strong>Dibujo</strong> es siempre privado. Las fechas de cierre de dibujo y votación
                                se configuran en la pestaña <strong>Dibujo</strong>.
                            </span>
                        </div>
                    ) : (
                        <SectionCard
                            icon={<Calendar size={18} />}
                            title="Fechas y visibilidad"
                            description={isPreguntas ? "Cuándo se cierra y quién puede verlo." : "Cuándo es la gala y quién puede verla."}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        {isPreguntas ? "Fecha de cierre" : "Fecha de la Gala"}
                                    </label>
                                    <input type="datetime-local" name="galaDate" defaultValue={defaultDate} disabled={!editable} className="w-full bg-black border-2 border-white/20 rounded-lg p-3 text-white dark-calendar focus:border-blue-500 outline-none disabled:opacity-60" />
                                </div>
                                {/* VISIBILIDAD (solo editable si el evento está APROBADO) */}
                                <div className={!canEditVisibility ? "opacity-60" : ""}>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Visibilidad
                                    </label>
                                    <label
                                        className={`flex items-center gap-3 p-3 border-2 border-white/10 rounded-lg bg-black transition-colors h-[50px] ${canEditVisibility
                                            ? "cursor-pointer hover:border-white/30"
                                            : "cursor-not-allowed"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            name="isPublic"
                                            disabled={!canEditVisibility}
                                            defaultChecked={currentEvent.isPublic}
                                            onChange={(e) => {
                                                if (!canEditVisibility) return;
                                                setCurrentEvent({
                                                    ...currentEvent,
                                                    isPublic: e.target.checked,
                                                });
                                            }}
                                            className="accent-blue-500 w-5 h-5 disabled:opacity-50"
                                        />
                                        <span className="text-sm text-gray-300">Evento Público</span>
                                    </label>

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

                            {isPreguntas && (
                                <div className="mt-5 p-3 rounded-lg border-2 border-blue-500/20 bg-blue-500/5 text-xs text-blue-300 flex items-start gap-2">
                                    <Info size={16} className="shrink-0 mt-0.5" />
                                    <span>
                                        Los <strong>resultados de este formulario son privados</strong>: solo tú podrás verlos. El evento puede
                                        publicarse, pero dejará de aparecer en la comunidad cuando llegue su fecha de cierre.
                                    </span>
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {/* SECCIÓN: PRIVACIDAD DE VOTOS */}
                    <SectionCard
                        icon={canUseAnonymous ? <ShieldCheck size={18} /> : <EyeOff size={18} />}
                        title="Privacidad de votos"
                        description="Controla si puedes ver la identidad de los votantes registrados."
                        accent={canUseAnonymous ? "text-purple-400" : "text-gray-400"}
                    >
                        <div className={`p-4 rounded-lg border-2 transition-colors ${canUseAnonymous ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/10 bg-white/5 opacity-80'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="isAnonymous" className={`font-bold text-sm ${canUseAnonymous ? 'cursor-pointer text-white' : 'text-gray-400'}`}>Votación Anónima</label>
                                    {!canUseAnonymous && <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded uppercase">Unlimited Only</span>}
                                </div>
                                <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="isAnonymousVoting" id="isAnonymous" checked={currentEvent.isAnonymousVoting} onChange={(e) => { if (canUseAnonymous) setCurrentEvent({ ...currentEvent, isAnonymousVoting: e.target.checked }); }} disabled={!canUseAnonymous} className="toggle-checkbox absolute block w-12 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer disabled:cursor-not-allowed z-10 opacity-0 inset-0" />
                                    <div className={`block overflow-hidden h-6 rounded-full transition-colors duration-300 ${currentEvent.isAnonymousVoting ? (canUseAnonymous ? 'bg-purple-600' : 'bg-gray-600') : 'bg-gray-700'}`}></div>
                                    <div className={`absolute left-0 top-0 bottom-0 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 pointer-events-none ${currentEvent.isAnonymousVoting ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{canUseAnonymous ? "Si desactivas esto, podrás ver la identidad de los votantes registrados en las estadísticas avanzadas. Los votantes no logueados seguirán siendo anónimos." : "Por defecto, los votos son 100% anónimos. Actualiza a Unlimited para rastrear votantes registrados."}</p>
                        </div>
                    </SectionCard>

                    {editable && (
                        <div className="flex justify-end">
                            <SubmitButton />
                        </div>
                    )}
                </form>
            </div>

            {showRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-blue-500">
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


            {showRevertModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-blue-500">
                        <h2 className="text-xl font-bold text-white mb-2">Volver a borrador</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            <strong>{event.title}</strong> volverá a estar <strong>privado</strong> y en estado{" "}
                            <strong>BORRADOR</strong>. Dejará de aparecer públicamente hasta que vuelvas a solicitar
                            su publicación. ¿Quieres continuar?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRevertModal(false)}
                                disabled={isReverting}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold cursor-pointer disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRevertToDraft}
                                disabled={isReverting}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isReverting ? (
                                    <Bouncy size={20} color="white" />
                                ) : (
                                    <>
                                        <RefreshCw size={16} />
                                        Poner en borrador
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* COLUMNA 2: ESTADO, ENLACES Y ZONA DE PELIGRO */}
            <div className="space-y-8">

                {/* ESTADO DE PUBLICACIÓN — oculta en DIBUJO (siempre privado, no se publica) */}
                {!isDibujo && (
                <div className={`p-6 rounded-xl border-2 ${isApproved ? 'bg-green-900/20 border-green-500/30' :
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
                                {isApproved && "¡Tu evento ha sido aprobado y puede ser publicado!"}
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
                        <div className="mb-4 p-3 bg-red-950/30 border-2 border-red-500/20 rounded-lg">
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
                )}

                {/* COMPARTIR / ENLACE */}
                <div className="p-6 border-2 border-blue-500/20 bg-blue-500/5 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                            {currentEvent.isPublic ? <Globe size={16} /> : <Lock size={16} />}
                            {currentEvent.isPublic ? 'Enlace Público' : 'Enlace Privado (Con Clave)'}
                        </h3>
                        {!currentEvent.isPublic && canRotateKey && (
                            <button onClick={handleRotateKey} disabled={isRegenerating} className="text-[10px] flex items-center gap-1 text-blue-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer">
                                <RefreshCw size={12} className={isRegenerating ? "animate-spin" : ""} />
                                {isRegenerating ? "Generando..." : "Regenerar Clave"}
                            </button>
                        )}
                        {showConfirm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-blue-500">
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
                        <div className="flex-1 bg-black/50 p-3 rounded border-2 border-white/10 text-sm text-gray-400 font-mono truncate select-all">
                            {shareUrl || "Cargando..."}
                        </div>
                        <button onClick={handleCopy} className={`text-xs font-bold w-[100px] px-2 py-3 rounded transition-all flex items-center justify-center gap-2 cursor-pointer ${copied ? "bg-green-600" : "bg-blue-600"}`}>
                            {copied ? <Check size={16} /> : <Copy size={14} />}
                            {copied ? "Listo" : "Copiar"}
                        </button>
                    </div>
                </div>

                {/* ZONA DE PELIGRO */}
                {canDelete && (
                    <div className="p-6 border-2 border-red-500/20 bg-red-500/5 rounded-xl">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 mb-1"><AlertTriangle size={16} /> Eliminar Evento</h3>
                                <p className="text-xs text-red-300/60">Esta acción es irreversible.</p>
                            </div>
                            <button onClick={() => setIsDeleteModalOpen(true)} className="text-xs font-bold text-red-200 bg-red-500/20 border-2 border-red-500/30 px-4 py-3 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"><Trash2 size={14} /> Eliminar</button>
                        </div>
                    </div>
                )}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-red-500">
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
