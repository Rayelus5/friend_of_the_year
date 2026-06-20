"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";
import {
    DndContext,
    closestCenter,
    pointerWithin,
    rectIntersection,
    getFirstCollision,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    useDroppable,
    DragOverlay,
    MeasuringStrategy,
    type CollisionDetection,
    type UniqueIdentifier,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    rectSortingStrategy,
    useSortable,
    sortableKeyboardCoordinates,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, Trophy, ZoomIn, X } from "lucide-react";

type Participant = { id: string; name: string; imageUrl: string | null };
type Tier = { id: string; label: string; color: string; order: number };
type Lists = Record<string, string[]>;

const TRAY = "tray";

// Devuelve la clave del contenedor que contiene `id`, o el propio `id` si ya es un contenedor.
function findContainer(lists: Lists, id: string): string | undefined {
    if (id in lists) return id;
    return Object.keys(lists).find((k) => lists[k].includes(id));
}

// ─── Tarjeta arrastrable (dnd-kit) ───
function SortableCard({
    p,
    disabled,
    onOpen,
}: {
    p: Participant;
    disabled: boolean;
    onOpen: (p: Participant) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: p.id,
        disabled,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => { if (p.imageUrl) onOpen(p); }}
            className={`group relative aspect-square w-20 rounded-lg overflow-hidden border-2 bg-neutral-800 shrink-0 touch-none ${isDragging ? "opacity-30" : ""} border-white/10 ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
            title={p.imageUrl ? `${p.name} · pulsa para ampliar` : p.name}
        >
            <CardInner p={p} />
        </div>
    );
}

// Contenido visual reutilizado por la card y por el DragOverlay.
function CardInner({ p }: { p: Participant }) {
    return (
        <>
            {p.imageUrl ? (
                <ImageWithSkeleton src={p.imageUrl} alt={p.name} className="w-full h-full object-cover pointer-events-none" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-center text-[11px] font-bold text-gray-200 px-1 pointer-events-none">{p.name}</div>
            )}
            {p.imageUrl && (
                <>
                    <div className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <ZoomIn size={12} />
                    </div>
                    <div className="hidden group-hover:block absolute inset-x-0 bottom-0 bg-black/60 text-[10px] text-white text-center truncate px-1 py-0.5 pointer-events-none">{p.name}</div>
                </>
            )}
        </>
    );
}

// ─── Contenedor que recibe items (tier o bandeja) ───
function DroppableArea({
    id,
    items,
    className,
    overClassName,
    children,
}: {
    id: string;
    items: string[];
    className: string;
    overClassName: string;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <SortableContext id={id} items={items} strategy={rectSortingStrategy}>
            <div ref={setNodeRef} className={`${className} ${isOver ? overClassName : ""}`}>
                {children}
            </div>
        </SortableContext>
    );
}

export default function TierlistVotingClient({
    event,
    tiers,
    participants,
}: {
    event: { id: string; title: string; description: string | null };
    tiers: Tier[];
    participants: Participant[];
}) {
    const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);
    const partById = new Map(participants.map((p) => [p.id, p]));

    // Estado: droppableId -> participantId[]
    const [lists, setLists] = useState<Lists>(() => {
        const init: Lists = { [TRAY]: participants.map((p) => p.id) };
        sortedTiers.forEach((t) => (init[`tier-${t.id}`] = []));
        return init;
    });
    const [submitting, setSubmitting] = useState(false);
    const [voted, setVoted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    // Imagen ampliada (lightbox) al pulsar una tarjeta con imagen.
    const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Estabilizadores para el arrastre multi-contenedor (patrón oficial dnd-kit):
    // evitan que el objetivo de colisión "parpadee" tras cruzar de tier.
    const lastOverId = useRef<UniqueIdentifier | null>(null);
    const recentlyMovedToNewContainer = useRef(false);

    useEffect(() => {
        requestAnimationFrame(() => { recentlyMovedToNewContainer.current = false; });
    }, [lists]);

    // Detección de colisión: puntero dentro → intersección de rects; si caemos sobre
    // un contenedor con items, se resuelve al item más cercano dentro de él.
    const collisionDetectionStrategy: CollisionDetection = useCallback(
        (args) => {
            const pointerIntersections = pointerWithin(args);
            const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
            let overId = getFirstCollision(intersections, "id");

            if (overId != null) {
                if (typeof overId === "string" && overId in lists) {
                    const containerItems = lists[overId];
                    if (containerItems.length > 0) {
                        const closest = closestCenter({
                            ...args,
                            droppableContainers: args.droppableContainers.filter(
                                (c) => c.id !== overId && containerItems.includes(String(c.id))
                            ),
                        });
                        overId = closest[0]?.id ?? overId;
                    }
                }
                lastOverId.current = overId;
                return [{ id: overId }];
            }

            if (recentlyMovedToNewContainer.current) {
                lastOverId.current = activeId;
            }
            return lastOverId.current ? [{ id: lastOverId.current }] : [];
        },
        [activeId, lists]
    );

    const activeParticipant = activeId ? partById.get(activeId) : null;

    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightbox]);

    // Reconstruye un estado de listas válido a partir de lo guardado: descarta ids
    // que ya no existen y coloca en la bandeja cualquier nominado no clasificado.
    function buildFromSaved(saved: Lists): Lists {
        const valid = new Set(participants.map((p) => p.id));
        const placed = new Set<string>();
        const next: Lists = { [TRAY]: [] };
        sortedTiers.forEach((t) => (next[`tier-${t.id}`] = []));
        for (const t of sortedTiers) {
            const key = `tier-${t.id}`;
            for (const pid of saved[key] ?? []) {
                if (valid.has(pid) && !placed.has(pid)) { next[key].push(pid); placed.add(pid); }
            }
        }
        for (const pid of saved[TRAY] ?? []) {
            if (valid.has(pid) && !placed.has(pid)) { next[TRAY].push(pid); placed.add(pid); }
        }
        for (const p of participants) if (!placed.has(p.id)) next[TRAY].push(p.id);
        return next;
    }

    function persistLists(current: Lists) {
        try { localStorage.setItem(`tl_lists_${event.id}`, JSON.stringify(current)); } catch { /* no-op */ }
    }

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!localStorage.getItem(`tl_voted_${event.id}`)) return;
        setVoted(true);
        // Restaurar la tierlist que envió el usuario (para mostrarla deshabilitada).
        const saved = localStorage.getItem(`tl_lists_${event.id}`);
        if (saved) {
            try { setLists(buildFromSaved(JSON.parse(saved))); } catch { /* mantener estado actual */ }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.id]);

    function onDragStart(e: DragStartEvent) {
        if (voted) return;
        setActiveId(String(e.active.id));
    }

    // Mueve el item entre contenedores mientras se arrastra (patrón multi-container).
    function onDragOver(e: DragOverEvent) {
        if (voted) return;
        const { active, over } = e;
        if (!over) return;
        const activeIdStr = String(active.id);
        const overId = String(over.id);

        // ¿El cursor está pasado el centro de la tarjeta de destino? → insertar después.
        const overRect = over.rect;
        const activeRect = active.rect.current.translated;
        const isAfter =
            !!activeRect && !!overRect &&
            (activeRect.left + activeRect.width / 2 > overRect.left + overRect.width / 2 ||
                activeRect.top + activeRect.height / 2 > overRect.top + overRect.height / 2);

        setLists((prev) => {
            const activeContainer = findContainer(prev, activeIdStr);
            const overContainer = findContainer(prev, overId);
            if (!activeContainer || !overContainer || activeContainer === overContainer) return prev;

            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const overIndex = overItems.indexOf(overId);
            // Si soltamos sobre el contenedor vacío/su zona, añadir al final;
            // si es sobre una tarjeta, antes o después según la posición del cursor.
            const newIndex = overId in prev
                ? overItems.length
                : overIndex >= 0 ? overIndex + (isAfter ? 1 : 0) : overItems.length;

            recentlyMovedToNewContainer.current = true;
            return {
                ...prev,
                [activeContainer]: activeItems.filter((id) => id !== activeIdStr),
                [overContainer]: [
                    ...overItems.slice(0, newIndex),
                    activeIdStr,
                    ...overItems.slice(newIndex),
                ],
            };
        });
    }

    // Reordena dentro del contenedor de destino (el cruce ya lo hizo onDragOver).
    function onDragEnd(e: DragEndEvent) {
        setActiveId(null);
        if (voted) return;
        const { active, over } = e;
        if (!over) return;
        const activeIdStr = String(active.id);
        const overId = String(over.id);

        setLists((prev) => {
            const activeContainer = findContainer(prev, activeIdStr);
            const overContainer = findContainer(prev, overId);
            if (!activeContainer || !overContainer || activeContainer !== overContainer) return prev;

            const items = prev[activeContainer];
            const oldIndex = items.indexOf(activeIdStr);
            const newIndex = overId in prev ? items.length - 1 : items.indexOf(overId);
            if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;

            return { ...prev, [activeContainer]: arrayMove(items, oldIndex, newIndex) };
        });
    }

    async function handleSubmit() {
        setError(null);
        setSubmitting(true);
        const entries: { tierId: string; participantId: string }[] = [];
        for (const t of sortedTiers) {
            for (const pid of lists[`tier-${t.id}`]) entries.push({ tierId: t.id, participantId: pid });
        }
        if (entries.length === 0) {
            setError("Coloca al menos un nominado en un tier.");
            setSubmitting(false);
            return;
        }
        try {
            const res = await fetch("/api/tierlist-votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId: event.id, entries }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 403) { localStorage.setItem(`tl_voted_${event.id}`, "1"); persistLists(lists); setVoted(true); }
                else setError(data.error || "No se pudo registrar el voto.");
            } else {
                localStorage.setItem(`tl_voted_${event.id}`, "1");
                persistLists(lists);
                setVoted(true);
            }
        } catch {
            setError("Error de red. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <Link href="/polls" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4">
                    <ArrowLeft size={16} /> Volver
                </Link>

                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                    {event.description && <p className="text-gray-400 mt-1">{event.description}</p>}
                    <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">Tierlist</span>
                </div>

                {/* Aviso de voto registrado (la tierlist se muestra debajo, deshabilitada) */}
                {voted && (
                    <div className="max-w-2xl mx-auto mb-6 flex items-center gap-3 bg-green-500/10 border-2 border-green-500/30 rounded-2xl px-5 py-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center text-green-400 shrink-0">
                            <Check size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-white">¡Voto registrado!</p>
                            <p className="text-sm text-gray-400">Esta es la tierlist que enviaste. Ya no puedes editarla.</p>
                        </div>
                    </div>
                )}

                <DndContext
                    id="tierlist-voting"
                    sensors={sensors}
                    collisionDetection={collisionDetectionStrategy}
                    measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                    onDragCancel={() => setActiveId(null)}
                >
                    {/* Tabla de tiers */}
                    <div className={`rounded-2xl overflow-hidden border-2 border-neutral-700 ${voted ? "opacity-90" : ""}`}>
                        {sortedTiers.map((t) => (
                            <div key={t.id} className="flex border-b border-neutral-700 last:border-b-0 min-h-[96px]">
                                <div className="w-24 shrink-0 flex items-center justify-center font-bold text-black/80 text-center px-2 break-words" style={{ backgroundColor: t.color }}>
                                    {t.label}
                                </div>
                                <DroppableArea
                                    id={`tier-${t.id}`}
                                    items={lists[`tier-${t.id}`]}
                                    className="flex-1 flex flex-wrap gap-2 p-2 items-center bg-neutral-900/40 transition-colors"
                                    overClassName="bg-blue-500/5"
                                >
                                    {lists[`tier-${t.id}`].map((pid) => {
                                        const p = partById.get(pid);
                                        return p ? <SortableCard key={pid} p={p} disabled={voted} onOpen={(pp) => setLightbox({ url: pp.imageUrl!, name: pp.name })} /> : null;
                                    })}
                                </DroppableArea>
                            </div>
                        ))}
                    </div>

                    {/* Bandeja de nominados (sin clasificar) */}
                    {(!voted || lists[TRAY].length > 0) && (
                        <div className="mt-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                {voted ? "Sin clasificar" : "Arrastra los nominados a los tiers"}
                            </p>
                            <DroppableArea
                                id={TRAY}
                                items={lists[TRAY]}
                                className={`flex flex-wrap gap-2 p-1.5 rounded-2xl border-2 border-neutral-700 bg-neutral-800/40 min-h-[110px] max-h-[400px] overflow-y-auto transition-colors ${voted ? "opacity-90" : ""}`}
                                overClassName="border-blue-500/40"
                            >
                                {lists[TRAY].map((pid) => {
                                    const p = partById.get(pid);
                                    return p ? <SortableCard key={pid} p={p} disabled={voted} onOpen={(pp) => setLightbox({ url: pp.imageUrl!, name: pp.name })} /> : null;
                                })}
                            </DroppableArea>
                        </div>
                    )}

                    {/* Tarjeta flotante que sigue al cursor mientras se arrastra */}
                    <DragOverlay>
                        {activeParticipant ? (
                            <div className="relative aspect-square w-20 rounded-lg overflow-hidden border-2 border-blue-500 bg-neutral-800 shadow-2xl cursor-grabbing">
                                <CardInner p={activeParticipant} />
                            </div>
                        ) : null}
                    </DragOverlay>

                    {!voted && (
                        <>
                            {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Trophy size={18} /> {submitting ? "Registrando…" : "Registrar voto"}
                                </button>
                            </div>
                        </>
                    )}
                </DndContext>
            </div>

            {/* Lightbox: imagen ampliada de la opción */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
                    >
                        <button
                            onClick={() => setLightbox(null)}
                            aria-label="Cerrar"
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            src={lightbox.url}
                            alt={lightbox.name}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl border-2 border-white/15 shadow-2xl"
                        />
                        <p className="mt-4 text-white font-semibold text-center max-w-[90vw] break-words">{lightbox.name}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
