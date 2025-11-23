"use client";

import { useState, useRef } from "react";
import { updateEventParticipant, deleteEventParticipant, createEventParticipant } from "@/app/lib/event-actions";
import { Pencil, Trash2, Save, X, Plus, Search, Upload, Wand2, Image as ImageIcon, Lock, Star, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { useFormStatus } from 'react-dom';
import Link from "next/link";
import Image from "next/image";
import { PLANS } from "@/lib/plans";
import { Quantum } from 'ldrs/react'
import { Mirage } from 'ldrs/react'
import { Bouncy } from 'ldrs/react'
import 'ldrs/react/Bouncy.css'
import 'ldrs/react/Mirage.css'
import 'ldrs/react/Quantum.css'

// --- TIPOS ---
type Participant = {
    id: string;
    name: string;
    imageUrl: string | null;
};

// --- BOTONES CON LOADER ---
function SaveButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="p-4 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 cursor-pointer flex items-center justify-center min-w-[50px]">
            {pending ? <Bouncy size="20" speed="1.75" color="#22c55e" /> : <Save size={20} />}
        </button>
    );
}

function CreateButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500 cursor-pointer flex items-center justify-center min-w-[80px]">
            {pending ? <Bouncy size="20" speed="1.75" color="white" /> : "Guardar"}
        </button>
    );
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <button disabled={pending} className="p-4 text-red-400 hover:bg-red-400/10 rounded transition cursor-pointer flex items-center justify-center min-w-[50px]">
            {pending ? <Bouncy size="20" speed="1.75" color="#f87171" /> : <Trash2 size={20} />}
        </button>
    )
}

