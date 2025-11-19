import { prisma } from "@/lib/prisma";
import { createParticipant, deleteParticipant } from "../actions";

export const dynamic = 'force-dynamic';

export default async function ParticipantsAdmin() {
    const participants = await prisma.participant.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">Participantes</h1>
                    <p className="text-gray-400 mt-1">La base de datos de tus amigos.</p>
                </div>
                <div className="text-sm text-gray-500 font-mono">{participants.length} Registrados</div>
            </header>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* --- FORMULARIO DE CREACIÓN --- */}
                <div className="lg:col-span-1">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 sticky top-10">
                        <h2 className="text-lg font-bold text-white mb-4">Nuevo Participante</h2>
                        <form action={createParticipant} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nombre</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Ej: Alejandro"
                                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Foto URL</label>
                                <input
                                    name="imageUrl"
                                    type="url"
                                    placeholder="https://..."
                                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-indigo-50 transition-colors">
                                Añadir Amigo
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- LISTA DE PARTICIPANTES --- */}
                <div className="lg:col-span-2 space-y-3">
                    {participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-neutral-900/50 border border-white/5 p-4 rounded-xl hover:border-white/20 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden">
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{p.name[0]}</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-200">{p.name}</h3>
                                    <p className="text-xs text-gray-600 font-mono truncate max-w-[200px]">{p.id}</p>
                                </div>
                            </div>

                            <form action={deleteParticipant.bind(null, p.id)}>
                                <button className="text-xs text-red-900 hover:text-red-500 bg-red-950/30 hover:bg-red-950 px-3 py-1 rounded-md transition-colors">
                                    Eliminar
                                </button>
                            </form>
                        </div>
                    ))}

                    {participants.length === 0 && (
                        <div className="text-center py-10 text-gray-600">No hay participantes aún.</div>
                    )}
                </div>
            </div>
        </div>
    );
}