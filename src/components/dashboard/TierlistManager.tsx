"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, Pencil, Trash2, Save, X, Layers, Search, FileSpreadsheet, Sparkles, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import { createTier, updateTier, deleteTier, reorderTiers } from "@/app/lib/tierlist-actions";
import { bulkCreateTiers } from "@/app/lib/csv-actions";
import CsvManagerModal, { type CsvManagerConfig, type ParsedRow } from "@/components/dashboard/CsvManagerModal";
import { useToast } from "@/components/ui/ToastProvider";

type Tier = { id: string; label: string; color: string; order: number };

const PRESET_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

// Plantillas de tiers (hardcoded por ahora). El array es escalable: añadir una
// nueva plantilla es solo un objeto más, sin tocar la UI.
type TierTemplate = {
    id: string;
    name: string;
    description: string;
    tiers: { label: string; color: string }[];
};

// Azul · Verde · Amarillo · Naranja · Rojo · Rosa · Morado (tokens de DESIGN.md)
const TEMPLATE_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444", "#ec4899", "#8b5cf6"];

const TIER_TEMPLATES: TierTemplate[] = [
    {
        id: "basica",
        name: "Básica",
        description: "Tiers clásicos por letras",
        tiers: ["S++", "S", "A", "B", "C", "D", "E"].map((label, i) => ({ label, color: TEMPLATE_COLORS[i] })),
    },
    {
        id: "detallada",
        name: "Detallada",
        description: "Tiers descriptivos",
        tiers: ["Excelente", "Muy bien", "Bien", "Normal", "Mal", "Muy mal", "Horrible"].map((label, i) => ({ label, color: TEMPLATE_COLORS[i] })),
    },
];

