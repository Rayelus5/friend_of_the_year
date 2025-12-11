// src/components/admin/AdminUsersTableClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Eye, Trash2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { clsx } from "clsx";

type UserRow = {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    image: string | null;
    role: string;
    ipBan: boolean;
    subscriptionStatus: string;
    stripePriceId: string | null;
    createdAt: string; // ISO
    _count: { events: number; reports: number };
};

export default function AdminUsersTableClient({
    users,
    currentPage,
    totalPages,
    query,
    role,
}: {
    users: UserRow[];
    currentPage: number;
    totalPages: number;
    query?: string;
    role?: string;
}) {
    const router = useRouter();
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [loadingAction, setLoadingAction] = useState(false);

    const selectedIds = useMemo(
        () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
        [selected]
    );

    const allSelectedOnPage = users.length > 0 && users.every((u) => selected[u.id]);
    const someSelected = selectedIds.length > 0;

    function toggleOne(id: string) {
        setSelected((s) => ({ ...s, [id]: !s[id] }));
    }

    function toggleAll() {
        if (allSelectedOnPage) {
            const next = { ...selected };
            users.forEach((u) => delete next[u.id]);
            setSelected(next);
            return;
        }
        const next = { ...selected };
        users.forEach((u) => (next[u.id] = true));
        setSelected(next);
    }

    async function doBatch(action: string, payload?: any) {
        if (!someSelected) return;
        const ids = selectedIds;
        let confirmMsg = "";

        switch (action) {
            case "delete":
                confirmMsg = `Vas a eliminar ${ids.length} usuario(s). Esta acción es irreversible. Escribe OK para confirmar.`;
                break;
            case "ban":
                confirmMsg = `Vas a ${payload?.ban ? "banear" : "desbanear"} ${ids.length} usuario(s). ¿Continuar?`;
                break;
            case "setRole":
                confirmMsg = `Vas a cambiar el rol de ${ids.length} usuario(s) a "${payload.role}". ¿Continuar?`;
                break;
            case "setPlan":
                confirmMsg = `Vas a actualizar el plan de ${ids.length} usuario(s) a "${payload.plan}". ¿Continuar?`;
                break;
            default:
                confirmMsg = "Confirmar acción masiva?";
        }

        if (action === "delete") {
            const typed = prompt(confirmMsg);
            if (typed !== "OK") return;
        } else {
            if (!confirm(confirmMsg)) return;
        }

        setLoadingAction(true);
        try {
            const res = await fetch("/api/admin/users/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, ids, ...(payload || {}) }),
            });
            const json = await res.json();
            if (!res.ok) {
                alert(json?.error || "Error en la acción masiva");
            } else {
                // limpiar selección de los afectados
                const next = { ...selected };
                ids.forEach((id) => delete next[id]);
                setSelected(next);
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            alert("Error de red");
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
                        <input type="checkbox" checked={allSelectedOnPage} onChange={toggleAll} className="w-4 h-4" />
                        <span className="text-gray-300">Seleccionar página</span>
                    </label>

                    <span className="text-sm text-gray-400">{selectedIds.length} seleccionado(s)</span>

                    <div className="h-6 w-px bg-white/5 mx-2" />

                    <button
                        onClick={() => doBatch("setRole", { role: "ADMIN" })}
                        disabled={!someSelected || loadingAction}
                        className={clsx("px-3 py-1 text-sm rounded-md border", !someSelected ? "opacity-40 cursor-not-allowed" : "bg-purple-600/10 border-purple-600 text-purple-300")}
                    >
                        Hacer Admin
                    </button>

                    <button
                        onClick={() => doBatch("setRole", { role: "MODERATOR" })}
                        disabled={!someSelected || loadingAction}
                        className={clsx("px-3 py-1 text-sm rounded-md border", !someSelected ? "opacity-40 cursor-not-allowed" : "bg-blue-600/10 border-blue-600 text-blue-300")}
                    >
                        Hacer Moderador
                    </button>

                    <button
                        onClick={() => doBatch("ban", { ban: true })}
                        disabled={!someSelected || loadingAction}
                        className={clsx("px-3 py-1 text-sm rounded-md border", !someSelected ? "opacity-40 cursor-not-allowed" : "bg-red-600/10 border-red-600 text-red-300")}
                    >
                        Banear
                    </button>

                    <button
                        onClick={() => doBatch("ban", { ban: false })}
                        disabled={!someSelected || loadingAction}
                        className={clsx("px-3 py-1 text-sm rounded-md border", !someSelected ? "opacity-40 cursor-not-allowed" : "bg-emerald-600/10 border-emerald-600 text-emerald-300")}
                    >
                        Desbanear
                    </button>

                    <button
                        onClick={() => doBatch("setPlan", { plan: "free" })}
                        disabled={!someSelected || loadingAction}
                        className={clsx("px-3 py-1 text-sm rounded-md border", !someSelected ? "opacity-40 cursor-not-allowed" : "bg-white/5 border-white/20 text-gray-200")}
                    >
                        Marcar Free
                    </button>

                    <button
                        onClick={() => doBatch("setPlan", { plan: "unlimited" })}
                        disabled={!someSelected || loadingAction}
                        className={clsx("px-3 py-1 text-sm rounded-md border", !someSelected ? "opacity-40 cursor-not-allowed" : "bg-indigo-600/10 border-indigo-600 text-indigo-300")}
                    >
                        Marcar Unlimited
                    </button>

                    <button
                        onClick={() => doBatch("delete")}
                        disabled={!someSelected || loadingAction}
                        className={clsx("px-3 py-1 text-sm rounded-md border", !someSelected ? "opacity-40 cursor-not-allowed" : "bg-red-700/10 border-red-700 text-red-300")}
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
                            <th className="p-3 font-medium">Usuario</th>
                            <th className="p-3 font-medium">Estado</th>
                            <th className="p-3 font-medium">Plan</th>
                            <th className="p-3 font-medium">Actividad</th>
                            <th className="p-3 font-medium">Registro</th>
                            <th className="p-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {users.map((u) => (
                            <tr key={u.id} className={clsx("hover:bg-white/5 transition-colors group", u.ipBan ? "bg-red-900/10" : "")}>
                                <td className="p-3">
                                    <input type="checkbox" checked={!!selected[u.id]} onChange={() => toggleOne(u.id)} className="w-4 h-4" />
                                </td>

                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden text-xs font-bold text-gray-500">
                                            {u.image ? <img src={u.image} className="w-full h-full object-cover" /> : u.name?.[0] ?? "U"}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{u.name}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>

                                <td className="p-3">
                                    <div className="flex gap-2 items-center">
                                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", u.role === "ADMIN" ? "bg-purple-900/20 text-purple-400 border-purple-500/20" : u.role === "MODERATOR" ? "bg-blue-900/20 text-blue-400 border-blue-500/20" : "bg-gray-800 text-gray-400 border-gray-700")}>
                                            {u.role}
                                        </span>
                                        {u.ipBan && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-900/20 text-red-400 border border-red-500/20 flex items-center gap-1"><ShieldAlert size={10} /> BANNED</span>}
                                    </div>
                                </td>

                                <td className="p-3">
                                    <span className={`capitalize text-xs ${u.subscriptionStatus === "active" ? "text-green-400" : "text-gray-500"}`}>
                                        {u.subscriptionStatus}
                                    </span>
                                </td>

                                <td className="p-3 text-xs text-gray-400 font-mono">
                                    <div>{u._count.events} Eventos</div>
                                    {u._count.reports > 0 && <div className="text-red-400">{u._count.reports} Reportes</div>}
                                </td>

                                <td className="p-3 text-gray-500 text-xs">
                                    {format(new Date(u.createdAt), "dd MMM yyyy", { locale: es })}
                                </td>

                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <a href={`/admin/users/${u.id}`} className="inline-flex p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Ver Detalles">
                                            <Eye size={16} />
                                        </a>
                                        <button
                                            onClick={async () => {
                                                if (!confirm("Eliminar usuario definitivamente?")) return;
                                                setLoadingAction(true);
                                                try {
                                                    const r = await fetch("/api/admin/users/batch", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ action: "delete", ids: [u.id] }),
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
                                            title="Eliminar usuario"
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