// app/admin/events/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    Search,
    Calendar,
} from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminEventsTableClient from "@/components/admin/AdminEventsTableClient";
import UserFilterCombobox from "@/components/admin/UserFilterCombobox";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

export default async function AdminEventsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; mode?: string; page?: string; userId?: string }>;
}) {
    const params = await searchParams;
    const query = params?.q || "";
    const userId = params?.userId || "";
    const statusFilter = params?.status;
    const modeFilter = params?.mode;
    const pageRaw = params?.page ?? "1";
    const currentPage = Math.max(1, Number(pageRaw) || 1);

    const whereClause: any = {};

    if (query) {
        whereClause.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
        ];
    }

    if (userId) {
        whereClause.userId = userId;
    }

    if (statusFilter && statusFilter !== "ALL") {
        whereClause.status = statusFilter;
    }

    const EVENT_MODES = ["GALA", "TIERLIST", "PREGUNTAS", "DIBUJO"];
    if (modeFilter && modeFilter !== "ALL" && EVENT_MODES.includes(modeFilter)) {
        whereClause.mode = modeFilter;
    }

    // Fetch selected user label to pre-populate combobox badge server-side
    const selectedUser = userId
        ? await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true },
          })
        : null;

    const selectedUserLabel = selectedUser
        ? `${selectedUser.name || "Sin nombre"} (${selectedUser.email})`
        : undefined;

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

    const eventsForClient = events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        status: e.status,
        mode: e.mode,
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

                <div className="flex gap-2 w-full md:w-auto flex-wrap">
                    {/* Event title / slug search */}
                    <form className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            name="q"
                            placeholder="Evento o slug..."
                            defaultValue={query}
                            className="bg-neutral-900 border-2 border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none w-full md:w-52 transition-all focus:w-64"
                        />
                        {statusFilter && (
                            <input type="hidden" name="status" value={statusFilter} />
                        )}
                        {modeFilter && (
                            <input type="hidden" name="mode" value={modeFilter} />
                        )}
                        {userId && (
                            <input type="hidden" name="userId" value={userId} />
                        )}
                    </form>

                    {/* User autocomplete filter */}
                    <UserFilterCombobox
                        selectedUserId={userId || undefined}
                        selectedUserLabel={selectedUserLabel}
                        query={query || undefined}
                        status={statusFilter || undefined}
                    />

                    {/* Status tabs */}
                    <div className="flex bg-neutral-900 border-2 border-white/10 rounded-lg p-1">
                        <FilterLink status="ALL" current={statusFilter} label="Todos" q={query} userId={userId} mode={modeFilter} />
                        <FilterLink status="APPROVED" current={statusFilter} label="Publicados" q={query} userId={userId} mode={modeFilter} />
                        <FilterLink status="PENDING" current={statusFilter} label="Pendientes" q={query} userId={userId} mode={modeFilter} />
                    </div>

                    {/* Mode tabs */}
                    <div className="flex bg-neutral-900 border-2 border-white/10 rounded-lg p-1">
                        <ModeFilterLink mode="ALL" current={modeFilter} label="Todos" q={query} userId={userId} status={statusFilter} />
                        <ModeFilterLink mode="GALA" current={modeFilter} label="Gala" q={query} userId={userId} status={statusFilter} />
                        <ModeFilterLink mode="TIERLIST" current={modeFilter} label="Tierlist" q={query} userId={userId} status={statusFilter} />
                        <ModeFilterLink mode="PREGUNTAS" current={modeFilter} label="Preguntas" q={query} userId={userId} status={statusFilter} />
                        <ModeFilterLink mode="DIBUJO" current={modeFilter} label="Dibujo" q={query} userId={userId} status={statusFilter} />
                    </div>
                </div>
            </div>

            <AdminEventsTableClient
                events={eventsForClient}
                currentPage={currentPage}
                totalPages={totalPages}
                query={query || undefined}
                status={statusFilter || undefined}
                userFilter={selectedUserLabel}
                userId={userId || undefined}
            />

            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/admin/events"
                query={{
                    q: query || undefined,
                    status: statusFilter || undefined,
                    mode: modeFilter || undefined,
                    userId: userId || undefined,
                }}
            />
        </div>
    );
}

function FilterLink({
    status,
    current,
    label,
    q,
    userId,
    mode,
}: {
    status: string;
    current?: string;
    label: string;
    q?: string;
    userId?: string;
    mode?: string;
}) {
    const isActive = (status === "ALL" && !current) || current === status;
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (mode) params.set("mode", mode);
    if (q) params.set("q", q);
    if (userId) params.set("userId", userId);
    const qs = params.toString();

    return (
        <Link
            href={qs ? `?${qs}` : "?"}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
        >
            {label}
        </Link>
    );
}

function ModeFilterLink({
    mode,
    current,
    label,
    q,
    userId,
    status,
}: {
    mode: string;
    current?: string;
    label: string;
    q?: string;
    userId?: string;
    status?: string;
}) {
    const isActive = (mode === "ALL" && !current) || current === mode;
    const params = new URLSearchParams();
    if (mode !== "ALL") params.set("mode", mode);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (userId) params.set("userId", userId);
    const qs = params.toString();

    return (
        <Link
            href={qs ? `?${qs}` : "?"}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
        >
            {label}
        </Link>
    );
}
