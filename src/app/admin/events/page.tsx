import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
    ExternalLink,
    Trash2,
    Search,
    Eye,
    Filter,
    Calendar,
} from "lucide-react";
import { deleteEvent } from "@/app/lib/event-actions";
import AdminPagination from "@/components/admin/AdminPagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

export default async function AdminEventsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
    const params = await searchParams;
    const query = params?.q || "";
    const statusFilter = params?.status; // "APPROVED" | "PENDING" | "ALL" | undefined
    const pageRaw = params?.page ?? "1";
    const currentPage = Math.max(1, Number(pageRaw) || 1);

    // Construcción dinámica del filtro (igual que el original, pero con paginación)
    const whereClause: any = {};

    if (query) {
        whereClause.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            {
                user: {
                    email: { contains: query, mode: "insensitive" },
                },
            },
        ];
    }

    // Solo filtramos por status si NO es "ALL"
    if (statusFilter && statusFilter !== "ALL") {
        whereClause.status = statusFilter;
    }

    const [events, totalEvents] = await Promise.all([
        prisma.event.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true, image: true } },
                _count: { select: { polls: true, participants: true } },
            },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.event.count({ where: whereClause }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalEvents / PAGE_SIZE));

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                        <Calendar size={28} className="text-blue-500" />
                        Gestión de Eventos
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Supervisión y control total de todos los eventos de la
                        plataforma.
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Buscador */}
                    <form className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            name="q"
                            placeholder="Buscar evento, slug o email..."
                            defaultValue={query}
                            className="bg-neutral-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none w-full md:w-64 transition-all focus:w-80"
                        />
                        {/* Mantenemos el filtro de estado si existe al buscar */}
                        {statusFilter && (
                            <input
                                type="hidden"
                                name="status"
                                value={statusFilter}
                            />
                        )}
                    </form>

                    {/* Filtro de Estado (Simple via URL) */}
                    <div className="flex bg-neutral-900 border border-white/10 rounded-lg p-1">
                        <FilterLink status="ALL" current={statusFilter} label="Todos" />
                        <FilterLink
                            status="APPROVED"
                            current={statusFilter}
                            label="Publicados"
                        />
                        <FilterLink
                            status="PENDING"
                            current={statusFilter}
                            label="Pendientes"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Evento</th>
                            <th className="p-4 font-medium">Creador</th>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium">Privacidad</th>
                            <th className="p-4 font-medium">Stats</th>
                            <th className="p-4 font-medium">Creado</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {events.map((event) => (
                            <tr
                                key={event.id}
                                className="hover:bg-white/5 transition-colors group"
                            >
                                <td className="p-4">
                                    <div
                                        className="font-bold text-white mb-1 max-w-[200px] truncate"
                                        title={event.title}
                                    >
                                        {event.title}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono truncate max-w-[150px]">
                                        {event.slug}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden shrink-0">
                                            {event.user.image && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={event.user.image}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-white text-xs font-medium">
                                                {event.user.name}
                                            </div>
                                            <div className="text-[10px] text-gray-500 truncate max-w-[150px]">
                                                {event.user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={event.status} />
                                </td>
                                <td className="p-4">
                                    <span
                                        className={`text-[10px] px-2 py-1 rounded border ${
                                            event.isPublic
                                                ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                                                : "border-gray-700 text-gray-400 bg-gray-800"
                                        }`}
                                    >
                                        {event.isPublic ? "Público" : "Privado"}
                                    </span>
                                </td>
                                <td className="p-4 text-xs font-mono text-gray-400">
                                    <div title="Categorías">
                                        {event._count.polls} Cats
                                    </div>
                                    <div title="Participantes">
                                        {event._count.participants} Noms
                                    </div>
                                </td>
                                <td className="p-4 text-gray-500 text-xs">
                                    {format(new Date(event.createdAt), "dd MMM yy", {
                                        locale: es,
                                    })}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/e/${event.slug}`}
                                            target="_blank"
                                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition"
                                            title="Ver Web Pública"
                                        >
                                            <ExternalLink size={16} />
                                        </Link>
                                        <Link
                                            href={`/admin/events/${event.id}`}
                                            className="p-2 text-white hover:bg-white/10 rounded transition"
                                            title="Gestionar Evento (Modo Dios)"
                                        >
                                            <Eye size={16} />
                                        </Link>
                                        {/* Botón de borrado directo */}
                                        {/* <form
                                            action={async () => {
                                                "use server";
                                                await deleteEvent(event.id, true);
                                            }}
                                        >
                                            <button
                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded transition"
                                                title="Eliminar definitivamente"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </form> */}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {events.length === 0 && (
                    <div className="py-24 text-center flex flex-col items-center justify-center text-gray-500">
                        <Filter size={48} className="mb-4 opacity-20" />
                        <p>No se encontraron eventos con estos filtros.</p>
                    </div>
                )}
            </div>

            {/* Paginador profesional, mismo estilo general que el resto */}
            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/admin/events"
                query={{
                    q: query || undefined,
                    status: statusFilter || undefined,
                }}
            />
        </div>
    );
}

function FilterLink({
    status,
    current,
    label,
}: {
    status: string;
    current?: string;
    label: string;
}) {
    const isActive = (status === "ALL" && !current) || current === status;
    return (
        <Link
            href={`?status=${status}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
            }`}
        >
            {label}
        </Link>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "PENDING")
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold border border-yellow-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                Revisión
            </span>
        );
    if (status === "REJECTED")
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Rechazado
            </span>
        );
    if (status === "APPROVED")
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Aprobado
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-800 text-gray-400 text-[10px] font-bold border border-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
            Borrador
        </span>
    );
}
