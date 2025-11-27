import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Search, Filter, Eye, ShieldAlert, MoreVertical, Users } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";

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

    // Construcción dinámica del filtro
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
                    {/* Buscador */}
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

                    {/* Filtro de Rol */}
                    <div className="flex bg-neutral-900 border border-white/10 rounded-lg p-1">
                        <FilterLink role="ALL" current={roleFilter} label="Todos" />
                        <FilterLink role="ADMIN" current={roleFilter} label="Admins" />
                        <FilterLink role="USER" current={roleFilter} label="Usuarios" />
                    </div>
                </div>
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Usuario</th>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium">Plan</th>
                            <th className="p-4 font-medium">Actividad</th>
                            <th className="p-4 font-medium">Registro</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className={`hover:bg-white/5 transition-colors group ${
                                    user.ipBan ? "bg-red-900/10" : ""
                                }`}
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden text-xs font-bold text-gray-500">
                                            {user.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={user.image}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                user.name?.[0]
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                user.role === "ADMIN"
                                                    ? "bg-purple-900/20 text-purple-400 border-purple-500/20"
                                                    : user.role === "MODERATOR"
                                                    ? "bg-blue-900/20 text-blue-400 border-blue-500/20"
                                                    : "bg-gray-800 text-gray-400 border-gray-700"
                                            }`}
                                        >
                                            {user.role}
                                        </span>
                                        {user.ipBan && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-900/20 text-red-400 border border-red-500/20 flex items-center gap-1">
                                                <ShieldAlert size={10} /> BANNED
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span
                                        className={`capitalize text-xs ${
                                            user.subscriptionStatus === "active"
                                                ? "text-green-400"
                                                : "text-gray-500"
                                        }`}
                                    >
                                        {user.subscriptionStatus}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-gray-400 font-mono">
                                    <div>{user._count.events} Eventos</div>
                                    {user._count.reports > 0 && (
                                        <div className="text-red-400">
                                            {user._count.reports} Reportes
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-gray-500 text-xs">
                                    {format(new Date(user.createdAt), "dd MMM yyyy", {
                                        locale: es,
                                    })}
                                </td>
                                <td className="p-4 text-right">
                                    <Link
                                        href={`/admin/users/${user.id}`}
                                        className="inline-flex p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Ver Detalles"
                                    >
                                        <Eye size={16} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No se encontraron usuarios.
                    </div>
                )}
            </div>

            {/* Paginador debajo, manteniendo el layout general */}
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
                isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
            }`}
        >
            {label}
        </Link>
    );
}
