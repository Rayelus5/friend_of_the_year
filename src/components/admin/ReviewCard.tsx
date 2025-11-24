"use client";

import { useState } from "react";
import { approveEvent, rejectEvent } from "@/app/lib/admin-actions";
import { Check, X, ExternalLink, User, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Bouncy } from 'ldrs/react';
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

if (typeof window !== 'undefined') import('ldrs/bouncy');

export default function ReviewCard({ event }: { event: any }) {
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        if(!confirm(`¿Confirmas que el evento "${event.title}" cumple con las normas?`)) return;
        setLoading(true);
        await approveEvent(event.id);
        // La UI se actualiza sola por el revalidatePath
    };

    const handleReject = async () => {
        if (!reason.trim()) return alert("Por favor, indica un motivo para el rechazo.");
        setLoading(true);
        await rejectEvent(event.id, reason);
        setLoading(false);
    };

    return (
        <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors group">
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{event.title}</h3>
                        <Link 
                            href={`/admin/reviews/${event.id}`} 
                            target="_blank"
                            className="text-blue-400 hover:text-blue-300 bg-blue-500/10 p-1.5 rounded-md transition-colors"
                            title="Ver página pública"
                        >
                            <ExternalLink size={14} />
                        </Link>
                    </div>
                    <p className="text-sm text-gray-400 bg-black/30 p-3 rounded-lg border border-white/5 leading-relaxed">
                        {event.description || <span className="italic text-gray-600">Sin descripción proporcionada.</span>}
                    </p>
                </div>
                
                <div className="text-right shrink-0 flex flex-col items-end">
                     <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Calendar size={12} /> Actualizado {formatDistanceToNow(new Date(event.updatedAt), { addSuffix: true, locale: es })}
                     </div>
                     <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded">
                        ID: {event.id.slice(0,8)}...
                     </span>
                </div>
            </div>

            {/* Info Contextual */}
            <div className="px-6 py-3 bg-black/20 flex flex-wrap items-center gap-6 text-xs text-gray-400 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold">
                        {event.user.name?.[0] || "?"}
                    </div>
                    <span>{event.user.name} ({event.user.email})</span>
                </div>
                <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
                <span className="font-mono"><strong className="text-white">{event._count.polls}</strong> Categorías</span>
                <span className="font-mono"><strong className="text-white">{event._count.participants}</strong> Nominados</span>
            </div>

            {/* Acciones de Moderación */}
            <div className="p-4 bg-white/[0.02]">
                {!rejecting ? (
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setRejecting(true)} 
                            disabled={loading}
                            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold rounded-lg flex items-center gap-2 text-sm transition-colors"
                        >
                            <X size={16} /> Denegar
                        </button>
                        <button 
                            onClick={handleApprove} 
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center gap-2 text-sm transition-colors shadow-lg shadow-green-900/20"
                        >
                            {loading ? <Bouncy size="20" color="white"/> : <><Check size={16} /> Aprobar y Publicar</>}
                        </button>
                    </div>
                ) : (
                    <div className="bg-red-950/20 p-4 rounded-lg border border-red-900/50 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                            <AlertCircle size={14} /> Motivo del rechazo
                        </div>
                        <textarea 
                            className="w-full bg-black border border-red-900/50 rounded-lg p-3 text-white text-sm mb-3 focus:border-red-500 outline-none min-h-[80px] placeholder-gray-600"
                            placeholder="Explica al usuario por qué su evento no cumple las normas (ej: lenguaje ofensivo, spam...)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setRejecting(false)} className="px-4 py-2 text-gray-400 text-xs hover:text-white font-medium transition-colors">Cancelar</button>
                            <button onClick={handleReject} disabled={loading} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2">
                                {loading ? <Bouncy size="20" color="white" /> : "Confirmar Rechazo"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}