// --- COMPONENTE DE FORMULARIO REUTILIZABLE (CREAR Y EDITAR) ---
function ParticipantForm({
    initialName = "",
    initialImage = "",
    onSubmit,
    onCancel,
    isEditMode = false
}: {
    initialName?: string,
    initialImage?: string,
    onSubmit: (formData: FormData) => Promise<void>,
    onCancel: () => void,
    isEditMode?: boolean
}) {
    const [name, setName] = useState(initialName);
    const [image, setImage] = useState(initialImage);
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^[\w\s\-\.,:;!¡?¿()áéíóúÁÉÍÓÚñÑüÜ]*$/.test(val)) {
            setName(val);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB
                alert("La imagen es demasiado grande (Max 4MB)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const generateAIImage = async () => {
        if (!name) return;
        setIsGenerating(true);

        try {
            const seed = Math.floor(Math.random() * 10000);
            const prompt = `Ultra-realistic photographic depiction of ${name}. Professional lighting, high-detail textures, sharp focus, natural colors, minimalistic background, clean composition. 8k resolution.`;
            const url = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&model=flux`;

            const img = new window.Image();
            img.src = url;
            img.onload = () => {
                setImage(url);
                setIsGenerating(false);
            };
            img.onerror = () => {
                setIsGenerating(false);
            }
        } catch (error) {
            setIsGenerating(false);
        }
    };

    return (
        <form
            action={async (formData) => {
                formData.set('imageUrl', image);
                await onSubmit(formData);
            }}
            className={isEditMode ? "flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4" : "flex flex-col gap-4"}
        >
            <div className="flex items-start gap-4 w-full">

                <div className="relative group shrink-0">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-500/30 cursor-pointer hover:border-blue-500 transition-all bg-gray-900 ${isEditMode ? 'w-12 h-12' : 'w-16 h-16'}`}
                    >
                        {isGenerating ? (
                            <Quantum size={isEditMode ? "30" : "45"} speed="1.75" color="white" />
                        ) : image ? (
                            <img src={image} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                            <Upload size={isEditMode ? 16 : 24} className="text-blue-400" />
                        )}

                        {!isGenerating && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={14} className="text-white" />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                <div className="flex-1 grid gap-2 w-full">
                    <div className="flex gap-2">
                        <input
                            name="name"
                            value={name}
                            onChange={handleNameChange}
                            autoFocus={!isEditMode}
                            className="flex-1 bg-black border border-blue-500/30 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none w-full"
                            placeholder="Nombre del participante..."
                            required
                        />

                        <button
                            type="button"
                            onClick={generateAIImage}
                            disabled={isGenerating || !name}
                            className="px-3 py-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded hover:bg-purple-600/40 transition-colors disabled:opacity-50 flex items-center gap-2 text-xs font-bold whitespace-nowrap cursor-pointer min-h-[38px]"
                            title="Generar avatar con IA"
                        >
                            {isGenerating ? (
                                <Mirage size="40" speed="2.5" color="#d8b4fe" />
                            ) : (
                                <>
                                    <Wand2 size={14} />
                                    {!isEditMode && <span className="hidden sm:inline">Generar (IA)</span>}
                                </>
                            )}
                        </button>
                    </div>

                    <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3 h-3" />
                        <input
                            name="imageUrl"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            className="w-full bg-black border border-blue-500/30 rounded px-3 py-1.5 pl-8 text-white text-[10px] focus:border-blue-500 outline-none text-gray-400"
                            placeholder="O pega URL..."
                        />
                    </div>
                </div>
            </div>

            <div className={`flex gap-2 ${isEditMode ? '' : 'justify-end border-t border-white/5 pt-3'}`}>
                {isEditMode ? (
                    <>
                        <SaveButton />
                        <button type="button" onClick={onCancel} className="p-4 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 cursor-pointer"><X size={20} /></button>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-transparent text-gray-400 rounded text-xs hover:text-white cursor-pointer">Cancelar</button>
                        <CreateButton />
                    </>
                )}
            </div>
        </form>
    );
}

// --- COMPONENTE PRINCIPAL ---
export default function ParticipantList({
    initialData,
    eventId,
    planSlug
}: {
    initialData: Participant[],
    eventId: string,
    planSlug: string
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // ESTADO DE PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Lógica de Límites
    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const currentLimit = PLANS[planKey]?.limits?.participantsPerEvent || 12;
    const currentCount = initialData.length;

    const handleCreateClick = () => {
        if (currentCount >= currentLimit) {
            setShowUpgradeModal(true);
        } else {
            setIsCreating(true);
        }
    };

    // Filtrado Global (antes de paginar)
    const filteredData = initialData.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Paginación sobre los datos ya filtrados
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Manejo de cambio de página
    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(curr => curr + 1);
    };
    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(curr => curr - 1);
    };

    // Resetear a página 1 si cambia la búsqueda
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Lista de Nominados
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${currentCount >= currentLimit ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-gray-500 border-gray-700'}`}>
                        {currentCount} / {currentLimit}
                    </span>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar participantes..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full bg-neutral-900 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleCreateClick}
                        className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                    >
                        <Plus size={14} /> Nuevo
                    </button>
                </div>
            </div>

            {/* MODAL DE UPGRADE (LÍMITE ALCANZADO) */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />

                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <Lock className="text-amber-500" /> Límite Alcanzado
                        </h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Has alcanzado el máximo de <strong>{currentLimit} participantes</strong> permitidos en tu plan actual.
                        </p>

                        {/* Tabla Comparativa */}
                        <div className="bg-black/40 rounded-xl border border-white/5 p-4 mb-8 space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                <span className="text-gray-500">Tu Plan ({PLANS[planKey].name})</span>
                                <span className="font-mono text-red-400">{currentLimit} participantes</span>
                            </div>
                            {planSlug !== 'premium' && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2 text-blue-300"><Star size={12} /> Premium</span>
                                    <span className="font-mono text-white">{PLANS.PREMIUM.limits.participantsPerEvent} participantes</span>
                                </div>
                            )}
                            {planSlug !== 'plus' && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2 text-purple-300"><Crown size={12} /> Unlimited</span>
                                    <span className="font-mono text-white">{PLANS.PLUS.limits.participantsPerEvent} participantes</span>
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
                            <Link href="/premium" className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-center shadow-lg transition-colors duration-300">Mejorar Plan</Link>
                        </div>
                    </div>
                </div>
            )}

            {/* FORMULARIO DE CREACIÓN */}
            {isCreating && (
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <ParticipantForm
                        onSubmit={async (formData) => {
                            await createEventParticipant(eventId, formData);
                            setIsCreating(false);
                        }}
                        onCancel={() => setIsCreating(false)}
                    />
                </div>
            )}

            {/* LISTA PAGINADA */}
            <div className="space-y-2 min-h-[300px]">
                {paginatedData.map((p) => (
                    <div key={p.id} className="bg-neutral-900/50 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:border-white/20 transition-colors cursor-pointer">

                        {editingId === p.id ? (
                            <ParticipantForm
                                initialName={p.name}
                                initialImage={p.imageUrl || ""}
                                isEditMode={true}
                                onSubmit={async (formData) => {
                                    await updateEventParticipant(p.id, eventId, formData);
                                    setEditingId(null);
                                }}
                                onCancel={() => setEditingId(null)}
                            />
                        ) : (
                            <>
                                <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">{p.name.substring(0, 2).toUpperCase()}</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-200 truncate">{p.name}</h3>
                                        {p.imageUrl && <span className="text-[10px] text-green-500 bg-green-900/20 px-1.5 py-0.5 rounded">Con Foto</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingId(p.id)} className="p-4 text-blue-400 hover:bg-blue-400/10 rounded transition cursor-pointer">
                                        <Pencil size={20} />
                                    </button>
                                    <form action={deleteEventParticipant.bind(null, p.id, eventId)}>
                                        <DeleteButton />
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {filteredData.length === 0 && !isCreating && (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-gray-600 text-sm h-full flex items-center justify-center">
                        {searchQuery ? "No se encontraron nominados." : "No hay participantes. Añade a tus amigos para empezar."}
                    </div>
                )}
            </div>

            {/* CONTROLES DE PAGINACIÓN (SOLO SI ES NECESARIO) */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4 border-t border-white/5">
                    <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={20} className="text-white" />
                    </button>

                    <span className="text-xs text-gray-400 font-mono">
                        Página <span className="text-white font-bold">{currentPage}</span> de {totalPages}
                    </span>

                    <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                        <ChevronRight size={20} className="text-white" />
                    </button>
                </div>
            )}
        </div>
    );
}