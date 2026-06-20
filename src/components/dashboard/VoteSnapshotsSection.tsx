"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Trophy, Trash2, ChevronDown, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import { useToast } from "@/components/ui/ToastProvider";
import { createVoteSnapshot, deleteVoteSnapshot, type VoteSnapshotDTO } from "@/app/lib/snapshot-actions";

function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VoteSnapshotsSection({
    eventId,
    initialSnapshots,
    canManage,
}: {
    eventId: string;
    initialSnapshots: VoteSnapshotDTO[];
    canManage: boolean;
}) {
    const router = useRouter();
    const toast = useToast();

    const [showResetModal, setShowResetModal] = useState(false);
    const [title, setTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleReset = async () => {
        if (isSaving) return;
        const t = title.trim();
        if (!t) { toast.error("Ponle un título a esta edición."); return; }
        setIsSaving(true);
        try {
            const res = await createVoteSnapshot(eventId, t);
            if (!res || "error" in res) {
                toast.error(res?.error ?? "No se pudo guardar la edición.");
                return;
            }
            toast.success("Edición guardada. Votaciones reiniciadas.");
            setShowResetModal(false);
            setTitle("");
            router.refresh();
        } catch (e) {
            console.error(e);
            toast.error("No se pudo guardar la edición.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await deleteVoteSnapshot(id);
            if (!res || "error" in res) {
                toast.error(res?.error ?? "No se pudo eliminar la edición.");
                return;
            }
            toast.success("Edición eliminada.");
            router.refresh();
        } catch (e) {
            console.error(e);
            toast.error("No se pudo eliminar la edición.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-neutral-900/50 border-2 border-white/10 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 border-2 border-white/5 text-amber-400">
                        <Archive size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Ediciones guardadas</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Guarda los resultados actuales y reinicia las votaciones para repetir el evento.
                        </p>
                    </div>
                </div>
                {canManage && (
                    <button
                        onClick={() => setShowResetModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 border-2 border-amber-500/20 rounded-full text-xs font-bold hover:bg-amber-500/20 transition-colors cursor-pointer whitespace-nowrap"
                    >
                        <RotateCcw size={14} /> Reiniciar votaciones
                    </button>
                )}
            </div>

            {initialSnapshots.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm">
                    Aún no has guardado ninguna edición.
                </div>
            ) : (
                <div className="space-y-3">
                    {initialSnapshots.map((snap) => {
                        const isOpen = expandedId === snap.id;
                        return (
                            <div key={snap.id} className="border-2 border-white/8 rounded-xl overflow-hidden bg-black/20">
                                <div className="flex items-center gap-3 p-4">
                                    <button
                                        onClick={() => setExpandedId(isOpen ? null : snap.id)}
                                        className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0"
                                    >
                                        <ChevronDown
                                            size={16}
                                            className={`text-gray-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                        />
                                        <div className="min-w-0">
                                            <p className="font-bold text-white truncate">{snap.title}</p>
                                            <p className="text-[11px] text-gray-500">
                                                {formatDate(snap.createdAt)} · {snap.totalVotes} votos · {snap.data.totalPolls} categorías
                                            </p>
                                        </div>
                                    </button>
                                    {canManage && (
                                        <button
                                            onClick={() => handleDelete(snap.id)}
                                            disabled={deletingId === snap.id}
                                            className="h-9 w-9 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
                                            title="Eliminar edición"
                                        >
                                            {deletingId === snap.id ? <Bouncy size={16} color="#f87171" /> : <Trash2 size={16} />}
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 space-y-2">
                                                {snap.data.polls.map((poll, i) => (
                                                    <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5">
                                                        <span className="text-sm text-gray-300 truncate">{poll.title}</span>
                                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 shrink-0">
                                                            <Trophy size={12} />
                                                            {poll.winner ?? "Sin votos"}
                                                            <span className="text-gray-500 font-normal">({poll.totalVotes})</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de reinicio (destructivo) */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-amber-500">
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <RotateCcw size={20} className="text-amber-400" /> Reiniciar votaciones
                        </h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Se guardarán los resultados actuales como una edición y <strong>se borrarán todos los votos</strong> para
                            empezar de cero. Esta acción no se puede deshacer.
                        </p>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Título de la edición</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={120}
                            placeholder="Ej: Edición 2026"
                            className="w-full bg-black border-2 border-white/15 rounded-lg px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none mb-4"
                        />
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border-2 border-amber-500/20 text-[11px] text-amber-300 mb-5">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <span>Tras reiniciar, recuerda actualizar la fecha de la gala en Ajustes para la nueva edición.</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowResetModal(false); setTitle(""); }}
                                disabled={isSaving}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold cursor-pointer disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={isSaving}
                                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Bouncy size={20} color="white" /> : <><Archive size={16} /> Guardar y reiniciar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
