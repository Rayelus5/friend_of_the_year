"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, Pencil, Trash2, Save, X, CircleHelp, CheckSquare, Circle, Search, FileSpreadsheet, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import { createQuestion, updateQuestion, deleteQuestion, reorderQuestions } from "@/app/lib/preguntas-actions";
import { bulkCreateQuestions } from "@/app/lib/csv-actions";
import { useToast } from "@/components/ui/ToastProvider";
import CsvManagerModal, { type CsvManagerConfig, type ParsedRow } from "@/components/dashboard/CsvManagerModal";

type QOption = { id?: string; text: string; order?: number };
type Question = {
    id: string;
    text: string;
    description: string | null;
    type: "CHECKBOX" | "RADIO";
    isRequired: boolean;
    pageIndex: number;
    order: number;
    options: QOption[];
};

export default function QuestionManager({
    initialQuestions,
    eventId,
    planSlug,
    canManage = true,
}: {
    initialQuestions: Question[];
    eventId: string;
    planSlug: string;
    canManage?: boolean;
}) {
    const router = useRouter();
    const toast = useToast();
    const [questions, setQuestions] = useState<Question[]>([...initialQuestions].sort((a, b) => a.order - b.order));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCsv, setShowCsv] = useState(false);
    const [showCsvUpgrade, setShowCsvUpgrade] = useState(false);

    useEffect(() => {
        setQuestions([...initialQuestions].sort((a, b) => a.order - b.order));
    }, [initialQuestions]);

    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const limit = PLANS[planKey]?.limits?.preguntasMaxQuestions ?? 8;
    const maxOptions = PLANS[planKey]?.limits?.preguntasMaxOptions ?? 5;
    const maxPerPage = PLANS[planKey]?.limits?.preguntasMaxPerPage ?? 4;
    const atLimit = questions.length >= limit;
    const canImportCsv = planSlug === "enterprise" || planSlug === "unlimited";

    const filteredQuestions = questions.filter((q) => q.text.toLowerCase().includes(searchQuery.toLowerCase()));

    const csvConfig: CsvManagerConfig = {
        title: "Preguntas",
        headers: ["pregunta", "descripcion", "tipo", "obligatoria", "pagina", "opciones"],
        requiredHeaders: ["pregunta", "opciones"],
        example: 'pregunta,descripcion,tipo,obligatoria,pagina,opciones\n"¿Color favorito?","",radio,si,1,"Rojo|Verde|Azul"',
        hints: [
            { col: "pregunta", desc: "obligatorio, máx. 300 caracteres" },
            { col: "tipo", desc: "radio (una opción) o checkbox (varias)" },
            { col: "obligatoria", desc: "si / no" },
            { col: "pagina", desc: "número de página (empieza en 1)" },
            { col: "opciones", desc: "lista separada por | (ej. A|B|C), mín. 2" },
        ],
        sampleHref: "/csv/ejemplo_preguntas.csv",
        parseRow: (row, rowIndex): ParsedRow => {
            const text = (row.pregunta ?? "").trim();
            if (!text) return { ok: false, rowIndex, value: "", error: "Pregunta obligatoria" };
            if (text.length > 300) return { ok: false, rowIndex, value: text, error: "Supera 300 caracteres" };
            const options = (row.opciones ?? "").split("|").map((o) => o.trim()).filter(Boolean);
            if (options.length < 2) return { ok: false, rowIndex, value: text, error: "Mín. 2 opciones (separadas por |)" };
            const type = (row.tipo ?? "").toLowerCase() === "checkbox" ? "CHECKBOX" : "RADIO";
            const isRequired = ["si", "sí", "true", "1", "yes"].includes((row.obligatoria ?? "").toLowerCase().trim());
            const pageIndex = Math.max(0, (parseInt(row.pagina ?? "1", 10) || 1) - 1);
            return { ok: true, rowIndex, value: text, data: { text, description: row.descripcion?.trim() || undefined, type, isRequired, pageIndex, options } };
        },
        onImport: (rows) => bulkCreateQuestions(eventId, rows as Parameters<typeof bulkCreateQuestions>[1]),
        exportHeaders: ["pregunta", "descripcion", "tipo", "obligatoria", "pagina", "opciones"],
        exportData: [...questions].sort((a, b) => a.order - b.order).map((q) => [
            q.text,
            q.description ?? "",
            q.type === "CHECKBOX" ? "checkbox" : "radio",
            q.isRequired ? "si" : "no",
            String(q.pageIndex + 1),
            q.options.map((o) => o.text).join("|"),
        ]),
        exportFilename: `preguntas-${eventId}.csv`,
        limit,
        currentCount: questions.length,
        unitLabel: "preguntas",
    };

    async function handleCreate(fd: FormData) {
        setError(null);
        const res = await createQuestion(eventId, fd);
        if (res?.error) { setError(res.error); toast.error(res.error); return; }
        setIsCreating(false);
        toast.success("Pregunta creada");
        router.refresh();
    }

    async function handleUpdate(id: string, fd: FormData) {
        setError(null);
        const res = await updateQuestion(id, eventId, fd);
        if (res?.error) { setError(res.error); toast.error(res.error); return; }
        setEditingId(null);
        toast.success("Pregunta actualizada");
        router.refresh();
    }

    async function handleDelete(id: string) {
        const res = await deleteQuestion(id, eventId);
        if (res?.error) { toast.error(res.error); return; }
        toast.success("Pregunta eliminada");
        router.refresh();
    }

    async function onDragEnd(result: DropResult) {
        if (!result.destination || result.destination.index === result.source.index) return;
        const reordered = Array.from(questions);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);
        setQuestions(reordered);
        await reorderQuestions(reordered.map((q, i) => ({ id: q.id, order: i })), eventId);
        router.refresh();
    }

    return (
        <div className="space-y-4">
            {/* Header (mismo estilo que Nominados) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Preguntas</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 font-mono ${atLimit ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-gray-500 border-gray-700"}`}>
                        {questions.length} / {limit}
                    </span>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar preguntas..."
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
                            onClick={() => (atLimit ? setError(`Has alcanzado el límite de ${limit} preguntas de tu plan.`) : setIsCreating(true))}
                            className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Plus size={14} /> Nuevo
                        </button>
                    )}
                </div>
            </div>

            <p className="text-[11px] text-gray-600">
                Máx. {maxOptions} opciones por pregunta · máx. {maxPerPage} preguntas por página. Los resultados son privados (solo tú los ves).
            </p>

            {error && <div className="p-3 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>}

            {isCreating && (
                <QuestionForm maxOptions={maxOptions} onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="questions">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {filteredQuestions.map((q, index) => (
                                <Draggable key={q.id} draggableId={q.id} index={index} isDragDisabled={!canManage || editingId === q.id || searchQuery.length > 0}>
                                    {(prov) => (
                                        <div ref={prov.innerRef} {...prov.draggableProps} className="bg-neutral-900/60 border-2 border-white/8 rounded-xl overflow-hidden">
                                            {editingId === q.id ? (
                                                <div className="p-3">
                                                    <QuestionForm
                                                        maxOptions={maxOptions}
                                                        initial={q}
                                                        onSubmit={(fd) => handleUpdate(q.id, fd)}
                                                        onCancel={() => setEditingId(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3 p-3.5">
                                                    {canManage && (
                                                        <span {...prov.dragHandleProps} className="text-gray-600 hover:text-gray-300 cursor-grab mt-1">
                                                            <GripVertical size={16} />
                                                        </span>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-white">{q.text}</span>
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 inline-flex items-center gap-1">
                                                                {q.type === "CHECKBOX" ? <CheckSquare size={10} /> : <Circle size={10} />}
                                                                {q.type === "CHECKBOX" ? "Múltiple" : "Única"}
                                                            </span>
                                                            {q.isRequired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">Obligatoria</span>}
                                                            <span className="text-[10px] text-gray-600">Pág. {q.pageIndex + 1}</span>
                                                        </div>
                                                        {q.description && <p className="text-xs text-gray-500 mt-0.5">{q.description}</p>}
                                                        <p className="text-[11px] text-gray-600 mt-1">{q.options.length} opciones</p>
                                                    </div>
                                                    {canManage && (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => setEditingId(q.id)} className="h-9 w-9 flex items-center justify-center text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg cursor-pointer">
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button onClick={() => handleDelete(q.id)} className="h-9 w-9 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg cursor-pointer">
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

            {questions.length === 0 && !isCreating && (
                <div className="text-center py-12 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm flex flex-col items-center gap-2">
                    <CircleHelp size={28} className="text-gray-700" />
                    Aún no hay preguntas. Crea la primera.
                </div>
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
                            <strong>Unlimited</strong>. Mejora tu plan para crear preguntas en masa.
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

function QuestionForm({
    maxOptions,
    initial,
    onSubmit,
    onCancel,
}: {
    maxOptions: number;
    initial?: Question;
    onSubmit: (formData: FormData) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [text, setText] = useState(initial?.text ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [type, setType] = useState<"CHECKBOX" | "RADIO">(initial?.type ?? "RADIO");
    const [isRequired, setIsRequired] = useState(initial?.isRequired ?? false);
    const [pageIndex, setPageIndex] = useState(initial?.pageIndex ?? 0);
    const [options, setOptions] = useState<QOption[]>(
        initial?.options.length ? initial.options.map((o) => ({ id: o.id, text: o.text })) : [{ text: "" }, { text: "" }]
    );

    const setOptionText = (i: number, val: string) =>
        setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, text: val } : o)));
    const addOption = () => options.length < maxOptions && setOptions((p) => [...p, { text: "" }]);
    const removeOption = (i: number) => setOptions((p) => p.filter((_, idx) => idx !== i));

    const handleSubmit = (fd: FormData) => {
        fd.set("type", type);
        fd.set("isRequired", isRequired ? "true" : "false");
        fd.set("pageIndex", String(pageIndex));
        fd.set("optionsJson", JSON.stringify(options.filter((o) => o.text.trim()).map((o) => ({ id: o.id, text: o.text.trim() }))));
        return onSubmit(fd);
    };

    return (
        <form action={handleSubmit} className="space-y-3 p-3 rounded-xl border-2 border-blue-500/30 bg-blue-950/10">
            <input
                name="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={300}
                required
                autoFocus
                placeholder="Texto de la pregunta"
                className="w-full bg-black border-2 border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
            />
            <input
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="Descripción (opcional)"
                className="w-full bg-black border-2 border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
            />

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border-2 border-white/10">
                    <button type="button" onClick={() => setType("RADIO")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${type === "RADIO" ? "bg-white/10 text-white" : "text-gray-500"}`}>
                        <Circle size={12} /> Única
                    </button>
                    <button type="button" onClick={() => setType("CHECKBOX")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${type === "CHECKBOX" ? "bg-white/10 text-white" : "text-gray-500"}`}>
                        <CheckSquare size={12} /> Múltiple
                    </button>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} /> Obligatoria
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-400">
                    Página
                    <input type="number" min={1} value={pageIndex + 1} onChange={(e) => setPageIndex(Math.max(0, (parseInt(e.target.value, 10) || 1) - 1))} className="w-16 bg-black border-2 border-white/15 rounded px-2 py-1 text-white text-sm outline-none focus:border-blue-500" />
                </label>
            </div>

            {/* Opciones */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Opciones ({options.length}/{maxOptions})</span>
                    {options.length < maxOptions && (
                        <button type="button" onClick={addOption} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
                            <Plus size={12} /> Añadir
                        </button>
                    )}
                </div>
                {options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                        {type === "CHECKBOX" ? <CheckSquare size={14} className="text-gray-600 shrink-0" /> : <Circle size={14} className="text-gray-600 shrink-0" />}
                        <input
                            value={o.text}
                            onChange={(e) => setOptionText(i, e.target.value)}
                            maxLength={200}
                            placeholder={`Opción ${i + 1}`}
                            className="flex-1 bg-black border-2 border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                        />
                        {options.length > 2 && (
                            <button type="button" onClick={() => removeOption(i)} className="h-8 w-8 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg cursor-pointer">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-2 pt-1">
                <button type="submit" className="h-10 px-4 bg-white text-black rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-gray-100 cursor-pointer">
                    <Save size={14} /> Guardar
                </button>
                <button type="button" onClick={onCancel} className="h-10 px-3 bg-white/5 border-2 border-white/10 text-gray-400 rounded-lg hover:bg-white/10 cursor-pointer">
                    <X size={14} />
                </button>
            </div>
        </form>
    );
}
