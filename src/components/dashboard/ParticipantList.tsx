"use client";

import { useState } from "react";
import { updateEventParticipant, deleteEventParticipant, createEventParticipant } from "@/app/lib/event-actions";
import { Pencil, Trash2, Save, X, Plus, Search } from "lucide-react";
import { useFormStatus } from 'react-dom';
import { Bouncy } from 'ldrs/react';

if (typeof window !== 'undefined') {
    import('ldrs/bouncy');
}

type Participant = {
    id: string;
    name: string;
    imageUrl: string | null;
};

// Botones auxiliares con loader
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

export default function ParticipantList({
    initialData,
    eventId
}: {
    initialData: Participant[],
    eventId: string
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState(""); // Estado del buscador
    
    const [newName, setNewName] = useState("");
    const [editName, setEditName] = useState("");

    // Filtro de caracteres
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
        const val = e.target.value;
        if (/^[\w\s\-\.,:;!¡?¿()áéíóúÁÉÍÓÚñÑüÜ]*$/.test(val)) {
            if (isEdit) setEditName(val);
            else setNewName(val);
        }
    };

    // Filtrar lista
    const filteredData = initialData.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">

            {/* HEADER CON BUSCADOR Y CREAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Lista de Nominados ({filteredData.length})
                </h3>
                
                <div className="flex w-full sm:w-auto gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Buscar participantes..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => { setIsCreating(true); setNewName(""); }}
                        className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                        <Plus size={14} /> Nuevo
                    </button>
                </div>
            </div>

            {/* FORMULARIO DE CREACIÓN */}
            {isCreating && (
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <form
                        action={async (formData) => {
                            await createEventParticipant(eventId, formData);
                            setIsCreating(false);
                            setNewName("");
                        }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">?</div>
                        <div className="flex-1 grid gap-2">
                            <input 
                                name="name" 
                                value={newName}
                                maxLength={40}
                                onChange={(e) => handleNameChange(e, false)}
                                autoFocus 
                                className="bg-black border border-blue-500/30 rounded px-3 py-2 text-white text-sm w-full focus:border-blue-500 outline-none" 
                                placeholder="Nombre del participante..." 
                                required 
                            />
                            <input 
                                name="imageUrl"
                                className="bg-black border border-blue-500/30 rounded px-3 py-2 text-white text-xs w-full focus:border-blue-500 outline-none" 
                                placeholder="https://foto.com/avatar.jpg" 
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <CreateButton />
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-transparent text-gray-400 rounded text-xs hover:text-white cursor-pointer">Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* LISTA FILTRADA */}
            <div className="space-y-2">
                {filteredData.map((p) => (
                    <div key={p.id} className="bg-neutral-900/50 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:border-white/20 transition-colors cursor-pointer">

                        {editingId === p.id ? (
                            // MODO EDICIÓN
                            <form
                                action={async (formData) => {
                                    await updateEventParticipant(p.id, eventId, formData);
                                    setEditingId(null);
                                }}
                                className="flex-1 flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                    {p.imageUrl && <img src={p.imageUrl} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 grid gap-2">
                                    <input 
                                        name="name" 
                                        value={editName}
                                        maxLength={40}
                                        onChange={(e) => handleNameChange(e, true)}
                                        className="bg-black border border-white/20 rounded px-2 py-1 text-white text-sm w-full focus:border-blue-500 outline-none" 
                                        required 
                                    />
                                    <input 
                                        name="imageUrl" 
                                        defaultValue={p.imageUrl || ""} 
                                        className="bg-black border border-white/20 rounded px-2 py-1 text-white text-xs w-full focus:border-blue-500 outline-none" 
                                        placeholder="URL Imagen" 
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <SaveButton />
                                    <button type="button" onClick={() => setEditingId(null)} className="p-4 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 cursor-pointer"><X size={20} /></button>
                                </div>
                            </form>
                        ) : (
                            // MODO VISTA
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
                                    <button onClick={() => { setEditingId(p.id); setEditName(p.name); }} className="p-4 text-blue-400 hover:bg-blue-400/10 rounded transition cursor-pointer">
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
            </div>

            {filteredData.length === 0 && !isCreating && (
                <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-gray-600 text-sm">
                    {searchQuery ? "No se encontraron nominados." : "No hay participantes. Añade a tus amigos para empezar."}
                </div>
            )}
        </div>
    );
}