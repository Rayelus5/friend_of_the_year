// app/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Search, Filter, Users } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminUsersTableClient from "@/components/admin/AdminUsersTableClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
    const params = await searchParams;
    const query = params?.q || "";
    const roleFilter = params?.role || "ALL";
    const pageParam = params?.page || "1";
    const currentPage = Math.max(1, Number(pageParam) || 1);

    const whereClause: any = {};

    if (query) {
        whereClause.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
        ];
    }

    if (roleFilter && roleFilter !== "ALL") {
        whereClause.role = roleFilter;
    }

    const [users, totalUsers] = await Promise.all([
        prisma.user.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { events: true, reports: true } },
            },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

    // Serializar para cliente (fechas a ISO, evitar objetos)
    const usersForClient = users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        image: u.image,
        role: u.role,
        ipBan: u.ipBan ?? false,
        subscriptionStatus: u.subscriptionStatus ?? "free",
        stripePriceId: u.stripePriceId ?? null,
        createdAt: u.createdAt.toISOString(),
        _count: u._count,
    }));

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                        <Users size={28} className="text-blue-500" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Base de datos completa de usuarios registrados.
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <form className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            name="q"
                            placeholder="Nombre, email o usuario..."
                            defaultValue={query}
                            className="bg-neutral-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none w-full md:w-64 transition-all focus:w-80"
                        />
                        {roleFilter && (
                            <input type="hidden" name="role" value={roleFilter} />
                        )}
                    </form>

                    <div className="flex bg-neutral-900 border border-white/10 rounded-lg p-1">
                        <FilterLink role="ALL" current={roleFilter} label="Todos" />
                        <FilterLink role="ADMIN" current={roleFilter} label="Admins" />
                        <FilterLink role="USER" current={roleFilter} label="Usuarios" />
                    </div>
                </div>
            </div>

            {/* Componente cliente que maneja selección y acciones masivas */}
            <AdminUsersTableClient
                users={usersForClient}
                currentPage={currentPage}
                totalPages={totalPages}
                query={query || undefined}
                role={roleFilter !== "ALL" ? roleFilter : undefined}
            />

            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/admin/users"
                query={{
                    q: query || undefined,
                    role: roleFilter !== "ALL" ? roleFilter : undefined,
                }}
            />
        </div>
    );
}

function FilterLink({
    role,
    current,
    label,
}: {
    role: string;
    current?: string;
    label: string;
}) {
    const isActive = (role === "ALL" && !current) || current === role;
    return (
        <Link
            href={`?role=${role}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
        >
            {label}
        </Link>
    );
}