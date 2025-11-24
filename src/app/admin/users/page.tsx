import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { events: true } } }
    });

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
                    <p className="text-gray-400">Base de datos de usuarios registrados.</p>
                </div>
                <div className="text-sm text-gray-500 font-mono bg-white/5 px-3 py-1 rounded">
                    Total: {users.length}
                </div>
            </header>

            <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Usuario</th>
                            <th className="p-4 font-medium">Email</th>
                            <th className="p-4 font-medium">Rol</th>
                            <th className="p-4 font-medium">Plan</th>
                            <th className="p-4 font-medium">Eventos</th>
                            <th className="p-4 font-medium">Registro</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium text-white">{user.name || "Sin nombre"}</td>
                                <td className="p-4 text-gray-400">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 capitalize">{user.subscriptionStatus}</td>
                                <td className="p-4">{user._count.events}</td>
                                <td className="p-4 text-gray-500">
                                    {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: es })}
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-xs text-blue-400 hover:underline">Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}