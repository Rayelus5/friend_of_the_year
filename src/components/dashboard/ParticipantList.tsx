"use client";

import { useState, useRef, useEffect } from "react";
import { updateEventParticipant, createEventParticipant, reorderParticipants, deleteManyParticipants } from "@/app/lib/event-actions";
import { useToast } from "@/components/ui/ToastProvider";
import { bulkCreateParticipants } from "@/app/lib/csv-actions";
import CsvManagerModal, { type CsvManagerConfig, type ParsedRow } from "@/components/dashboard/CsvManagerModal";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";
import {
    DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
    DragOverlay, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Pencil, Trash2, Save, X, Plus, Search, Upload, Wand2,
    Lock, Star, Crown, ChevronLeft, ChevronRight, Sparkles,
    RefreshCw, User, Link2, AlertCircle, FileSpreadsheet,
    Download, CheckCircle2, XCircle, GripVertical, Check, AlertTriangle, CheckCheck,
    ClipboardPaste, ArrowDownUp
} from "lucide-react";
import { useFormStatus } from 'react-dom';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import { Quantum } from 'ldrs/react';
import { Bouncy } from 'ldrs/react';
import 'ldrs/react/Bouncy.css';
import 'ldrs/react/Quantum.css';
import { motion, AnimatePresence } from "framer-motion";

// ─── AI Image Generation Cooldown (global, shared across all form instances) ──
const AI_COOLDOWN_SECONDS = 30;
let lastAiGenerationTime = 0;

// ─── Types ────────────────────────────────────────────────────────────────────

type Participant = {
    id: string;
    name: string;
    imageUrl: string | null;
};

type InputMode = "manual" | "ai" | "search";

type SearchImage = { url: string; thumbnail: string; source: "pexels" | "wikimedia"; credit?: string };

// ─── Submit buttons ───────────────────────────────────────────────────────────

function SaveButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="h-10 px-5 bg-white/10 hover:bg-white/15 border-2 border-white/15 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
            {pending ? <Bouncy size="16" speed="1.75" color="white" /> : <><Save size={14} /> Guardar</>}
        </button>
    );
}

