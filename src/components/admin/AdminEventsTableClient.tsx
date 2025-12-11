// src/components/admin/AdminEventsTableClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { ExternalLink, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { clsx } from "clsx";

type EventRow = {
    id: string;
    title: string;
    slug: string;
    status: string;
    isPublic: boolean;
    createdAt: string; // ISO
    user: { name: string | null; email: string | null; image: string | null };
    _count: { polls: number; participants: number };
};

export default function AdminEventsTableClient({
    events,
    currentPage,
    totalPages,
    query,
    status,
}: {
    events: EventRow[];
    currentPage: number;
    totalPages: number;
    query?: string;
    status?: string;
}) {
    const router = useRouter();
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [loadingAction, setLoadingAction] = useState(false);

    const selectedIds = useMemo(
        () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
        [selected]
    );

    const allSelectedOnPage = events.length > 0 && events.every((e) => selected[e.id]);
    const someSelected = selectedIds.length > 0;

    function toggleOne(id: string) {
        setSelected((s) => ({ ...s, [id]: !s[id] }));
    }

    function toggleAll() {
        if (allSelectedOnPage) {
            // clear page selections
            const next = { ...selected };
            events.forEach((e) => delete next[e.id]);
            setSelected(next);
            return;
        }
        // select all shown
        const next = { ...selected };
        events.forEach((e) => (next[e.id] = true));
        setSelected(next);
    }

    async function doBatchAction(action: "delete" | "updateStatus", payload?: any) {
        if (!someSelected) return;
        const ids = selectedIds;
        const confirmMsg =
            action === "delete"
                ? `Vas a eliminar ${ids.length} evento(s). Esta acción es irreversible. ¿Continuar?`
                : `Vas a cambiar el estado de ${ids.length} evento(s) a "${payload?.status}". ¿Continuar?`;

        if (!window.confirm(confirmMsg)) return;

        setLoadingAction(true);
        try {
            const res = await fetch("/api/admin/events/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    ids,
                    ...(payload || {}),
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                alert(json?.error || "Error en la acción masiva");
            } else {
                // limpiar selección de los ids afectados
                const next = { ...selected };
                ids.forEach((id) => delete next[id]);
                setSelected(next);

                // refresh server data
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            alert("Error de red al ejecutar la acción.");
        } finally {
            setLoadingAction(false);
        }
    }

    return (
        <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden mb-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={allSelectedOnPage}
                            onChange={toggleAll}
                            className="w-4 h-4"
                        />
                        <span className="text-gray-300">Seleccionar página</span>
                    </label>

                    <span className="text-sm text-gray-400">{selectedIds.length} seleccionado(s)</span>

                    <div className="h-6 w-px bg-white/5 mx-2" />

                    <button
                        onClick={() => doBatchAction("updateStatus", { status: "APPROVED" })}
                        disabled={!someSelected || loadingAction}
                        className={clsx(
                            "px-3 py-1 text-sm rounded-md border",
                            !someSelected ? "opacity-40 cursor-not-allowed" : "bg-green-600/10 border-green-600 text-green-300"
                        )}
                    >
                        Marcar Aprobado
                    </button>

                    <button
                        onClick={() => doBatchAction("updateStatus", { status: "PENDING" })}
                        disabled={!someSelected || loadingAction}
                        className={clsx(
                            "px-3 py-1 text-sm rounded-md border",
                            !someSelected ? "opacity-40 cursor-not-allowed" : "bg-yellow-600/10 border-yellow-600 text-yellow-300"
                        )}
                    >
                        Marcar Pendiente
                    </button>

                    <button
                        onClick={() => doBatchAction("delete")}
                        disabled={!someSelected || loadingAction}
                        className={clsx(
                            "px-3 py-1 text-sm rounded-md border",
                            !someSelected ? "opacity-40 cursor-not-allowed" : "bg-red-600/10 border-red-600 text-red-300"
                        )}
                    >
                        Eliminar
                    </button>
                </div>

                <div className="text-sm text-gray-400">
                    Página {currentPage} / {totalPages}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-3 font-medium w-[60px]">Sel</th>
                            <th className="p-3 font-medium">Evento</th>
                            <th className="p-3 font-medium">Creador</th>
                            <th className="p-3 font-medium">Estado</th>
                            <th className="p-3 font-medium">Privacidad</th>
                            <th className="p-3 font-medium">Stats</th>
                            <th className="p-3 font-medium">Creado</th>
                            <th className="p-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {events.map((event) => (
                            <tr key={event.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={!!selected[event.id]}
                                        onChange={() => toggleOne(event.id)}
                                        className="w-4 h-4"
                                    />
                                </td>

                                <td className="p-3 max-w-[260px]">
                                    <div className="font-bold text-white mb-1 truncate" title={event.title}>
                                        {event.title}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono truncate">{event.slug}</div>
                                </td>

                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden shrink-0">
                                            {event.user.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={event.user.image} alt="" className="w-full h-full object-cover" />
                                            ) : null}
                                        </div>
                                        <div>
                                            <div className="text-white text-xs font-medium">{event.user.name || "—"}</div>
                                            <div className="text-[10px] text-gray-500 truncate">{event.user.email || "—"}</div>
                                        </div>
                                    </div>
                                </td>

                                <td className="p-3">
                                    <span className={clsx(
                                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                                        event.status === "APPROVED" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                        event.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                                        "bg-gray-800 text-gray-400 border border-gray-700"
                                    )}>
                                        {event.status}
                                    </span>
                                </td>

                                <td className="p-3">
                                    <span className={`text-[10px] px-2 py-1 rounded border ${event.isPublic ? "border-blue-500/30 text-blue-400 bg-blue-500/10" : "border-gray-700 text-gray-400 bg-gray-800"}`}>
                                        {event.isPublic ? "Público" : "Privado"}
                                    </span>
                                </td>

                                <td className="p-3 text-xs font-mono text-gray-400">
                                    <div>{event._count.polls} Cats</div>
                                    <div>{event._count.participants} Noms</div>
                                </td>

                                <td className="p-3 text-gray-500 text-xs">
                                    {format(new Date(event.createdAt), "dd MMM yy", { locale: es })}
                                </td>

                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <a target="_blank" rel="noreferrer" href={`/e/${event.slug}`} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition" title="Ver Web Pública">
                                            <ExternalLink size={16} />
                                        </a>
                                        <a href={`/admin/events/${event.id}`} className="p-2 text-white hover:bg-white/10 rounded transition" title="Gestionar Evento">
                                            <Eye size={16} />
                                        </a>
                                        <button
                                            onClick={async () => {
                                                if (!confirm("Eliminar este evento definitivamente?")) return;
                                                setLoadingAction(true);
                                                try {
                                                    const r = await fetch("/api/admin/events/batch", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ action: "delete", ids: [event.id] }),
                                                    });
                                                    if (!r.ok) {
                                                        const j = await r.json().catch(() => ({}));
                                                        alert(j?.error || "Error al eliminar");
                                                    } else {
                                                        router.refresh();
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert("Error de red");
                                                } finally {
                                                    setLoadingAction(false);
                                                }
                                            }}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded transition"
                                            title="Eliminar evento"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}