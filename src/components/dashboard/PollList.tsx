"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createEventPoll, updateEventPoll, deleteEventPoll, reorderEventPolls } from "@/app/lib/event-actions";
import { GripVertical, Pencil, Trash2, X, Plus, Search } from "lucide-react";
import { format, isValid } from "date-fns";
import { useFormStatus } from 'react-dom';
import { Bouncy } from 'ldrs/react';

if (typeof window !== 'undefined') {
    import('ldrs/bouncy');
}

type Participant = { id: string; name: string };
type Poll = {
    id: string;
    title: string;
    description: string | null;
    endAt: Date | null;
    isPublished: boolean;
    _count: { votes: number };
    options: { participantId: string }[];
};

function ModalSubmitButton({ isCreating }: { isCreating: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex-1 py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-400 cursor-pointer flex justify-center items-center min-h-[48px]"
        >
            {pending ? <Bouncy size="30" speed="1.75" color="white" /> : (isCreating ? "Crear" : "Guardar")}
        </button>
    );
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <button disabled={pending} className="p-3 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 cursor-pointer flex justify-center items-center min-w-[44px]">
            {pending ? <Bouncy size="20" speed="1.75" color="#f87171" /> : <Trash2 size={20} />}
        </button>
    )
}

export default function PollList({
    initialPolls,
    allParticipants,
    eventId
}: {
    initialPolls: Poll[],
    allParticipants: Participant[],
    eventId: string
}) {
    const [polls, setPolls] = useState(initialPolls);
    const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [title, setTitle] = useState("");

    useEffect(() => { setPolls(initialPolls); }, [initialPolls]);

    const filteredPolls = polls.filter(poll =>
        poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (poll.description && poll.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[\w\s\-\.,:;!¡?¿()áéíóúÁÉÍÓÚñÑüÜ]*$/.test(val)) {
            setTitle(val);
        }
    };

    const openCreate = () => {
        setTitle("");
        setIsCreating(true);
    };

    const openEdit = (poll: Poll) => {
        setTitle(poll.title);
        setEditingPoll(poll);
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        if (searchQuery) return;

        const items = Array.from(polls);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setPolls(items);

        const updates = items.map((item, index) => ({ id: item.id, order: index }));
        await reorderEventPolls(updates, eventId);
    };

    return (
        <>
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Orden de Categorías
                </h3>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar categoría..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>

                    <button
                        onClick={openCreate}
                        className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                        <Plus size={14} /> Nueva
                    </button>
                </div>
            </div>

            {/* LISTA */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="polls" isDropDisabled={searchQuery.length > 0}>
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {filteredPolls.map((poll, index) => {
                                const endDate = poll.endAt ? new Date(poll.endAt) : null;
                                const dateString = endDate && isValid(endDate)
                                    ? format(endDate, 'dd/MM/yyyy')
                                    : null;

                                const displayIndex = searchQuery ? polls.findIndex(p => p.id === poll.id) : index;

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
                                                className={`bg-neutral-900/50 border p-4 rounded-2xl flex items-center gap-4 group transition-colors ${snapshot.isDragging ? 'border-blue-500 bg-neutral-800' : 'border-white/5 hover:border-blue-500/30'}`}
                                            >
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className={`text-gray-600 hover:text-white ${searchQuery ? 'cursor-default opacity-30' : 'cursor-grab active:cursor-grabbing'}`}
                                                >
                                                    <GripVertical size={20} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-white truncate pr-2">{poll.title}</h3>
                                                        <span className="text-xs font-mono text-gray-600 whitespace-nowrap">#{displayIndex + 1}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 line-clamp-1">{poll.description}</p>
                                                    <div className="flex gap-4 mt-2 text-[10px] text-gray-500 font-mono">
                                                        <span>Votos: {poll._count.votes}</span>
                                                        {dateString && (
                                                            <span>Cierra: {dateString}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 opacity-100 transition-opacity">
                                                    <button onClick={() => openEdit(poll)} className="p-3 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 cursor-pointer">
                                                        <Pencil size={20} />
                                                    </button>
                                                    <form action={deleteEventPoll.bind(null, poll.id, eventId)}>
                                                        <DeleteButton />
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                )
                            })}
                            {provided.placeholder}

                            {filteredPolls.length === 0 && (
                                <div className="text-center py-10 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">
                                    No se encontraron categorías.
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* MODAL UNIFICADO */}
            {(editingPoll || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                {isCreating ? "Nueva Categoría" : "Editar Categoría"}
                            </h2>
                            <button onClick={() => { setEditingPoll(null); setIsCreating(false); }}>
                                <X className="text-gray-400 hover:text-white cursor-pointer" />
                            </button>
                        </div>

                        <form
                            action={async (formData) => {
                                if (isCreating) {
                                    await createEventPoll(eventId, formData);
                                } else if (editingPoll) {
                                    await updateEventPoll(editingPoll.id, eventId, formData);
                                }
                                setEditingPoll(null);
                                setIsCreating(false);
                            }}
                            className="p-6 space-y-4"
                        >
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Título</label>
                                <input
                                    name="title"
                                    value={title}
                                    maxLength={50}
                                    onChange={handleTitleChange}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    maxLength={200}
                                    defaultValue={editingPoll?.description || ""}
                                    rows={2}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            {/*<div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Fecha de Cierre (Opcional)</label>
                                <input
                                    name="endAt"
                                    type="datetime-local"
                                    defaultValue={editingPoll && editingPoll.endAt && isValid(new Date(editingPoll.endAt)) ? new Date(editingPoll.endAt).toISOString().slice(0, 16) : ""}
                                    className="w-full bg-black border border-white/20 rounded p-2 text-white dark-calendar focus:border-blue-500 outline-none"
                                />
                                <p className="text-[10px] text-gray-600 mt-1">Si lo dejas vacío, la votación seguirá abierta hasta la gala.</p>
                            </div>*/}

                            <div className="pt-4 border-t border-white/10">
                                <label className="text-xs text-gray-500 uppercase block mb-3">Nominados (Selecciona)</label>

                                {/* AQUÍ ESTÁ LA MAGIA DE LA SELECCIÓN PERSISTENTE 
                                    El componente gestiona internamente el estado de todos los seleccionados
                                    y renderiza inputs ocultos para asegurar que se envíen al servidor.
                                */}
                                <ParticipantSelector allParticipants={allParticipants} editingPoll={editingPoll} />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setEditingPoll(null); setIsCreating(false); }}
                                    className="flex-1 py-3 bg-gray-800 rounded text-white font-bold hover:bg-gray-700 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <ModalSubmitButton isCreating={isCreating} />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

// Componente inteligente para gestión de selección con filtrado
function ParticipantSelector({ allParticipants, editingPoll }: { allParticipants: Participant[], editingPoll: Poll | null }) {
    const [filter, setFilter] = useState("");
    // Estado local para almacenar TODOS los IDs seleccionados (visibles o no)
    const [selectedIds, setSelectedIds] = useState<string[]>(() => {
        if (!editingPoll) return [];
        return editingPoll.options.map(opt => opt.participantId);
    });

    // Filtrar visualmente
    const filtered = allParticipants.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

    const handleToggle = (participantId: string) => {
        setSelectedIds(prev => {
            if (prev.includes(participantId)) {
                return prev.filter(id => id !== participantId);
            } else {
                return [...prev, participantId];
            }
        });
    };

    return (
        <>
            {/* Input de filtrado visual */}
            <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 w-3 h-3" />
                <input
                    type="text"
                    placeholder="Filtrar amigos..."
                    className="w-full bg-black/30 border border-white/10 rounded text-xs py-1 pl-7 text-white focus:border-blue-500 outline-none transition-colors"
                    onChange={(e) => setFilter(e.target.value)}
                    // Importante: prevenimos que el enter envíe el form principal
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                />
            </div>

            {/* Lista filtrada visualmente */}
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                {filtered.map(p => {
                    const isSelected = selectedIds.includes(p.id);

                    return (
                        <div
                            key={p.id}
                            onClick={() => handleToggle(p.id)}
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition-colors ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:bg-white/5'}`}
                        >
                            {/* Checkbox visual (controlado por React) */}
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`}>
                                {isSelected && <Plus size={10} className="text-white" />}
                            </div>
                            <span className={`text-sm truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>{p.name}</span>
                        </div>
                    )
                })}
                {filtered.length === 0 && <p className="text-xs text-gray-500 col-span-2 text-center">No hay resultados.</p>}
            </div>

            {/* Inputs ocultos para el FormData 
                Renderizamos un input hidden por cada ID seleccionado en el estado global.
                Así, al hacer submit, se envían TODOS los seleccionados, 
                independientemente de si están visibles en el filtro o no.
            */}
            {selectedIds.map(id => (
                <input key={id} type="hidden" name="participantIds" value={id} />
            ))}
        </>
    )
}