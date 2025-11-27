import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Clock, User, Calendar, Trash2, Ban, CheckCircle, XCircle, FileText, Shield, ListChecks, Logs } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
const PAGE_SIZE = 10;


export const dynamic = "force-dynamic";

// Mapeo visual
const actionIcons: any = {
    'APPROVE_EVENT': <CheckCircle className="text-green-500" size={16} />,
    'DENY_EVENT': <XCircle className="text-red-500" size={16} />,
    'BAN_USER': <Ban className="text-red-500" size={16} />,
    'REPORT_REVIEW': <ListChecks className="text-amber-500" size={16} />,
    'DEFAULT': <FileText className="text-gray-500" size={16} />
};

export default async function AdminLogsPage({ searchParams }: { searchParams: Promise<{ page?: string; [key: string]: string | undefined }> }) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        redirect('/');
    }

    const params = await searchParams;
    const pageRaw = params?.page ?? "1";
    const currentPage = Math.max(1, Number(pageRaw) || 1);
    const filters: any = {};

    if (params.adminId) filters.adminId = params.adminId;
    if (params.targetType) filters.targetType = params.targetType;

    const [logs, totalLogs] = await Promise.all([
        prisma.moderationLog.findMany({
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            include: { admin: true, event: true },
        }),
        prisma.moderationLog.count(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                        <Logs size={28} className="text-blue-500" /> 
                        Auditoría y Logs
                    </h1>
                    <p className="text-gray-400 mt-1">Registro inmutable de todas las acciones administrativas.</p>
                </div>
            </div>    

            <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Acción</th>
                            <th className="p-4 font-medium">Objetivo</th>
                            <th className="p-4 font-medium">Detalles</th>
                            <th className="p-4 font-medium">Admin</th>
                            <th className="p-4 font-medium text-right">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {actionIcons[log.actionType] || actionIcons['DEFAULT']}
                                        <span className="font-mono text-xs font-bold">{log.actionType}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold border border-white/10 mr-2">
                                        {log.targetType}
                                    </span>
                                    <span className="font-mono text-xs text-gray-500 select-all">
                                        {log.targetId}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400 max-w-md truncate" title={log.details || ""}>
                                    {log.details || "-"}
                                </td>
                                <td className="p-4">
                                    <Link href={`/admin/users/${log.adminId}`} className="flex items-center gap-2 hover:text-white">
                                        <div className="w-5 h-5 rounded-full bg-blue-900 text-blue-200 flex items-center justify-center text-[10px] font-bold">
                                            {log.admin.username?.[0].toUpperCase()}
                                        </div>
                                        <span className="text-xs">{log.admin.username}</span>
                                    </Link>
                                </td>
                                <td className="p-4 text-right text-xs text-gray-500 font-mono">
                                    {format(new Date(log.createdAt), 'dd/MM HH:mm', { locale: es })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && (
                    <div className="p-12 text-center text-gray-500">No hay registros de actividad.</div>
                )}
            </div>
            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/admin/logs"
            />
        </div>
    );
}