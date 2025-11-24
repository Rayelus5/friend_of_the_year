import { prisma } from "@/lib/prisma";
import { Users, Calendar, CheckSquare } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    // Obtener contadores rápidos
    const userCount = await prisma.user.count();
    const eventCount = await prisma.event.count();
    const pendingReviews = await prisma.event.count({ where: { status: 'PENDING' } });

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
                <p className="text-gray-400">Bienvenido al centro de mando de POLLNOW.</p>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
                    href="/admin/review"
                    alert={pendingReviews > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Aquí pondremos gráficas o listas recientes en el futuro */}
                <div className="p-6 bg-neutral-900 border border-white/10 rounded-xl min-h-[200px] flex flex-col items-center justify-center text-gray-500">
                    <p>Gráfico de actividad (Próximamente)</p>
                </div>
                <div className="p-6 bg-neutral-900 border border-white/10 rounded-xl min-h-[200px] flex flex-col items-center justify-center text-gray-500">
                    <p>Últimos registros (Próximamente)</p>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, href, alert }: any) {
    return (
        <Link href={href} className={`block p-6 bg-neutral-900 border rounded-xl transition-all hover:bg-neutral-800 ${alert ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-white/10'}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
                <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
            </div>
            <p className="text-4xl font-bold text-white">{value}</p>
        </Link>
    )
}