import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ExternalLink, Trash2, Search, Eye } from "lucide-react";
import { deleteEvent } from "@/app/lib/admin-actions"; // Asegúrate de exportar esto en admin-actions.ts si no existe, o reutiliza la de event-actions.ts importándola aquí

export const dynamic = "force-dynamic";

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const params = await searchParams;
    const query = params?.q || "";

    const events = await prisma.event.findMany({
        where: {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { name: true, email: true } },
            _count: { select: { polls: true, participants: true } }
        },
        take: 50 // Paginación simple para MVP
    });

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gestión de Eventos</h1>
                    <p className="text-gray-400">Supervisión global de todos los eventos creados.</p>
                </div>

                {/* Buscador Simple (Server Side via URL) */}
                <form className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        name="q"
                        placeholder="Buscar por título o slug..."
                        defaultValue={query}
                        className="bg-neutral-900 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none w-64 transition-all focus:w-80"
                    />
                </form>
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Evento</th>
                            <th className="p-4 font-medium">Creador</th>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium">Stats</th>
                            <th className="p-4 font-medium">Fecha</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {events.map(event => (
                            <tr key={event.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div className="font-bold text-white mb-1">{event.title}</div>
                                    <div className="text-xs text-gray-500 font-mono truncate max-w-[150px]">{event.slug}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-white">{event.user.name}</div>
                                    <div className="text-xs text-gray-500">{event.user.email}</div>
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={event.status} isPublic={event.isPublic} />
                                </td>
                                <td className="p-4 text-xs font-mono text-gray-400">
                                    <div>{event._count.polls} Cats</div>
                                    <div>{event._count.participants} Noms</div>
                                </td>
                                <td className="p-4 text-gray-500 text-xs">
                                    {format(new Date(event.createdAt), 'dd MMM yyyy', { locale: es })}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/e/${event.slug}`}
                                            target="_blank"
                                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition"
                                            title="Ver Público"
                                        >
                                            <ExternalLink size={16} />
                                        </Link>
                                        <Link
                                            href={`/dashboard/event/${event.id}`}
                                            className="p-2 text-gray-400 hover:bg-white/10 rounded transition"
                                            title="Ver como Admin (Dashboard)"
                                        >
                                            <Eye size={16} />
                                        </Link>
                                        {/* Formulario para borrar directo (Server Action) */}
                                        <form action={async () => {
                                            "use server";
                                            // Importa deleteEvent de admin-actions si creaste una versión admin
                                            // o usa prisma directamente aquí si prefieres (inline server action)
                                            await prisma.event.delete({ where: { id: event.id } });
                                            // revalidatePath('/admin/events'); // Next.js lo hace auto en inline actions de page
                                        }}>
                                            <button className="p-2 text-red-400 hover:bg-red-500/10 rounded transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {events.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No se encontraron eventos.
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status, isPublic }: { status: string, isPublic: boolean }) {
    if (status === 'PENDING') return <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-[10px] font-bold uppercase">Revisión</span>;
    if (status === 'REJECTED') return <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-[10px] font-bold uppercase">Rechazado</span>;
    if (status === 'APPROVED' && isPublic) return <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-[10px] font-bold uppercase">Público</span>;
    return <span className="bg-gray-700 text-gray-400 px-2 py-1 rounded text-[10px] font-bold uppercase">Privado/Draft</span>;
}