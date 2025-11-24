"use client";

import { useState } from "react";
import { approveEvent, rejectEvent } from "@/app/lib/admin-actions";
import { Check, X, AlertCircle } from "lucide-react";
import { Bouncy } from 'ldrs/react';
import { useRouter } from "next/navigation";

if (typeof window !== 'undefined') {
    import('ldrs/bouncy');
}

export default function ReviewActions({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
    const [loading, setLoading] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const router = useRouter();

    const handleApprove = async () => {
        if (!confirm(`¿Estás seguro de que quieres APROBAR "${eventTitle}"?`)) return;
        
        setLoading(true);
        try {
            await approveEvent(eventId);
            router.refresh(); // Refrescar para ver el nuevo estado
        } catch (error) {
            alert("Error al aprobar el evento");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            alert("Por favor, escribe un motivo para el rechazo.");
            return;
        }

        setLoading(true);
        try {
            await rejectEvent(eventId, reason);
            router.refresh();
        } catch (error) {
            alert("Error al rechazar el evento");
        } finally {
            setLoading(false);
        }
    };

    if (isRejecting) {
        return (
            <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Motivo del Rechazo
                </h4>
                <p className="text-xs text-red-300/70 mb-3">
                    Este mensaje será enviado al usuario para que pueda corregir su evento.
                </p>
                <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-black/50 border border-red-500/30 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-red-500 min-h-[100px] mb-3 placeholder-gray-600"
                    placeholder="Ej: El contenido incumple las normas de la comunidad..."
                    autoFocus
                />
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsRejecting(false)}
                        className="flex-1 py-2 bg-transparent border border-white/10 hover:bg-white/5 text-gray-400 text-xs font-bold rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleReject}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? <Bouncy size="20" color="white" /> : "Confirmar Rechazo"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <button 
                onClick={handleApprove}
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
            >
                {loading ? <Bouncy size="20" color="white" /> : (
                    <>
                        <Check size={18} /> Aprobar y Publicar
                    </>
                )}
            </button>

            <button 
                onClick={() => setIsRejecting(true)}
                disabled={loading}
                className="w-full py-3 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-400 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
                <X size={18} /> Denegar Solicitud
            </button>
        </div>
    );
}