export default function TierlistManager({
    initialTiers,
    eventId,
    planSlug,
    canManage = true,
}: {
    initialTiers: Tier[];
    eventId: string;
    planSlug: string;
    canManage?: boolean;
}) {
    const router = useRouter();
    const toast = useToast();
    const [tiers, setTiers] = useState<Tier[]>([...initialTiers].sort((a, b) => a.order - b.order));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCsv, setShowCsv] = useState(false);
    const [showCsvUpgrade, setShowCsvUpgrade] = useState(false);
    const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

    useEffect(() => {
        setTiers([...initialTiers].sort((a, b) => a.order - b.order));
    }, [initialTiers]);

    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const limit = PLANS[planKey]?.limits?.tierlistMaxTiers ?? 5;
    const atLimit = tiers.length >= limit;
    const canImportCsv = planSlug === "enterprise" || planSlug === "unlimited";

    const filteredTiers = tiers.filter((t) => t.label.toLowerCase().includes(searchQuery.toLowerCase()));

    const csvConfig: CsvManagerConfig = {
        title: "Tiers",
        headers: ["nombre", "color"],
        requiredHeaders: ["nombre"],
        example: "nombre,color\nS,#ef4444\nA,#f97316",
        hints: [
            { col: "nombre", desc: "obligatorio, máx. 50 caracteres" },
            { col: "color", desc: "opcional, hex (ej. #ef4444)" },
        ],
        sampleHref: "/csv/ejemplo_tiers.csv",
        parseRow: (row, rowIndex): ParsedRow => {
            const label = (row.nombre ?? "").trim();
            if (!label) return { ok: false, rowIndex, value: "", error: "Nombre obligatorio" };
            if (label.length > 50) return { ok: false, rowIndex, value: label, error: "Supera 50 caracteres" };
            return { ok: true, rowIndex, value: label, data: { label, color: (row.color ?? "").trim() || undefined } };
        },
        onImport: (rows) => bulkCreateTiers(eventId, rows as { label: string; color?: string }[]),
        exportHeaders: ["nombre", "color"],
        exportData: tiers.map((t) => [t.label, t.color]),
        exportFilename: `tiers-${eventId}.csv`,
        limit,
        currentCount: tiers.length,
        unitLabel: "tiers",
    };

    async function handleCreate(formData: FormData) {
        setError(null);
        const res = await createTier(eventId, formData);
        if (res?.error) { setError(res.error); toast.error(res.error); return; }
        setIsCreating(false);
        toast.success("Tier creado");
        router.refresh();
    }

    async function handleUpdate(tierId: string, formData: FormData) {
        setError(null);
        const res = await updateTier(tierId, eventId, formData);
        if (res?.error) { setError(res.error); toast.error(res.error); return; }
        setEditingId(null);
        toast.success("Tier actualizado");
        router.refresh();
    }

    async function handleDelete(tierId: string) {
        const res = await deleteTier(tierId, eventId);
        if (res?.error) { toast.error(res.error); return; }
        toast.success("Tier eliminado");
        router.refresh();
    }

    async function handleApplyTemplate(template: TierTemplate) {
        setError(null);
        setApplyingTemplate(template.id);
        // Respetamos el límite del plan: enviamos solo los primeros `limit` tiers
        // para no generar errores de "límite alcanzado".
        const rows = template.tiers.slice(0, limit);
        const res = await bulkCreateTiers(eventId, rows);
        setApplyingTemplate(null);
        if (res.created === 0 && res.errors.length > 0) {
            setError(res.errors[0].reason);
            return;
        }
        router.refresh();
    }

    async function onDragEnd(result: DropResult) {
        if (!result.destination || result.destination.index === result.source.index) return;
        const reordered = Array.from(tiers);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);
        setTiers(reordered);
        await reorderTiers(reordered.map((t, i) => ({ id: t.id, order: i })), eventId);
        router.refresh();
    }

    return (
        <div className="space-y-4">
            {/* Header (mismo estilo que Nominados) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Tiers</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 font-mono ${atLimit ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-gray-500 border-gray-700"}`}>
                        {tiers.length} / {limit}
                    </span>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar tiers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border-2 border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    {canManage && (
                        <button
                            onClick={() => (canImportCsv ? setShowCsv(true) : setShowCsvUpgrade(true))}
                            className="bg-amber-500/10 text-amber-400 border-2 border-amber-500/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-amber-500/20 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <FileSpreadsheet size={14} /> CSV {!canImportCsv && <Lock size={11} />}
                        </button>
                    )}
                    {canManage && (
                        <button
                            onClick={() => (atLimit ? setError(`Has alcanzado el límite de ${limit} tiers de tu plan.`) : setIsCreating(true))}
                            className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Plus size={14} /> Nuevo
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>
            )}

            {isCreating && (
                <TierForm
                    onSubmit={handleCreate}
                    onCancel={() => setIsCreating(false)}
                    suggestedColor={PRESET_COLORS[tiers.length % PRESET_COLORS.length]}
                />
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="tiers">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {filteredTiers.map((tier, index) => (
                                <Draggable key={tier.id} draggableId={tier.id} index={index} isDragDisabled={!canManage || editingId === tier.id || searchQuery.length > 0}>
                                    {(prov) => (
                                        <div
                                            ref={prov.innerRef}
                                            {...prov.draggableProps}
                                            className="bg-neutral-900/60 border-2 border-white/8 rounded-xl overflow-hidden"
                                        >
                                            {editingId === tier.id ? (
                                                <div className="p-3">
                                                    <TierForm
                                                        initialLabel={tier.label}
                                                        initialColor={tier.color}
                                                        onSubmit={(fd) => handleUpdate(tier.id, fd)}
                                                        onCancel={() => setEditingId(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3">
                                                    {canManage && (
                                                        <span {...prov.dragHandleProps} aria-label={`Reordenar tier ${tier.label}`} className="text-gray-600 hover:text-gray-300 cursor-grab">
                                                            <GripVertical size={16} />
                                                        </span>
                                                    )}
                                                    <div
                                                        className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-black/80 text-sm shrink-0"
                                                        style={{ backgroundColor: tier.color }}
                                                    >
                                                        {tier.label.slice(0, 3)}
                                                    </div>
                                                    <span className="flex-1 font-semibold text-white truncate">{tier.label}</span>
                                                    {canManage && (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => setEditingId(tier.id)} aria-label={`Editar tier ${tier.label}`} className="h-9 w-9 flex items-center justify-center text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg cursor-pointer">
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button onClick={() => handleDelete(tier.id)} aria-label={`Eliminar tier ${tier.label}`} className="h-9 w-9 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg cursor-pointer">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {tiers.length === 0 && !isCreating && (
                canManage ? (
                    <TierTemplatePicker
                        templates={TIER_TEMPLATES}
                        limit={limit}
                        applyingId={applyingTemplate}
                        onApply={handleApplyTemplate}
                        onManual={() => setIsCreating(true)}
                    />
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm flex flex-col items-center gap-2">
                        <Layers size={28} className="text-gray-700" />
                        Aún no hay tiers.
                    </div>
                )
            )}

            {showCsv && canManage && (
                <CsvManagerModal
                    config={csvConfig}
                    onClose={() => setShowCsv(false)}
                    onImported={() => router.refresh()}
                />
            )}

            {/* Aviso de mejora cuando CSV está bloqueado por plan */}
            {showCsvUpgrade && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowCsvUpgrade(false)}
                >
                    <div
                        className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <Lock className="text-amber-500" /> Función CSV bloqueada
                        </h2>
                        <p className="text-gray-400 text-sm mb-8">
                            La importación por <strong>CSV</strong> está disponible en los planes <strong>Enterprise</strong> y{" "}
                            <strong>Unlimited</strong>. Mejora tu plan para crear tiers en masa.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCsvUpgrade(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <Link href="/premium" className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-center shadow-lg transition-colors">
                                Mejorar Plan
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TierTemplatePicker({
    templates,
    limit,
    applyingId,
    onApply,
    onManual,
}: {
    templates: TierTemplate[];
    limit: number;
    applyingId: string | null;
    onApply: (template: TierTemplate) => void;
    onManual: () => void;
}) {
    const isApplying = applyingId !== null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-300">
                <Sparkles size={16} className="text-blue-400" />
                <h4 className="text-sm font-bold">Empieza con una plantilla</h4>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
                Crea todos los tiers de golpe, o créalos manualmente uno a uno.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((template) => {
                    const capped = template.tiers.length > limit;
                    const previewTiers = template.tiers.slice(0, limit);
                    const applyingThis = applyingId === template.id;
                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => onApply(template)}
                            disabled={isApplying}
                            className="group text-left p-4 rounded-xl border-2 border-white/10 bg-neutral-900/60 hover:border-blue-500/40 hover:bg-blue-950/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-white text-sm">{template.name}</span>
                                {applyingThis && <Loader2 size={14} className="text-blue-400 animate-spin" />}
                            </div>
                            <p className="text-[11px] text-gray-500 mb-3">{template.description}</p>

                            {/* Preview de tiers coloreados */}
                            <div className="flex flex-wrap gap-1">
                                {previewTiers.map((t, i) => (
                                    <span
                                        key={i}
                                        className="h-6 min-w-6 px-1.5 rounded-md flex items-center justify-center text-[10px] font-bold text-black/80"
                                        style={{ backgroundColor: t.color }}
                                        title={t.label}
                                    >
                                        {t.label.length > 6 ? t.label.slice(0, 5) + "…" : t.label}
                                    </span>
                                ))}
                            </div>

                            {capped && (
                                <p className="text-[10px] text-amber-400/80 mt-2">
                                    Tu plan permite {limit} tiers: se crearán los primeros {limit}.
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="text-center pt-1">
                <button
                    type="button"
                    onClick={onManual}
                    disabled={isApplying}
                    className="text-xs text-gray-400 hover:text-white underline underline-offset-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    Crear tiers manualmente
                </button>
            </div>
        </div>
    );
}

function TierForm({
    initialLabel = "",
    initialColor = PRESET_COLORS[0],
    suggestedColor,
    onSubmit,
    onCancel,
}: {
    initialLabel?: string;
    initialColor?: string;
    suggestedColor?: string;
    onSubmit: (formData: FormData) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [label, setLabel] = useState(initialLabel);
    const [color, setColor] = useState(suggestedColor ?? initialColor);

    return (
        <form
            action={onSubmit}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border-2 border-blue-500/30 bg-blue-950/10"
        >
            <input type="hidden" name="color" value={color} />
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent border-2 border-white/15 cursor-pointer"
                    title="Color del tier"
                />
                <div className="hidden sm:flex gap-1">
                    {PRESET_COLORS.map((c) => (
                        <button key={c} type="button" onClick={() => setColor(c)} className="w-5 h-5 rounded-full border border-white/20 cursor-pointer" style={{ backgroundColor: c }} />
                    ))}
                </div>
            </div>
            <input
                name="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={50}
                required
                autoFocus
                placeholder="Nombre del tier (S, A, Top…)"
                className="flex-1 bg-black border-2 border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
            />
            <div className="flex gap-2">
                <button type="submit" className="h-10 px-4 bg-white text-black rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-gray-100 cursor-pointer">
                    <Save size={14} /> Guardar
                </button>
                <button type="button" onClick={onCancel} aria-label="Cancelar" className="h-10 px-3 bg-white/5 border-2 border-white/10 text-gray-400 rounded-lg hover:bg-white/10 cursor-pointer">
                    <X size={14} />
                </button>
            </div>
        </form>
    );
}
