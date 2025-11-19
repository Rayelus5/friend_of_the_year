import { prisma } from "@/lib/prisma";
import { createPoll, deletePoll } from "../actions";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function PollsAdmin() {
    // Obtenemos encuestas y participantes para el formulario
    const polls = await prisma.poll.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { votes: true } } }
    });

    const participants = await prisma.participant.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-white">Encuestas (Categorías)</h1>
                <p className="text-gray-400 mt-1">Gestión de los premios FOTY.</p>
            </header>

            <div className="grid xl:grid-cols-2 gap-12">

                {/* --- FORMULARIO DE CREACIÓN --- */}
                <section className="bg-neutral-900 border border-white/10 rounded-2xl p-8 h-fit">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Nueva Categoría
                    </h2>

                    <form action={createPoll} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Título</label>
                                <input name="title" type="text" required placeholder="Ej: El más fiestero" className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Descripción</label>
                                <textarea name="description" rows={2} placeholder="Descripción corta del premio..." className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Fecha Fin (Gala)</label>
                                <input name="endAt" type="datetime-local" required className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none dark-calendar" />
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3">Nominados (Selecciona)</label>
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {participants.map(p => (
                                    <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                                        <input type="checkbox" name="participantIds" value={p.id} className="w-4 h-4 accent-amber-500 rounded" />
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                                                {p.imageUrl && <img src={p.imageUrl} className="w-full h-full object-cover" />}
                                            </div>
                                            <span className="text-sm text-gray-300">{p.name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-amber-500 text-black font-bold py-4 rounded-xl hover:bg-amber-400 transition-transform active:scale-95">
                            Crear Encuesta
                        </button>
                    </form>
                </section>

                {/* --- LISTA DE ENCUESTAS --- */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4">Activas ({polls.length})</h2>
                    {polls.map((poll) => (
                        <div key={poll.id} className="bg-neutral-900/50 border border-white/5 p-6 rounded-2xl hover:border-white/20 transition-colors group relative">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-xl text-white group-hover:text-amber-500 transition-colors">{poll.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${poll.isPublished ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                    {poll.isPublished ? 'Publicada' : 'Borrador'}
                                </span>
                            </div>

                            <p className="text-gray-400 text-sm mb-4 line-clamp-1">{poll.description}</p>

                            <div className="flex items-center justify-between text-xs text-gray-500 font-mono border-t border-white/5 pt-4">
                                <span>Votos: <strong className="text-white">{poll._count.votes}</strong></span>
                                <span>Fin: {format(new Date(poll.endAt), 'dd/MM/yyyy')}</span>
                            </div>

                            <div className="absolute top-14 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <form action={deletePoll.bind(null, poll.id)}>
                                    <button className="text-red-500 hover:text-red-700 bg-red-800/20 px-3 py-1 rounded-full text-xs cursor-pointer">Eliminar</button>
                                </form>
                            </div>
                        </div>
                    ))}

                    {polls.length === 0 && (
                        <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl text-gray-600">
                            No hay encuestas creadas.
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}