function CreateButton({ mode }: { mode: InputMode }) {
    const { pending } = useFormStatus();
    const isAi = mode === "ai";
    return (
        <button
            type="submit"
            disabled={pending}
            className={`h-10 px-6 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50
                ${isAi
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/40"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
        >
            {pending
                ? <Bouncy size="16" speed="1.75" color={isAi ? "white" : "black"} />
                : <>{isAi ? <Sparkles size={14} /> : <Plus size={14} />} Crear nominado</>
            }
        </button>
    );
}

// ─── Mode switcher ────────────────────────────────────────────────────────────

function ModeSwitcher({ mode, onChange, canUseAi }: { mode: InputMode; onChange: (m: InputMode) => void; canUseAi: boolean }) {
    return (
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border-2 border-white/8 w-fit flex-wrap">
            <button
                type="button"
                onClick={() => onChange("manual")}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                    ${mode === "manual" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
                {mode === "manual" && (
                    <motion.div
                        layoutId="mode-pill"
                        className="absolute inset-0 bg-white/10 border-2 border-white/15 rounded-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <Upload size={12} className="relative z-10" />
                <span className="relative z-10">Manual</span>
            </button>

            <button
                type="button"
                onClick={() => onChange("search")}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                    ${mode === "search" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
                {mode === "search" && (
                    <motion.div
                        layoutId="mode-pill"
                        className="absolute inset-0 bg-emerald-600/20 border-2 border-emerald-500/40 rounded-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <Search size={12} className={`relative z-10 ${mode === "search" ? "text-emerald-300" : ""}`} />
                <span className={`relative z-10 ${mode === "search" ? "text-emerald-200" : ""}`}>Buscar</span>
            </button>

            <button
                type="button"
                onClick={() => canUseAi && onChange("ai")}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${!canUseAi ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                    ${mode === "ai" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
                {mode === "ai" && (
                    <motion.div
                        layoutId="mode-pill"
                        className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-purple-600/30 border-2 border-violet-500/40 rounded-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <Sparkles size={12} className={`relative z-10 ${mode === "ai" ? "text-violet-300" : ""}`} />
                <span className={`relative z-10 ${mode === "ai" ? "text-violet-200" : ""}`}>
                    <span className="hidden sm:inline">Generar con </span>IA
                </span>
                {!canUseAi && <Lock size={10} className="relative z-10 ml-0.5" />}
            </button>
        </div>
    );
}

// ─── Panel de búsqueda de imágenes en internet (Pexels + Wikimedia) ─────────────

function SearchImagesPanel({ eventId, initialQuery, onPick, compact }: {
    eventId: string;
    initialQuery: string;
    onPick: (url: string) => void;
    compact?: boolean;
}) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchImage[]>([]);
    const [visible, setVisible] = useState(5);
    const [loading, setLoading] = useState(false);
    const [picking, setPicking] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const doSearch = async () => {
        if (!query.trim() || loading) return;
        setLoading(true); setError(null); setVisible(5); setSearched(true);
        try {
            const res = await fetch(`/api/search-images?q=${encodeURIComponent(query.trim())}`);
            const data = await res.json();
            if (!res.ok) { setError(data.error || "No se pudo buscar."); setResults([]); }
            else {
                setResults(data.images ?? []);
                if ((data.images ?? []).length === 0) setError("Sin resultados. Prueba con otro término.");
            }
        } catch {
            setError("Error de red al buscar.");
        } finally {
            setLoading(false);
        }
    };

    const pick = async (img: SearchImage) => {
        if (picking) return;
        setPicking(img.url); setError(null);
        try {
            const res = await fetch("/api/participant-image/rehost", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: img.url, eventId }),
            });
            const data = await res.json();
            if (res.ok && data.url) onPick(data.url);
            else setError(data.error || "No se pudo guardar la imagen.");
        } catch {
            setError("Error al guardar la imagen.");
        } finally {
            setPicking(null);
        }
    };

    const shown = results.slice(0, visible);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } }}
                        placeholder="Busca una imagen (ej: el nombre del nominado)…"
                        className="w-full bg-black border-2 border-emerald-500/25 rounded-lg px-3 py-2 pl-9 text-white text-sm focus:border-emerald-500 outline-none placeholder-gray-600"
                    />
                </div>
                <button
                    type="button"
                    onClick={doSearch}
                    disabled={loading || !query.trim()}
                    className="px-3 py-2 bg-emerald-600/20 text-emerald-300 border-2 border-emerald-500/30 rounded-lg hover:bg-emerald-600/40 transition-colors disabled:opacity-40 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                    {loading ? <Bouncy size="14" speed="1.75" color="#6ee7b7" /> : <Search size={13} />} Buscar
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border-2 border-red-500/25 text-red-400 text-xs">
                    <AlertCircle size={12} className="shrink-0" /><span>{error}</span>
                </div>
            )}

            {shown.length > 0 && (
                <>
                    <div className={`grid ${compact ? "grid-cols-5" : "grid-cols-5"} gap-2`}>
                        {shown.map((img) => (
                            <button
                                key={img.url}
                                type="button"
                                onClick={() => pick(img)}
                                disabled={!!picking}
                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/10 hover:border-emerald-500/60 transition-colors cursor-pointer disabled:opacity-50 group"
                                title={img.credit ? `Foto de ${img.credit} (${img.source})` : img.source}
                            >
                                <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                                {picking === img.url && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Bouncy size="20" speed="1.75" color="#fff" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    {visible < results.length && visible < 20 && (
                        <button
                            type="button"
                            onClick={() => setVisible((v) => Math.min(v + 5, 20, results.length))}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer mt-0.5"
                        >
                            Mostrar más ({Math.min(5, results.length - visible)})
                        </button>
                    )}
                    <p className="text-[10px] text-gray-600">Imágenes de Pexels y Wikimedia. Al elegir una, se guarda en tu almacenamiento.</p>
                </>
            )}
            {searched && !loading && results.length === 0 && !error && (
                <p className="text-xs text-gray-600 py-2">Sin resultados.</p>
            )}
        </div>
    );
}

// ─── Image preview ────────────────────────────────────────────────────────────

function ImagePreview({
    image,
    isGenerating,
    mode,
    onUploadClick,
    onRegenerate,
    isEditMode,
}: {
    image: string;
    isGenerating: boolean;
    mode: InputMode;
    onUploadClick: () => void;
    onRegenerate?: () => void;
    isEditMode: boolean;
}) {
    const size = isEditMode ? "w-14 h-14" : "w-16 h-16 sm:w-20 sm:h-20";
    const isAi = mode === "ai";
    const isManual = mode === "manual";

    return (
        <div className="relative shrink-0 group" onClick={isManual && !isGenerating ? onUploadClick : undefined}>
            {/* Glow ring for AI mode */}
            {isAi && !isEditMode && (
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 opacity-40 blur-sm animate-pulse pointer-events-none" />
            )}

            <div className={`relative ${size} rounded-full overflow-hidden border-2 flex items-center justify-center transition-all
                ${isAi
                    ? "border-violet-500/50 bg-violet-950/50"
                    : isManual
                        ? "border-blue-500/30 bg-gray-900 cursor-pointer hover:border-blue-500"
                        : "border-emerald-500/40 bg-gray-900"
                }`}
            >
                {isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden">
                        {/* Gradient blobs */}
                        <div className="absolute w-3/4 h-3/4 rounded-full bg-violet-600/50 blur-md animate-[ping_2s_ease-in-out_infinite] pointer-events-none" />
                        <div className="absolute w-1/2 h-1/2 rounded-full bg-fuchsia-500/40 blur-sm animate-[pulse_1.5s_ease-in-out_infinite_0.5s] pointer-events-none" />
                        {/* Quantum loader on top */}
                        <div className="relative z-10">
                            <Quantum size={isEditMode ? "30" : "50"} speed="1.75" color="#e3daffff" />
                        </div>
                    </div>
                ) : image ? (
                    <>
                        <img src={image} className="w-full h-full object-cover" alt="Preview" />
                        {/* Overlay actions */}
                        {isAi && onRegenerate ? (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <RefreshCw size={isEditMode ? 12 : 16} className="text-violet-300" />
                            </button>
                        ) : isManual ? (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={isEditMode ? 12 : 16} className="text-white" />
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        {isAi
                            ? <Sparkles size={isEditMode ? 14 : 22} className="text-violet-400" />
                            : isManual
                                ? <Upload size={isEditMode ? 14 : 22} className="text-blue-400" />
                                : <Search size={isEditMode ? 14 : 22} className="text-emerald-400" />
                        }
                    </div>
                )}
            </div>

            {/* Small badge */}
            {isAi && image && !isGenerating && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center border-2 border-black">
                    <Sparkles size={9} className="text-white" />
                </div>
            )}
        </div>
    );
}

// ─── Participant Form ─────────────────────────────────────────────────────────

function ParticipantForm({
    initialName = "",
    initialImage = "",
    onSubmit,
    onCancel,
    isEditMode = false,
    planSlug,
    eventId,
}: {
    initialName?: string;
    initialImage?: string;
    onSubmit: (formData: FormData) => Promise<void>;
    onCancel: () => void;
    isEditMode?: boolean;
    planSlug: string;
    eventId: string;
}) {
    const canUseAi = planSlug !== "free";
    const [mode, setMode] = useState<InputMode>("manual");
    const [name, setName] = useState(initialName);
    const [image, setImage] = useState(initialImage);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        // Auto-suggest prompt when name changes in AI mode
        if (mode === "ai" && !aiPrompt && val) {
            setAiPrompt(`Retrato ultra-realista de un ${val}, fondo neutro oscuro, iluminación dramática profesional, alta resolución, estilo fotográfico.`);
        }
    };

    const handleModeChange = (m: InputMode) => {
        setMode(m);
        if (m === "ai" && name && !aiPrompt) {
            setAiPrompt(`Retrato ultra-realista de un ${name}, fondo neutro oscuro, iluminación dramática profesional, alta resolución, estilo fotográfico.`);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) {
            alert("La imagen es demasiado grande (Max 4MB)");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const startCooldown = () => {
        const elapsed = Math.floor((Date.now() - lastAiGenerationTime) / 1000);
        const remaining = Math.max(0, AI_COOLDOWN_SECONDS - elapsed);
        if (remaining <= 0) return;
        setCooldownRemaining(remaining);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldownRemaining((prev) => {
                if (prev <= 1) {
                    if (cooldownRef.current) clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const generateAIImage = async () => {
        if (!name && !aiPrompt) return;
        const elapsed = Date.now() - lastAiGenerationTime;
        if (elapsed < AI_COOLDOWN_SECONDS * 1000) {
            startCooldown();
            return;
        }
        setIsGenerating(true);
        setAiError(false);
        try {
            const seed = Math.floor(Math.random() * 10000);
            const prompt = aiPrompt || `Ultra-realistic photographic depiction of ${name}. Professional lighting, high-detail textures, sharp focus, natural colors, minimalistic background.`;

            const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, seed }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { imageUrl } = await res.json();
            setImage(imageUrl);
            lastAiGenerationTime = Date.now();
            startCooldown();
        } catch (error) {
            console.error("Error generando imagen:", error);
            setAiError(true);
            setTimeout(() => setAiError(false), 5000);
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Edit mode layout: siempre dos columnas (avatar | campos+botones) ──
    if (isEditMode) {
        return (
            <form
                action={async (fd) => { fd.set("imageUrl", image); await onSubmit(fd); }}
                className="flex items-start gap-3 w-full"
            >
                {/* Columna izquierda: avatar */}
                <div className="shrink-0">
                    <ImagePreview
                        image={image}
                        isGenerating={isGenerating}
                        mode={mode}
                        onUploadClick={() => fileInputRef.current?.click()}
                        onRegenerate={generateAIImage}
                        isEditMode
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                </div>

                {/* Columna derecha: todo el contenido */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <input
                        name="name"
                        value={name}
                        onChange={handleNameChange}
                        maxLength={80}
                        className="w-full bg-black border-2 border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                        placeholder="Nombre..."
                        required
                    />

                    <ModeSwitcher mode={mode} onChange={handleModeChange} canUseAi={canUseAi} />

                    <AnimatePresence mode="wait">
                        {mode === "manual" ? (
                            <motion.div key="manual-edit"
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-3 h-3" />
                                        <input
                                            name="imageUrl"
                                            value={image}
                                            onChange={(e) => setImage(e.target.value)}
                                            className="w-full bg-black border-2 border-white/10 rounded-lg px-3 py-2 pl-8 text-white text-sm focus:border-blue-500 outline-none text-gray-400"
                                            placeholder="URL de imagen..."
                                        />
                                    </div>
                                    <PasteUrlButton onPaste={setImage} />
                                </div>
                            </motion.div>
                        ) : mode === "search" ? (
                            <motion.div key="search-edit"
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                <SearchImagesPanel eventId={eventId} initialQuery={name} onPick={setImage} compact />
                            </motion.div>
                        ) : (
                            <motion.div key="ai-edit"
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="flex gap-2"
                            >
                                <input
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    className="flex-1 min-w-0 bg-violet-950/30 border-2 border-violet-500/30 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 outline-none placeholder-violet-400/40"
                                    placeholder="Describe la imagen..."
                                />
                                <button
                                    type="button"
                                    onClick={generateAIImage}
                                    disabled={isGenerating || cooldownRemaining > 0 || (!name && !aiPrompt)}
                                    className="px-3 py-2 bg-violet-600/20 text-violet-300 border-2 border-violet-500/30 rounded-lg hover:bg-violet-600/40 transition-colors disabled:opacity-40 flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
                                >
                                    {cooldownRemaining > 0 ? (
                                        <span>{cooldownRemaining}s</span>
                                    ) : (
                                        <>
                                            <Wand2 size={12} />
                                            <span className="hidden xs:inline">Generar</span>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {aiError && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border-2 border-red-500/30 text-red-400 text-xs">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>Generación no disponible. Inténtalo más tarde.</span>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <SaveButton />
                        <button type="button" onClick={onCancel}
                            className="h-10 px-3 flex items-center justify-center bg-white/5 border-2 border-white/10 text-gray-400 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </form>
        );
    }

    // ── Create mode layout (full card) ──
    const isAi = mode === "ai";

    return (
        <form
            action={async (fd) => { fd.set("imageUrl", image); await onSubmit(fd); }}
            className="flex flex-col gap-5"
        >
            {/* Mode switcher */}
            <div className="flex flex-wrap items-center gap-3">
                <ModeSwitcher mode={mode} onChange={handleModeChange} canUseAi={canUseAi} />
                {!canUseAi && (
                    <Link href="/premium" className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors shrink-0">
                        <Sparkles size={10} /> Desbloquear IA
                    </Link>
                )}
            </div>

            {/* Main content */}
            <div className="flex gap-4 items-start">
                {/* Image preview column */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <ImagePreview
                        image={image}
                        isGenerating={isGenerating}
                        mode={mode}
                        onUploadClick={() => fileInputRef.current?.click()}
                        onRegenerate={generateAIImage}
                        isEditMode={false}
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

                    {mode === "manual" && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                        >
                            Subir foto
                        </button>
                    )}
                    {isAi && image && !isGenerating && (
                        <button
                            type="button"
                            onClick={generateAIImage}
                            disabled={cooldownRemaining > 0}
                            className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={9} />
                            {cooldownRemaining > 0 ? `${cooldownRemaining}s` : "Regenerar"}
                        </button>
                    )}
                </div>

                {/* Fields column */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    {/* Name */}
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
                        <input
                            name="name"
                            value={name}
                            onChange={handleNameChange}
                            autoFocus
                            maxLength={80}
                            className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 pl-9 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600 transition-colors"
                            placeholder="Nombre del nominado..."
                            required
                        />
                    </div>

                    {/* Mode-specific inputs */}
                    <AnimatePresence mode="wait">
                        {mode === "manual" ? (
                            <motion.div
                                key="manual-create"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
                                        <input
                                            name="imageUrl"
                                            value={image}
                                            onChange={(e) => setImage(e.target.value)}
                                            className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 pl-9 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600 transition-colors"
                                            placeholder="URL de imagen (opcional)..."
                                        />
                                    </div>
                                    <PasteUrlButton onPaste={setImage} />
                                </div>
                            </motion.div>
                        ) : mode === "search" ? (
                            <motion.div
                                key="search-create"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-2"
                            >
                                <SearchImagesPanel eventId={eventId} initialQuery={name} onPick={setImage} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ai-create"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-2"
                            >
                                {/* Prompt label */}
                                <div className="flex items-center gap-2">
                                    <Wand2 size={11} className="text-violet-400" />
                                    <span className="text-[11px] text-violet-300/80 font-medium">Prompt de imagen</span>
                                    <span className="text-[10px] text-gray-600">(Edita o usa la sugerencia automática)</span>
                                </div>

                                {/* Prompt textarea */}
                                <div className="relative">
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        rows={3}
                                        className="w-full bg-violet-950/20 border-2 border-violet-500/25 rounded-xl px-3 py-2.5 text-white text-sm focus:border-violet-500/60 outline-none placeholder-violet-400/30 transition-colors resize-none leading-relaxed"
                                        placeholder={`Ej: Retrato ultra-realista de un ${name || "la persona"}, fondo oscuro, iluminación dramática...`}
                                    />
                                </div>

                                {/* Generate button */}
                                <button
                                    type="button"
                                    onClick={generateAIImage}
                                    disabled={isGenerating || cooldownRemaining > 0 || (!name && !aiPrompt)}
                                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40
                                        bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/30"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Quantum size="20" speed="1.75" color="white" />
                                            <span>Generando imagen...</span>
                                        </>
                                    ) : cooldownRemaining > 0 ? (
                                        <>
                                            <RefreshCw size={14} />
                                            <span>Espera {cooldownRemaining}s para generar otra</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={14} />
                                            <span>{image ? "Regenerar imagen" : "Generar imagen con IA"}</span>
                                        </>
                                    )}
                                </button>

                                {aiError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border-2 border-red-500/25 text-red-400 text-xs"
                                    >
                                        <AlertCircle size={12} className="shrink-0" />
                                        <span>Generación no disponible ahora mismo. Inténtalo más tarde.</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between border-t-2 border-white/5 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                    Cancelar
                </button>
                <CreateButton mode={mode} />
            </div>
        </form>
    );
}

// ─── Sortable card (grid drag & drop con @dnd-kit) ────────────────────────────

// Botón "PEGAR": lee el portapapeles y rellena el input de URL de imagen.
function PasteUrlButton({ onPaste }: { onPaste: (text: string) => void }) {
    const toast = useToast();
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                onPaste(text.trim());
            } else {
                toast.info("El portapapeles está vacío.");
            }
        } catch {
            toast.error("No se pudo leer el portapapeles. Pega la URL manualmente.");
        }
    };
    return (
        <button
            type="button"
            onClick={handlePaste}
            title="Pegar desde el portapapeles"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-white/10 bg-white/5 text-gray-300 text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
            <ClipboardPaste size={14} /> PEGAR
        </button>
    );
}

// Tarjeta compacta usada en el modo "Ordenar" (vista global en grid).
function CompactSortableCard({ p }: { p: Participant }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group relative bg-neutral-900/60 border-2 border-white/8 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing touch-none hover:border-blue-500/50"
        >
            <div className="relative w-full aspect-square bg-neutral-800">
                {p.imageUrl ? (
                    <ImageWithSkeleton src={p.imageUrl} alt={p.name} className="w-full h-full object-cover pointer-events-none" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-lg">
                        {p.name.substring(0, 2).toUpperCase()}
                    </div>
                )}
                <div className="absolute top-1 right-1 p-1 rounded bg-black/50 text-gray-300">
                    <GripVertical size={12} />
                </div>
            </div>
            <p className="px-1.5 py-1 text-[11px] text-gray-200 truncate text-center">{p.name}</p>
        </div>
    );
}

function SortableCard({
    p, isSelected, canManage, square, dragEnabled, onToggleSelect, onEdit, onDelete,
}: {
    p: Participant;
    isSelected: boolean;
    canManage: boolean;
    square: boolean;
    dragEnabled: boolean;
    onToggleSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id, disabled: !dragEnabled });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-neutral-900/60 border-2 rounded-2xl overflow-hidden ${isSelected ? "border-blue-500/70" : "border-white/8 hover:border-white/20"}`}
        >
            <div className={`relative w-full ${square ? "aspect-square" : "aspect-[4/3]"} bg-neutral-800`}>
                {p.imageUrl ? (
                    <ImageWithSkeleton src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-2xl">
                        {p.name.substring(0, 2).toUpperCase()}
                    </div>
                )}
                {canManage && (
                    <button
                        type="button"
                        onClick={onToggleSelect}
                        aria-label="Seleccionar nominado"
                        className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${isSelected ? "bg-blue-600 border-blue-500 text-white" : "bg-black/50 border-white/40 text-transparent hover:border-white"}`}
                    >
                        <Check size={14} />
                    </button>
                )}
                {dragEnabled && (
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        aria-label="Arrastrar para reordenar"
                        title="Arrastrar para reordenar"
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 text-gray-300 hover:text-white cursor-grab active:cursor-grabbing touch-none"
                    >
                        <GripVertical size={16} />
                    </button>
                )}
            </div>
            <div className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-100 truncate">{p.name}</p>
                    <p className="text-[11px] mt-0.5">
                        {p.imageUrl ? <span className="text-emerald-500/80">Con imagen</span> : <span className="text-gray-600">Sin imagen</span>}
                    </p>
                </div>
                {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={onEdit} className="h-9 w-9 flex items-center justify-center text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all cursor-pointer" title="Editar">
                            <Pencil size={16} />
                        </button>
                        <button onClick={onDelete} className="h-9 w-9 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer" title="Eliminar">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Tarjeta que sigue al cursor mientras se arrastra (DragOverlay).
function OverlayCard({ p, square }: { p: Participant; square: boolean }) {
    return (
        <div className="bg-neutral-900 border-2 border-blue-500 rounded-2xl overflow-hidden shadow-2xl cursor-grabbing">
            <div className={`relative w-full ${square ? "aspect-square" : "aspect-[4/3]"} bg-neutral-800`}>
                {p.imageUrl ? (
                    <ImageWithSkeleton src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-2xl">
                        {p.name.substring(0, 2).toUpperCase()}
                    </div>
                )}
            </div>
            <div className="p-3"><p className="font-semibold text-gray-100 truncate">{p.name}</p></div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParticipantList({
    initialData,
    eventId,
    planSlug,
    canManageNominees = true,
    square = false,
    limitOverride,
}: {
    initialData: Participant[];
    eventId: string;
    planSlug: string;
    canManageNominees?: boolean;
    /** Render cuadrado de los avatares (modo TIERLIST). */
    square?: boolean;
    /** Sobrescribe el límite de items (p.ej. tierlistMaxOptions en TIERLIST). */
    limitOverride?: number;
}) {
    const router = useRouter();
    const toast = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [formResetKey, setFormResetKey] = useState(0); // remonta el form para crear varios seguidos
    const [editIndex, setEditIndex] = useState<number | null>(null); // índice dentro de filteredData
    const [searchQuery, setSearchQuery] = useState("");
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    // Motivo del aviso de mejora: límite de nominados alcanzado o función CSV bloqueada.
    const [upgradeReason, setUpgradeReason] = useState<"limit" | "csv">("limit");
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [isOrdering, setIsOrdering] = useState(false); // modo "Ordenar" (vista global)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // nominados por página (2 columnas × 4)

    // Copia local para reordenar en cliente (drag) sincronizada con el servidor.
    const [items, setItems] = useState<Participant[]>(initialData);
    useEffect(() => { setItems(initialData); }, [initialData]);

    // Selección para borrado masivo (persiste entre páginas).
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [pendingDelete, setPendingDelete] = useState<string[]>([]); // ids a confirmar borrado
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const currentLimit = limitOverride ?? (PLANS[planKey]?.limits?.participantsPerEvent || 12);
    const canImportCsv = planSlug === "enterprise" || planSlug === "unlimited";
    const currentCount = initialData.length;
    const isAtLimit = currentCount >= currentLimit;

    const csvConfig: CsvManagerConfig = {
        title: "Nominados",
        headers: ["nombre", "imagen_url"],
        requiredHeaders: ["nombre"],
        example: 'nombre,imagen_url\n"Rayelus",""\n"Chaotic Loom","https://..."',
        hints: [
            { col: "nombre", desc: "obligatorio, máx. 80 caracteres" },
            { col: "imagen_url", desc: "opcional, URL de imagen" },
        ],
        sampleHref: "/csv/ejemplo_nominados.csv",
        parseRow: (row, rowIndex): ParsedRow => {
            const name = (row.nombre ?? "").trim();
            if (!name) return { ok: false, rowIndex, value: "", error: "Nombre obligatorio" };
            if (name.length > 80) return { ok: false, rowIndex, value: name, error: "Supera 80 caracteres" };
            return { ok: true, rowIndex, value: name, data: { name, imageUrl: (row.imagen_url ?? "").trim() || undefined } };
        },
        onImport: (rows) => bulkCreateParticipants(eventId, rows as { name: string; imageUrl?: string }[]),
        exportHeaders: ["nombre", "imagen_url"],
        exportData: initialData.map((p) => [p.name, p.imageUrl ?? ""]),
        exportFilename: `nominados-${eventId}.csv`,
        limit: currentLimit,
        currentCount,
        unitLabel: "nominados",
    };

    const handleCreateClick = () => {
        if (isAtLimit) { setUpgradeReason("limit"); setShowUpgradeModal(true); }
        else setIsCreating(true);
    };

    const handleCsvClick = () => {
        if (canImportCsv) setShowCsvModal(true);
        else { setUpgradeReason("csv"); setShowUpgradeModal(true); }
    };

    const isSearching = searchQuery.trim() !== "";
    const filteredData = items.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const pageStart = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(pageStart, pageStart + itemsPerPage);
    // Arrastrar solo cuando no hay filtro de búsqueda (el slice de página mapea 1:1 con `items`).
    const dragEnabled = canManageNominees && !isSearching;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    // ── Selección masiva ──
    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const selectAllFiltered = () => setSelected(new Set(filteredData.map(p => p.id)));
    const clearSelection = () => setSelected(new Set());

    const handleBulkDelete = async () => {
        if (!pendingDelete.length) return;
        setIsDeleting(true);
        const res = await deleteManyParticipants(pendingDelete, eventId);
        setIsDeleting(false);
        setShowDeleteModal(false);
        if (res && "deleted" in res) {
            toast.success(`${res.deleted} nominado(s) eliminado(s)`);
            setSelected(prev => {
                const next = new Set(prev);
                pendingDelete.forEach(id => next.delete(id));
                return next;
            });
            setPendingDelete([]);
            router.refresh();
        } else {
            toast.error(res?.error || "No se pudieron eliminar los nominados.");
        }
    };

    // ── Drag & drop dentro de la página (grid, con @dnd-kit) ──
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const activeParticipant = activeId ? items.find(p => p.id === activeId) ?? null : null;

    const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

    const onDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const ids = paginatedData.map(p => p.id);
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const newPageOrder = arrayMove(paginatedData, oldIndex, newIndex);
        const next = [...items];
        for (let i = 0; i < newPageOrder.length; i++) next[pageStart + i] = newPageOrder[i];
        setItems(next);

        const payload = newPageOrder.map((p, i) => ({ id: p.id, order: pageStart + i }));
        const res = await reorderParticipants(payload, eventId);
        if (res?.error) {
            toast.error("No se pudo reordenar.");
            setItems(initialData); // revertir
        } else {
            router.refresh();
        }
    };

    // ── Drag & drop sobre la lista COMPLETA (modo "Ordenar") ──
    const onDragEndAll = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex(p => p.id === String(active.id));
        const newIndex = items.findIndex(p => p.id === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const next = arrayMove(items, oldIndex, newIndex);
        setItems(next);

        const payload = next.map((p, i) => ({ id: p.id, order: i }));
        const res = await reorderParticipants(payload, eventId);
        if (res?.error) {
            toast.error("No se pudo reordenar.");
            setItems(initialData); // revertir
        } else {
            router.refresh();
        }
    };

    // ── Edición con paginador ──
    const editing = editIndex !== null ? filteredData[editIndex] : null;
    const gotoEdit = (dir: -1 | 1) => {
        setEditIndex(idx => {
            if (idx === null) return idx;
            const n = idx + dir;
            return n >= 0 && n < filteredData.length ? n : idx;
        });
    };

    return (
        <div className="space-y-4 tour-participants-section">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Lista de Nominados
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
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar nominados..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full bg-neutral-900 border-2 border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    {canManageNominees && items.length > 1 && (
                        <button
                            onClick={() => setIsOrdering(o => !o)}
                            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer border-2 ${isOrdering ? "bg-blue-600 text-white border-blue-500" : "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"}`}
                        >
                            {isOrdering ? <><X size={14} /> Salir</> : <><ArrowDownUp size={14} /> Ordenar</>}
                        </button>
                    )}
                    {canManageNominees && (
                        <button
                            onClick={handleCsvClick}
                            className="bg-amber-500/10 text-amber-400 border-2 border-amber-500/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-amber-500/20 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <FileSpreadsheet size={14} /> CSV {!canImportCsv && <Lock size={11} />}
                        </button>
                    )}
                    {canManageNominees && (
                        <button
                            onClick={handleCreateClick}
                            className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Plus size={14} /> Nuevo
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
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                <Lock className="text-amber-500" /> {upgradeReason === "csv" ? "Función CSV bloqueada" : "Límite Alcanzado"}
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                {upgradeReason === "csv" ? (
                                    <>La importación y exportación por <strong>CSV</strong> está disponible en los planes <strong>Enterprise</strong> y <strong>Unlimited</strong>. Mejora tu plan para gestionar nominados en masa.</>
                                ) : (
                                    <>Has alcanzado el máximo de <strong>{currentLimit} {square ? "elementos" : "participantes"}</strong> en tu plan actual.</>
                                )}
                            </p>
                            <div className={`bg-black/40 rounded-xl border-2 border-white/5 p-4 mb-8 space-y-3 ${square || upgradeReason === "csv" ? "hidden" : ""}`}>
                                <div className="flex justify-between items-center text-sm border-b-2 border-white/5 pb-2">
                                    <span className="text-gray-500">Tu Plan ({PLANS[planKey].name})</span>
                                    <span className="font-mono text-red-400">{currentLimit} participantes</span>
                                </div>
                                {planSlug !== "premium" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-blue-300"><Star size={12} /> Premium</span>
                                        <span className="font-mono text-white">{PLANS.PREMIUM.limits.participantsPerEvent} participantes</span>
                                    </div>
                                )}
                                {planSlug !== "plus" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-purple-300"><Crown size={12} /> Plus</span>
                                        <span className="font-mono text-white">{PLANS.PLUS.limits.participantsPerEvent} participantes</span>
                                    </div>
                                )}
                                {planSlug !== "unlimited" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-purple-300"><Crown size={12} /> Unlimited</span>
                                        <span className="font-mono text-white">{PLANS.UNLIMITED.limits.participantsPerEvent} participantes</span>
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

            {/* ── Barra de selección masiva ── */}
            <AnimatePresence>
                {!isOrdering && selected.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="flex flex-wrap items-center gap-3 p-3 rounded-xl border-2 border-blue-500/30 bg-blue-500/5"
                    >
                        <span className="text-sm font-bold text-white">{selected.size} seleccionado(s)</span>
                        <button
                            onClick={selectAllFiltered}
                            className="inline-flex items-center gap-1.5 bg-white/5 text-gray-200 border-2 border-white/15 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <CheckCheck size={14} /> Seleccionar todos{isSearching ? " (filtrados)" : ""}
                        </button>
                        <button
                            onClick={clearSelection}
                            className="inline-flex items-center gap-1.5 bg-white/5 text-gray-400 border-2 border-white/15 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={14} /> Limpiar
                        </button>
                        <button
                            onClick={() => { setPendingDelete(Array.from(selected)); setShowDeleteModal(true); }}
                            className="ml-auto inline-flex items-center gap-1.5 bg-red-500/20 text-red-300 border-2 border-red-500/30 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                        >
                            <Trash2 size={14} /> Eliminar seleccionados
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Modo "Ordenar": vista global compacta (grid 8 / 4 col) ── */}
            {isOrdering ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-500/5 border-2 border-blue-500/20 rounded-xl px-4 py-2.5">
                        <ArrowDownUp size={14} className="shrink-0" />
                        <span>Arrastra cualquier nominado para reordenar toda la lista. Pulsa <strong>Salir</strong> al terminar.</span>
                    </div>
                    <DndContext id="nominados-ordenar" sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEndAll}>
                        <SortableContext items={items.map(p => p.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 items-start">
                                {items.map((p) => (
                                    <CompactSortableCard key={p.id} p={p} />
                                ))}
                            </div>
                        </SortableContext>
                        <DragOverlay>
                            {activeParticipant ? <OverlayCard p={activeParticipant} square /> : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            ) : (
            /* ── Grid de nominados (drag & drop en grid con @dnd-kit) ── */
            <DndContext id="nominados" sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <SortableContext items={paginatedData.map(p => p.id)} strategy={rectSortingStrategy}>
                    <div
                        key={`${currentPage}-${isSearching ? "s" : "n"}`}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 items-start min-h-[300px] animate-in fade-in duration-200"
                    >
                        {paginatedData.map((p) => {
                            const globalIndex = filteredData.indexOf(p);
                            return (
                                <SortableCard
                                    key={p.id}
                                    p={p}
                                    isSelected={selected.has(p.id)}
                                    canManage={canManageNominees}
                                    square={square}
                                    dragEnabled={dragEnabled}
                                    onToggleSelect={() => toggleSelect(p.id)}
                                    onEdit={() => setEditIndex(globalIndex)}
                                    onDelete={() => { setPendingDelete([p.id]); setShowDeleteModal(true); }}
                                />
                            );
                        })}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeParticipant ? <OverlayCard p={activeParticipant} square={square} /> : null}
                </DragOverlay>
            </DndContext>
            )}

            {!isOrdering && filteredData.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm flex flex-col items-center gap-2">
                    <User size={28} className="text-gray-700" />
                    {searchQuery ? "No se encontraron nominados." : "Aún no hay nominados. Pulsa \"Nuevo\" para empezar."}
                </div>
            )}

            {/* ── Pagination ── */}
            {!isOrdering && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4 border-t-2 border-white/5">
                    <button
                        onClick={() => currentPage > 1 && setCurrentPage(c => c - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={18} className="text-white" />
                    </button>
                    <span className="text-xs text-gray-400 font-mono">
                        Página <span className="text-white font-bold">{currentPage}</span> de {totalPages}
                    </span>
                    <button
                        onClick={() => currentPage < totalPages && setCurrentPage(c => c + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                        <ChevronRight size={18} className="text-white" />
                    </button>
                </div>
            )}

            {/* ── Modal Crear (multi-creación) ── */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsCreating(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 26 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md max-h-[88vh] overflow-y-auto p-6 shadow-2xl relative"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Plus size={18} className="text-blue-400" /> Nuevo nominado</h2>
                                <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white cursor-pointer"><X size={18} /></button>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-4">Puedes crear varios seguidos: el formulario se mantiene abierto tras añadir.</p>
                            <ParticipantForm
                                key={formResetKey}
                                eventId={eventId}
                                planSlug={planSlug}
                                onSubmit={async (fd) => {
                                    if (items.length >= currentLimit) {
                                        toast.error(`Has alcanzado el límite de ${currentLimit} nominados.`);
                                        return;
                                    }
                                    try {
                                        await createEventParticipant(eventId, fd);
                                        toast.success("Nominado añadido");
                                        setFormResetKey(k => k + 1);
                                        router.refresh();
                                    } catch {
                                        toast.error("No se pudo añadir el nominado.");
                                    }
                                }}
                                onCancel={() => setIsCreating(false)}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Modal Editar (con paginador de flechas) ── */}
            <AnimatePresence>
                {editing && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setEditIndex(null)}
                    >
                        <div className="flex items-center gap-2 sm:gap-3 w-full max-w-xl justify-center" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => gotoEdit(-1)}
                                disabled={editIndex === 0}
                                title="Anterior"
                                className="h-10 w-10 shrink-0 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <motion.div
                                initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 10 }}
                                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                                className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md max-h-[88vh] overflow-y-auto p-6 shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Pencil size={16} className="text-blue-400" /> Editar nominado</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 font-mono">{(editIndex ?? 0) + 1} / {filteredData.length}</span>
                                        <button onClick={() => setEditIndex(null)} className="text-gray-400 hover:text-white cursor-pointer"><X size={18} /></button>
                                    </div>
                                </div>
                                <ParticipantForm
                                    key={editing.id}
                                    eventId={eventId}
                                    planSlug={planSlug}
                                    isEditMode
                                    initialName={editing.name}
                                    initialImage={editing.imageUrl || ""}
                                    onSubmit={async (fd) => {
                                        try {
                                            await updateEventParticipant(editing.id, eventId, fd);
                                            toast.success("Nominado actualizado");
                                            router.refresh();
                                        } catch {
                                            toast.error("No se pudo actualizar el nominado.");
                                        }
                                    }}
                                    onCancel={() => setEditIndex(null)}
                                />
                            </motion.div>

                            <button
                                onClick={() => gotoEdit(1)}
                                disabled={editIndex === filteredData.length - 1}
                                title="Siguiente"
                                className="h-10 w-10 shrink-0 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Modal confirmar borrado ── */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => !isDeleting && setShowDeleteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-red-500"
                        >
                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-red-400" /> Eliminar nominados</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                ¿Seguro que quieres eliminar <strong className="text-white">{pendingDelete.length}</strong> nominado(s)? Esta acción es irreversible.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold cursor-pointer disabled:opacity-50">Cancelar</button>
                                <button onClick={handleBulkDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer flex items-center justify-center disabled:opacity-50">
                                    {isDeleting ? <Bouncy size={20} color="white" /> : "Sí, eliminar"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CSV Import/Export Modal ── */}
            {showCsvModal && canManageNominees && (
                <CsvManagerModal
                    config={csvConfig}
                    onClose={() => setShowCsvModal(false)}
                    onImported={() => router.refresh()}
                />
            )}
        </div>
    );
}
