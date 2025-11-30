import { prisma } from "@/lib/prisma";
import { Users, Calendar, CheckSquare, ArrowRight, ShieldAlert, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const userCount = await prisma.user.count();
    const eventCount = await prisma.event.count();
    const reportCount = await prisma.report.count({ where: { isReviewed: false } });
    const pendingReviews = await prisma.event.count({ where: { status: 'PENDING' } });

    // Obtener últimos 5 eventos
    const latestEvents = await prisma.event.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });

    // Obtener últimos 5 usuarios
    const latestUsers = await prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
                <p className="text-gray-400">Resumen de actividad de la plataforma.</p>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <KpiCard
                    title="Usuarios Totales"
                    value={userCount}
                    icon={<Users className="text-blue-500" />}
                    href="/admin/users"
                />
                <KpiCard
                    title="Eventos Creados"
                    value={eventCount}
                    icon={<Calendar className="text-purple-500" />}
                    href="/admin/events"
                />
                <KpiCard
                    title="Pendientes de Revisión"
                    value={pendingReviews}
                    icon={<CheckSquare className="text-amber-500" />}
                    href="/admin/reviews"
                    alert={pendingReviews > 0}
                />
                <KpiCard
                    title="Reportes Pendientes"
                    value={reportCount}
                    icon={<ShieldAlert className="text-red-500" />}
                    href="/admin/reports"
                    alert={reportCount > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ÚLTIMOS EVENTOS */}
                <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white">Actividad Reciente</h3>
                        <Link href="/admin/events" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">Ver todo <ArrowRight size={12} /></Link>
                    </div>
                    <div className="space-y-2">
                        {latestEvents.map(e => (
                            <Link key={e.id} href={`/admin/events/${e.id}`} className="flex justify-between items-center p-3 border border-white/5 rounded-xl hover:bg-neutral-950 transition-colors duration-400 hover:border-white/10 group min-h-18 max-h-18">
                                <div>
                                    <p className="text-sm font-medium text-gray-200">{e.title}</p>
                                    <p className="text-xs text-gray-500">por {e.user.name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-600">
                                        {formatDistanceToNow(e.createdAt, {
                                            addSuffix: true,
                                            locale: es
                                        })
                                            .replace(/alrededor de /i, "")
                                            .replace(/^./i, (c) => c.toUpperCase())}
                                    </span>
                                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-600 transition-colors duration-400">
                                        <ArrowUpRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {latestEvents.length === 0 && <p className="text-xs text-gray-500">No hay actividad.</p>}
                    </div>
                </div>

                {/* ÚLTIMOS USUARIOS */}
                <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white">Nuevos Usuarios</h3>
                        <Link href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">Ver todo <ArrowRight size={12} /></Link>
                    </div>
                    <div className="space-y-2">
                        {latestUsers.map(u => (
                            <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center gap-2 justify-between p-3 border border-white/5 rounded-xl hover:bg-neutral-950 transition-colors duration-400 hover:border-white/10 group min-h-18 max-h-18">

                                    <div className="flex items-center justify-center font-bold text-xs text-gray-400">
                                        {u.image ? (
                                            <img src={u.image} alt="" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs text-gray-400" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs text-gray-400">
                                                {u.name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-gray-200">{u.name}</p>

                                            ·

                                            <p className="text-[11px] font-medium text-white/30">(@{u.username})</p>
                                        </div>
                                        <p className="text-xs text-gray-500">{u.email}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${u.subscriptionStatus === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                        {u.subscriptionStatus === 'active' ? 'PREMIUM' : 'FREE'}
                                    </span>
                                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-600 transition-colors duration-400">
                                        <ArrowUpRight size={16} />
                                    </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, href, alert }: any) {
    return (
        <Link href={href} className={`block p-6 bg-neutral-900 border rounded-xl transition-all hover:bg-neutral-800 ${alert ? title == "Pendientes de Revisión" ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-red-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-white/10'}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
                <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
            </div>
            <p className="text-4xl font-bold text-white">{value}</p>
        </Link>
    )
}