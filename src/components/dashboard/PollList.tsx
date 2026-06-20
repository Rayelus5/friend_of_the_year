"use client";

import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createEventPoll, updateEventPoll, deleteEventPoll, reorderEventPolls } from "@/app/lib/event-actions";
import { bulkCreatePolls, type BulkImportResult } from "@/app/lib/csv-actions";
import {
    GripVertical, Pencil, Trash2, X, Plus, Search,
    Lock, Star, Crown, AlertCircle, ListChecks, Check,
    Vote, Hash, Users, ChevronLeft, ChevronRight,
    FileSpreadsheet, Download, CheckCircle2, XCircle, Upload, RefreshCw,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { useFormStatus } from "react-dom";
import { Bouncy } from "ldrs/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import { motion, AnimatePresence } from "framer-motion";

if (typeof window !== "undefined") {
    import("ldrs/bouncy");
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Participant = { id: string; name: string };

type Poll = {
    id: string;
    title: string;
    description: string | null;
    endAt: Date | null;
    isPublished: boolean;
    votingType: "SINGLE" | "MULTIPLE" | "LIMITED_MULTIPLE";
    maxOptions: number | null;
    _count: { votes: number };
    options: { participantId: string }[];
};

const PAGE_SIZE = 10;
const MIN_NOMINEES = 2;

// ─── Submit button ────────────────────────────────────────────────────────────

function ModalSubmitButton({ isCreating, disabled: extraDisabled }: { isCreating: boolean; disabled?: boolean }) {
    const { pending } = useFormStatus();
    const isDisabled = pending || extraDisabled;
    return (
        <button
            type="submit"
            disabled={isDisabled}
            className="flex-1 h-11 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 cursor-pointer flex justify-center items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
            {pending
                ? <Bouncy size="20" speed="1.75" color="black" />
                : isCreating ? "Crear categoría" : "Guardar cambios"
            }
        </button>
    );
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <button
            disabled={pending}
            className="h-9 w-9 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
        >
            {pending
                ? <Bouncy size="16" speed="1.75" color="#f87171" />
                : <Trash2 size={15} />
            }
        </button>
    );
}

// ─── Voting type badge ────────────────────────────────────────────────────────

function VotingBadge({ type, maxOptions }: { type: Poll["votingType"]; maxOptions: number | null }) {
    const map = {
        SINGLE: { label: "Voto único", className: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
        MULTIPLE: { label: "Múltiple libre", className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        LIMITED_MULTIPLE: { label: `Máx. ${maxOptions}`, className: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    };
    const { label, className } = map[type];
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border-2 ${className}`}>
            {label}
        </span>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PollList({
    initialPolls,
    allParticipants,
    eventId,
    planSlug,
    canManagePolls = true,
    limitOverride,
}: {
    initialPolls: Poll[];
    allParticipants: Participant[];
    eventId: string;
    planSlug: string;
    canManagePolls?: boolean;
    /** Límite de categorías resuelto desde BD (fuente de verdad). */
    limitOverride?: number;
}) {
    const router = useRouter();
    const [polls, setPolls] = useState(initialPolls);
    const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    // Motivo del aviso de mejora: límite de categorías alcanzado o función CSV bloqueada.
    const [upgradeReason, setUpgradeReason] = useState<"limit" | "csv">("limit");
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

    const [title, setTitle] = useState("");
    const [votingType, setVotingType] = useState<Poll["votingType"]>("SINGLE");

    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const currentLimit = limitOverride ?? (PLANS[planKey]?.limits?.pollsPerEvent || 5);
    const canImportCsv = planSlug === "enterprise" || planSlug === "unlimited";
    const currentCount = polls.length;
    const isAtLimit = currentCount >= currentLimit;

    useEffect(() => { setPolls(initialPolls); }, [initialPolls]);

    const handleCreateClick = () => {
        if (isAtLimit) {
            setUpgradeReason("limit");
            setShowUpgradeModal(true);
        } else {
            setTitle("");
            setVotingType("SINGLE");
            setSelectedParticipantIds([]);
            setIsCreating(true);
        }
    };

    const handleCsvClick = () => {
        if (canImportCsv) setShowCsvModal(true);
        else { setUpgradeReason("csv"); setShowUpgradeModal(true); }
    };

    const openEdit = (poll: Poll) => {
        setTitle(poll.title);
        setVotingType(poll.votingType);
        setSelectedParticipantIds(poll.options.map(o => o.participantId));
        setEditingPoll(poll);
    };

    const closeModal = () => {
        setEditingPoll(null);
        setIsCreating(false);
        setSelectedParticipantIds([]);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const filteredPolls = polls.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination || searchQuery) return;
        const items = Array.from(polls);
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);
        setPolls(items);
        await reorderEventPolls(items.map((item, i) => ({ id: item.id, order: i })), eventId);
    };

    const modalOpen = editingPoll !== null || isCreating;
    const submitDisabled = selectedParticipantIds.length < MIN_NOMINEES;

    return (
        <>
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 tour-polls-section">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Orden de Categorías
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 font-mono
                        ${isAtLimit
                            ? "text-red-400 border-red-500/30 bg-red-500/10"
                            : "text-gray-500 border-gray-700"
                        }`}>
                        {currentCount} / {currentLimit}
                    </span>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar categoría..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border-2 border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    {canManagePolls && (
                        <button
                            onClick={handleCsvClick}
                            className="bg-amber-500/10 text-amber-400 border-2 border-amber-500/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-amber-500/20 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <FileSpreadsheet size={14} /> CSV {!canImportCsv && <Lock size={11} />}
                        </button>
                    )}
                    {canManagePolls && (
                        <button
                            onClick={handleCreateClick}
                            className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Plus size={14} /> Nueva
                        </button>
                    )}
                </div>
            </div>

            {/* ── Upgrade modal ── */}
            <AnimatePresence>
                {showUpgradeModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowUpgradeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                <Lock className="text-amber-500" /> {upgradeReason === "csv" ? "Función CSV bloqueada" : "Límite Alcanzado"}
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                {upgradeReason === "csv" ? (
                                    <>La importación por <strong>CSV</strong> está disponible en los planes <strong>Enterprise</strong> y <strong>Unlimited</strong>. Mejora tu plan para crear categorías en masa.</>
                                ) : (
                                    <>Has creado el máximo de <strong>{currentLimit} categorías</strong> en tu plan actual.</>
                                )}
                            </p>
                            <div className={`bg-black/40 rounded-xl border-2 border-white/5 p-4 mb-8 space-y-3 ${upgradeReason === "csv" ? "hidden" : ""}`}>
                                <div className="flex justify-between items-center text-sm border-b-2 border-white/5 pb-2">
                                    <span className="text-gray-500">Tu Plan ({PLANS[planKey].name})</span>
                                    <span className="font-mono text-red-400">{currentLimit} categorías</span>
                                </div>
                                {planSlug !== "premium" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-blue-300"><Star size={12} /> Premium</span>
                                        <span className="font-mono text-white">{PLANS.PREMIUM.limits.pollsPerEvent} categorías</span>
                                    </div>
                                )}
                                {planSlug !== "plus" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-purple-300"><Crown size={12} /> Plus</span>
                                        <span className="font-mono text-white">{PLANS.PLUS.limits.pollsPerEvent} categorías</span>
                                    </div>
                                )}
                                {planSlug !== "unlimited" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-purple-300"><Crown size={12} /> Unlimited</span>
                                        <span className="font-mono text-white">{PLANS.UNLIMITED.limits.pollsPerEvent} categorías</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <Link href="/premium" className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-center shadow-lg transition-colors">
                                    Mejorar Plan
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Poll list ── */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="polls" isDropDisabled={searchQuery.length > 0}>
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {filteredPolls.map((poll, index) => {
                                const endDate = poll.endAt ? new Date(poll.endAt) : null;
                                const dateString = endDate && isValid(endDate) ? format(endDate, "dd/MM/yyyy") : null;
                                const displayIndex = searchQuery
                                    ? polls.findIndex(p => p.id === poll.id)
                                    : index;

                                return (
                                    <Draggable
                                        key={poll.id}
                                        draggableId={poll.id}
                                        index={displayIndex}
                                        isDragDisabled={searchQuery.length > 0}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`group flex items-center gap-3 p-3.5 rounded-xl border-2 transition-colors
                                                    ${snapshot.isDragging
                                                        ? "border-blue-500/60 bg-neutral-800 shadow-xl shadow-black/40"
                                                        : "bg-neutral-900/60 border-white/8 hover:border-white/15"
                                                    }`}
                                            >
                                                {/* Drag handle */}
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className={`text-gray-700 hover:text-gray-400 transition-colors shrink-0
                                                        ${searchQuery ? "cursor-default opacity-20" : "cursor-grab active:cursor-grabbing"}`}
                                                >
                                                    <GripVertical size={16} />
                                                </div>

                                                {/* Index badge */}
                                                <div className="w-7 h-7 rounded-lg bg-white/5 border-2 border-white/8 flex items-center justify-center shrink-0">
                                                    <span className="text-[11px] font-mono font-bold text-gray-500">
                                                        {displayIndex + 1}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-100 text-sm truncate">{poll.title}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        <VotingBadge type={poll.votingType} maxOptions={poll.maxOptions} />
                                                        <span className="text-[10px] font-mono text-gray-600">
                                                            {poll.options.length} nominados
                                                        </span>
                                                        <span className="text-[10px] font-mono text-gray-600">
                                                            · {poll._count.votes} votos
                                                        </span>
                                                        {dateString && (
                                                            <span className="text-[10px] font-mono text-gray-600">
                                                                · cierra {dateString}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                {canManagePolls && (
                                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                                        <button
                                                            onClick={() => openEdit(poll)}
                                                            className="h-9 w-9 flex items-center justify-center text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all cursor-pointer"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <form action={deleteEventPoll.bind(null, poll.id, eventId)}>
                                                            <DeleteButton />
                                                        </form>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}

                            {filteredPolls.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm flex flex-col items-center gap-2">
                                    <ListChecks size={28} className="text-gray-700" />
                                    {searchQuery ? "No se encontraron categorías." : "Aún no hay categorías. Pulsa \"Nueva\" para empezar."}
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* ── CSV Import Modal ── */}
            {showCsvModal && canManagePolls && (
                <CsvImportPollsModal
                    eventId={eventId}
                    limit={currentLimit}
                    currentCount={currentCount}
                    onClose={(didCreate) => {
                        setShowCsvModal(false);
                        if (didCreate) router.refresh();
                    }}
                />
            )}

            {/* ── Create / Edit modal ── */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.97, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.97, opacity: 0, y: 8 }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            className="relative bg-zinc-950 border-2 border-white/10 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top accent line */}
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white/8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Vote size={15} />
                                    </div>
                                    <h2 className="text-base font-bold text-white">
                                        {isCreating ? "Nueva Categoría" : "Editar Categoría"}
                                    </h2>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Form */}
                            <form
                                action={async (fd) => {
                                    if (isCreating) await createEventPoll(eventId, fd);
                                    else if (editingPoll) await updateEventPoll(editingPoll.id, eventId, fd);
                                    closeModal();
                                }}
                                className="p-6 space-y-5"
                            >
                                {/* Título */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Título
                                    </label>
                                    <input
                                        name="title"
                                        value={title}
                                        maxLength={100}
                                        onChange={handleTitleChange}
                                        className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600 transition-colors"
                                        placeholder="Ej: Mejor Actor..."
                                        required
                                        autoFocus
                                    />
                                </div>

                                {/* Descripción */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Descripción <span className="normal-case font-normal text-gray-600">(opcional)</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        defaultValue={editingPoll?.description || ""}
                                        rows={2}
                                        maxLength={150}
                                        className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600 resize-none transition-colors"
                                        placeholder="Descripción breve de la categoría..."
                                    />
                                </div>

                                {/* Reglas de voto */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Reglas de Voto
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["SINGLE", "MULTIPLE", "LIMITED_MULTIPLE"] as const).map((type) => {
                                            const labels = {
                                                SINGLE: { short: "Único", desc: "Solo 1 voto" },
                                                MULTIPLE: { short: "Múltiple", desc: "Sin límite" },
                                                LIMITED_MULTIPLE: { short: "Limitado", desc: "Con máximo" },
                                            };
                                            const selected = votingType === type;
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setVotingType(type)}
                                                    className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all cursor-pointer
                                                        ${selected
                                                            ? "border-blue-500/60 bg-blue-500/10 text-white"
                                                            : "border-white/8 bg-white/3 text-gray-500 hover:border-white/15 hover:text-gray-300"
                                                        }`}
                                                >
                                                    {selected && (
                                                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <Check size={9} className="text-white" />
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-bold">{labels[type].short}</span>
                                                    <span className="text-[10px] opacity-70">{labels[type].desc}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <input type="hidden" name="votingType" value={votingType} />

                                    <AnimatePresence>
                                        {votingType === "LIMITED_MULTIPLE" && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-2 space-y-1.5">
                                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                        <Hash size={10} /> Máximo de opciones
                                                    </label>
                                                    <input
                                                        name="maxOptions"
                                                        type="number"
                                                        min="2"
                                                        defaultValue={editingPoll?.maxOptions || 2}
                                                        className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                                                        required
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {votingType !== "LIMITED_MULTIPLE" && (
                                        <p className="text-[11px] text-gray-600 flex items-center gap-1 pt-1">
                                            <AlertCircle size={11} />
                                            {votingType === "SINGLE"
                                                ? "El votante elige exactamente un nominado."
                                                : "El votante puede marcar tantos nominados como quiera."}
                                        </p>
                                    )}
                                </div>

                                {/* Nominados */}
                                <div className="space-y-2 pt-1 border-t-2 border-white/5">
                                    <div className="flex items-center justify-between pt-4">
                                        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Users size={11} />
                                            Nominados
                                        </label>
                                        <AnimatePresence mode="wait">
                                            {selectedParticipantIds.length > 0 ? (
                                                <motion.span
                                                    key="count"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border-2 ${
                                                        selectedParticipantIds.length >= MIN_NOMINEES
                                                            ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                                                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                                    }`}
                                                >
                                                    {selectedParticipantIds.length} / {allParticipants.length} seleccionados
                                                </motion.span>
                                            ) : (
                                                <motion.span
                                                    key="empty"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="text-[10px] text-gray-600 font-mono"
                                                >
                                                    {allParticipants.length} disponibles
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <ParticipantSelector
                                        allParticipants={allParticipants}
                                        selectedIds={selectedParticipantIds}
                                        onSelectionChange={setSelectedParticipantIds}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="h-11 px-5 bg-white/5 hover:bg-white/10 border-2 border-white/10 rounded-xl text-gray-300 font-semibold text-sm transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <ModalSubmitButton isCreating={isCreating} disabled={submitDisabled} />
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ─── Participant selector ─────────────────────────────────────────────────────

function ParticipantSelector({
    allParticipants,
    selectedIds,
    onSelectionChange,
}: {
    allParticipants: Participant[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
}) {
    const [filter, setFilter] = useState("");
    const [page, setPage] = useState(0);

    // Reset to page 0 when filter changes
    useEffect(() => { setPage(0); }, [filter]);

    const filtered = allParticipants.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const currentPageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const toggle = (id: string) => {
        onSelectionChange(
            selectedIds.includes(id)
                ? selectedIds.filter(x => x !== id)
                : [...selectedIds, id]
        );
    };

    const allSelected = allParticipants.length > 0 &&
        allParticipants.every(p => selectedIds.includes(p.id));

    const toggleSelectAll = () => {
        onSelectionChange(allSelected ? [] : allParticipants.map(p => p.id));
    };

    // No participants at all
    if (allParticipants.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-8 text-center border-2 border-dashed border-white/8 rounded-xl">
                <Users size={24} className="text-gray-700" />
                <p className="text-xs text-gray-600">
                    Aún no hay nominados en este evento.
                </p>
                <p className="text-[11px] text-gray-700">
                    Añade participantes primero desde la sección de Nominados.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Search + Select All */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-3 h-3" />
                    <input
                        type="text"
                        placeholder="Filtrar nominados..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-black border-2 border-white/10 rounded-lg text-xs py-2 pl-8 pr-3 text-white focus:border-blue-500 outline-none transition-colors"
                        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    />
                </div>
                <button
                    type="button"
                    onClick={toggleSelectAll}
                    className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg border-2 shrink-0 transition-all cursor-pointer whitespace-nowrap ${
                        allSelected
                            ? "border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/15"
                            : "border-white/10 bg-white/3 text-gray-400 hover:border-white/20 hover:text-gray-200"
                    }`}
                >
                    {allSelected ? (
                        <>
                            <X size={10} />
                            Quitar todos
                        </>
                    ) : (
                        <>
                            <Check size={10} />
                            Selec. todos
                        </>
                    )}
                </button>
            </div>

            {/* Grid of participants */}
            <div className="grid grid-cols-2 gap-1.5 min-h-[9rem]">
                {currentPageItems.map(p => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => toggle(p.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer select-none transition-all text-left
                                ${isSelected
                                    ? "border-blue-500/50 bg-blue-500/10"
                                    : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
                                }`}
                        >
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                                ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-600"}`}
                            >
                                {isSelected && <Check size={9} className="text-white" />}
                            </div>
                            <span className={`text-xs truncate ${isSelected ? "text-white font-medium" : "text-gray-400"}`}>
                                {p.name}
                            </span>
                        </button>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="col-span-2 flex flex-col items-center gap-1.5 py-6 text-center">
                        <Search size={16} className="text-gray-700" />
                        <p className="text-xs text-gray-600">Sin resultados para «{filter}»</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-0.5">
                    <button
                        type="button"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border-2 border-white/10 text-gray-500 hover:text-gray-200 hover:border-white/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        <ChevronLeft size={11} /> Anterior
                    </button>
                    <span className="text-[10px] text-gray-600 font-mono">
                        Página {page + 1} de {totalPages}
                        <span className="text-gray-700 ml-1">· {filtered.length} resultados</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page === totalPages - 1}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border-2 border-white/10 text-gray-500 hover:text-gray-200 hover:border-white/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        Siguiente <ChevronRight size={11} />
                    </button>
                </div>
            )}

            {/* Validation message */}
            <AnimatePresence>
                {selectedIds.length < MIN_NOMINEES && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-[11px] font-medium ${
                            selectedIds.length === 0
                                ? "border-white/8 bg-white/3 text-gray-500"
                                : "border-amber-500/30 bg-amber-500/8 text-amber-400"
                        }`}
                    >
                        <AlertCircle size={12} className="shrink-0" />
                        {selectedIds.length === 0
                            ? `Selecciona al menos ${MIN_NOMINEES} nominados para poder crear la categoría.`
                            : `Falta ${MIN_NOMINEES - selectedIds.length} nominado${MIN_NOMINEES - selectedIds.length > 1 ? "s" : ""} más para continuar.`
                        }
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden inputs for form submission */}
            {selectedIds.map(id => (
                <input key={id} type="hidden" name="participantIds" value={id} />
            ))}
        </div>
    );
}

// ─── CSV Import Modal (Categories) ───────────────────────────────────────────

type ParsedPollRow = {
    rowIndex: number;
    title: string;
    description: string;
    votingType: string;
    maxOptions: string;
    valid: boolean;
    validationError?: string;
};

const VALID_VOTING_TYPES = ["SINGLE", "MULTIPLE", "LIMITED_MULTIPLE"] as const;

function parseCSVLinePoll(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (line[i] === "," && !inQuotes) {
            fields.push(current.trim());
            current = "";
        } else {
            current += line[i];
        }
    }
    fields.push(current.trim());
    return fields;
}

function CsvImportPollsModal({
    eventId,
    onClose,
    limit,
    currentCount,
}: {
    eventId: string;
    onClose: (didCreate: boolean) => void;
    limit?: number;
    currentCount?: number;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsedRows, setParsedRows] = useState<ParsedPollRow[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [hasFile, setHasFile] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<BulkImportResult | null>(null);

    const validRows = parsedRows.filter(r => r.valid);
    const invalidRows = parsedRows.filter(r => !r.valid);

    // Control de límite del plan: cuántas categorías válidas caben realmente.
    const hasLimit = typeof limit === "number" && typeof currentCount === "number";
    const remaining = hasLimit ? Math.max(0, limit! - currentCount!) : Infinity;
    const willImport = Math.min(validRows.length, remaining);
    const overflow = validRows.length - willImport;

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setParseError(null);
        setResult(null);
        setParsedRows([]);

        if (!file.name.endsWith(".csv")) {
            setParseError("El archivo debe tener extensión .csv");
            return;
        }

        const text = await file.text();
        const lines = text.trim().split(/\r?\n/).filter(l => l.trim());

        if (lines.length < 2) {
            setParseError("El archivo está vacío o solo contiene la cabecera.");
            return;
        }

        const headers = parseCSVLinePoll(lines[0]).map(h => h.toLowerCase().replace(/\s/g, "_"));
        const titleIdx = headers.indexOf("titulo");
        const descIdx = headers.indexOf("descripcion");
        const typeIdx = headers.indexOf("tipo_votacion");
        const maxIdx = headers.indexOf("max_opciones");

        if (titleIdx === -1) {
            setParseError('No se encontró la columna "titulo". La cabecera debe ser: titulo,descripcion,tipo_votacion,max_opciones');
            return;
        }
        if (typeIdx === -1) {
            setParseError('No se encontró la columna "tipo_votacion". La cabecera debe ser: titulo,descripcion,tipo_votacion,max_opciones');
            return;
        }

        const parsed: ParsedPollRow[] = lines.slice(1).map((line, i) => {
            const cols = parseCSVLinePoll(line);
            const title = cols[titleIdx] ?? "";
            const description = descIdx !== -1 ? (cols[descIdx] ?? "") : "";
            const votingType = typeIdx !== -1 ? (cols[typeIdx] ?? "").toUpperCase() : "";
            const maxOptions = maxIdx !== -1 ? (cols[maxIdx] ?? "") : "";

            let valid = true;
            let validationError: string | undefined;

            if (!title.trim()) {
                valid = false; validationError = "El título es obligatorio";
            } else if (title.trim().length > 100) {
                valid = false; validationError = "El título supera los 100 caracteres";
            } else if (!VALID_VOTING_TYPES.includes(votingType as any)) {
                valid = false; validationError = `Tipo "${votingType || "(vacío)"}" inválido. Usa: SINGLE, MULTIPLE o LIMITED_MULTIPLE`;
            } else if (votingType === "LIMITED_MULTIPLE") {
                const maxNum = parseInt(maxOptions, 10);
                if (isNaN(maxNum) || maxNum < 2) {
                    valid = false; validationError = 'max_opciones debe ser un número ≥ 2 para LIMITED_MULTIPLE';
                }
            }

            return { rowIndex: i + 2, title, description, votingType, maxOptions, valid, validationError };
        });

        setHasFile(true);
        setParsedRows(parsed);
    }

    async function handleImport() {
        if (!willImport || importing) return;
        setImporting(true);
        // Solo enviamos las que caben en el límite del plan (el servidor también lo aplica).
        const rows = validRows.slice(0, willImport).map(r => ({
            title: r.title,
            description: r.description || undefined,
            votingType: r.votingType as "SINGLE" | "MULTIPLE" | "LIMITED_MULTIPLE",
            maxOptions: r.votingType === "LIMITED_MULTIPLE" ? parseInt(r.maxOptions, 10) : undefined,
        }));
        const res = await bulkCreatePolls(eventId, rows);
        setResult(res);
        setImporting(false);
    }

    const votingTypeLabel: Record<string, string> = {
        SINGLE: "Voto único",
        MULTIPLE: "Múltiple libre",
        LIMITED_MULTIPLE: "Limitado",
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !importing && onClose(!!result?.created)}
        >
            <motion.div
                initial={{ scale: 0.97, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.97, opacity: 0, y: 8 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="relative bg-zinc-950 border-2 border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white/8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-400">
                            <FileSpreadsheet size={15} />
                        </div>
                        <h2 className="text-base font-bold text-white">Importar Categorías (CSV)</h2>
                    </div>
                    <button onClick={() => !importing && onClose(!!result?.created)} className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {result ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border-2 border-white/8">
                                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-white">Importación completada</p>
                                    <p className="text-xs text-emerald-400 mt-0.5">{result.created} categoría{result.created !== 1 ? "s" : ""} creada{result.created !== 1 ? "s" : ""} correctamente</p>
                                </div>
                            </div>
                            {result.errors.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                                        <XCircle size={12} /> {result.errors.length} fila{result.errors.length !== 1 ? "s" : ""} no importada{result.errors.length !== 1 ? "s" : ""}:
                                    </p>
                                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                                        {result.errors.map((err, i) => (
                                            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-red-500/5 border border-red-500/15 rounded-lg text-xs">
                                                <span className="font-mono text-gray-500 shrink-0">F{err.row}</span>
                                                <span className="text-gray-300 truncate flex-1">{err.value || "—"}</span>
                                                <span className="text-red-400 shrink-0 text-right ml-2">{err.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button onClick={() => onClose(!!result.created)} className="w-full py-2.5 bg-white/8 hover:bg-white/12 border-2 border-white/10 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer">
                                Cerrar
                            </button>
                        </div>
                    ) : !hasFile ? (
                        <div className="space-y-5">
                            <div className="p-4 bg-white/3 border-2 border-white/8 rounded-xl space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Formato esperado</p>
                                <pre className="text-xs text-amber-300/80 font-mono bg-black/40 rounded-lg px-3 py-2 overflow-x-auto">{`titulo,descripcion,tipo_votacion,max_opciones\n"Mejor Streamer","El más destacado","SINGLE",""\n"Top 3 Clips","Los mejores momentos","LIMITED_MULTIPLE","3"`}</pre>
                                <ul className="text-[11px] text-gray-500 space-y-1 mt-2">
                                    <li>• <strong className="text-gray-400">titulo</strong>: obligatorio, máx. 100 caracteres</li>
                                    <li>• <strong className="text-gray-400">descripcion</strong>: opcional</li>
                                    <li>• <strong className="text-gray-400">tipo_votacion</strong>: <span className="font-mono text-amber-300/70">SINGLE</span>, <span className="font-mono text-amber-300/70">MULTIPLE</span> o <span className="font-mono text-amber-300/70">LIMITED_MULTIPLE</span></li>
                                    <li>• <strong className="text-gray-400">max_opciones</strong>: número ≥ 2, solo si tipo es LIMITED_MULTIPLE</li>
                                </ul>
                            </div>
                            <a href="/csv/ejemplo_categorias.csv" download className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-2 border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-fit cursor-pointer">
                                <Download size={13} /> Descargar CSV de ejemplo
                            </a>
                            {parseError && (
                                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/8 border-2 border-red-500/20 rounded-xl text-xs text-red-400">
                                    <AlertCircle size={13} className="shrink-0 mt-0.5" /><span>{parseError}</span>
                                </div>
                            )}
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center gap-3 text-gray-500 hover:border-amber-500/30 hover:text-amber-400 transition-colors cursor-pointer group">
                                <Upload size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-semibold">Seleccionar archivo .csv</span>
                                <span className="text-xs">Haz clic o arrastra el archivo aquí</span>
                            </button>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-400">{willImport} se importarán</p>
                                        <p className="text-[10px] text-gray-500">{validRows.length} válida{validRows.length !== 1 ? "s" : ""} en el archivo</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 p-3 border rounded-xl ${invalidRows.length > 0 ? "bg-red-500/5 border-red-500/15" : "bg-white/3 border-white/8"}`}>
                                    <XCircle size={16} className={invalidRows.length > 0 ? "text-red-400 shrink-0" : "text-gray-600 shrink-0"} />
                                    <div>
                                        <p className={`text-xs font-bold ${invalidRows.length > 0 ? "text-red-400" : "text-gray-500"}`}>{invalidRows.length} con errores</p>
                                        <p className="text-[10px] text-gray-500">no se importarán</p>
                                    </div>
                                </div>
                            </div>

                            {/* Aviso de límite del plan */}
                            {hasLimit && (remaining === 0 || overflow > 0) && (
                                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/8 border-2 border-amber-500/20 rounded-xl text-xs text-amber-300">
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                    <span>
                                        {remaining === 0 ? (
                                            <>Has alcanzado el límite de <strong>{limit} categorías</strong> de tu plan ({currentCount} ya creadas). No se importará ninguna fila.</>
                                        ) : (
                                            <>Tu plan permite <strong>{limit} categorías</strong> y ya tienes <strong>{currentCount}</strong>. Solo se importarán <strong>{willImport}</strong>; las otras <strong>{overflow}</strong> superan el límite.</>
                                        )}
                                    </span>
                                </div>
                            )}

                            {invalidRows.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Errores de validación</p>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                        {invalidRows.map((r, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg text-xs">
                                                <span className="font-mono text-gray-600 shrink-0">F{r.rowIndex}</span>
                                                <span className="text-gray-400 truncate flex-1">{r.title || "—"}</span>
                                                <span className="text-red-400 shrink-0">{r.validationError}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {validRows.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Previsualización {validRows.length > 5 ? "(primeras 5)" : ""}
                                    </p>
                                    <div className="border-2 border-white/8 rounded-xl overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-white/5 text-gray-500 uppercase text-[10px]">
                                                    <th className="px-3 py-2 text-left font-semibold">Título</th>
                                                    <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                                                    <th className="px-3 py-2 text-left font-semibold">Máx.</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {validRows.slice(0, 5).map((r, i) => (
                                                    <tr key={i} className="text-gray-300">
                                                        <td className="px-3 py-2 font-medium truncate max-w-[160px]">{r.title}</td>
                                                        <td className="px-3 py-2 text-gray-500">{votingTypeLabel[r.votingType] ?? r.votingType}</td>
                                                        <td className="px-3 py-2 text-gray-600 font-mono">{r.votingType === "LIMITED_MULTIPLE" ? r.maxOptions : "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => { setHasFile(false); setParsedRows([]); setParseError(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                    disabled={importing}
                                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border-2 border-white/10 rounded-xl text-sm font-semibold text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Cambiar archivo
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!willImport || importing}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
                                >
                                    {importing
                                        ? <><RefreshCw size={14} className="animate-spin" /> Importando...</>
                                        : <><FileSpreadsheet size={14} /> Importar {willImport} categoría{willImport !== 1 ? "s" : ""}</>
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
