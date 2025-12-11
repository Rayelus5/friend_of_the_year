// app/admin/events/page.tsx
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
    ExternalLink,
    Search,
    Filter,
    Calendar,
} from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminEventsTableClient from "@/components/admin/AdminEventsTableClient";

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

    // Serializar eventos para pasarlos al cliente (evitar objetos Date/BigInt)
    const eventsForClient = events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        status: e.status,
        isPublic: e.isPublic,
        createdAt: e.createdAt.toISOString(),
        user: {
            name: e.user?.name ?? null,
            email: e.user?.email ?? null,
            image: e.user?.image ?? null,
        },
        _count: e._count,
    }));

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                        <Calendar size={28} className="text-blue-500" />
                        Gestión de Eventos
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Supervisión y control total de todos los eventos de la plataforma.
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <form className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            name="q"
                            placeholder="Buscar evento, slug o email..."
                            defaultValue={query}
                            className="bg-neutral-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none w-full md:w-64 transition-all focus:w-80"
                        />
                        {statusFilter && (
                            <input
                                type="hidden"
                                name="status"
                                value={statusFilter}
                            />
                        )}
                    </form>

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

            {/* Cliente con la tabla + selección masiva */}
            <AdminEventsTableClient
                events={eventsForClient}
                currentPage={currentPage}
                totalPages={totalPages}
                query={query || undefined}
                status={statusFilter || undefined}
            />

            {/* Paginador profesional (siempre lo dejamos por debajo) */}
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