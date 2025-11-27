import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, Calendar, Mail } from "lucide-react";
import UserActions from "@/components/admin/UserActions";

export const dynamic = "force-dynamic";

const PREMIUM_PRICE_ID = "price_1SVz0lAnnRNk3k0PSEZ15Dr0";
const UNLIMITED_PRICE_ID = "price_1SVz24AnnRNk3k0PvSjAEVQA";

export default async function AdminUserDetailPage({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            events: { orderBy: { createdAt: "desc" } },
            _count: { select: { events: true, votes: true, reports: true } },
        },
    });

    if (!user) notFound();

    // --- Derivamos plan a partir de stripePriceId ---
    let planLabel = "Free";
    if (user.stripePriceId === PREMIUM_PRICE_ID) planLabel = "Premium";
    else if (user.stripePriceId === UNLIMITED_PRICE_ID) planLabel = "Unlimited";

    const isPaidPlan = planLabel === "Premium" || planLabel === "Unlimited";

    const planBadgeClasses = isPaidPlan
        ? "bg-emerald-900/30 text-emerald-400 border-emerald-500/20"
        : "bg-gray-800 text-gray-500 border-gray-700";

    const roleBadgeClasses =
        user.role === "ADMIN"
            ? "bg-purple-900/30 text-purple-400 border-purple-500/20"
            : user.role === "MODERATOR"
            ? "bg-blue-900/30 text-blue-400 border-blue-500/20"
            : "bg-gray-900/30 text-gray-400 border-gray-500/20";

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <Link
                href="/admin/users"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={16} /> Volver a usuarios
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* COLUMNA IZQUIERDA: PERFIL + EVENTOS */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Tarjeta de perfil */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 flex items-start gap-6">
                        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-500 overflow-hidden border-2 border-white/5 shrink-0">
                            {user.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name ?? "Avatar"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                user.name?.[0] ?? "U"
                            )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                            <h1 className="text-2xl font-bold text-white truncate">
                                {user.name}
                            </h1>

                            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Mail size={14} /> {user.email}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    Unido el{" "}
                                    {format(
                                        new Date(user.createdAt),
                                        "dd MMM yyyy",
                                        { locale: es }
                                    )}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-bold border uppercase ${roleBadgeClasses}`}
                                >
                                    {user.role}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-bold border uppercase ${planBadgeClasses}`}
                                >
                                    Plan {planLabel}
                                </span>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-gray-400">
                                <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                                        Eventos
                                    </p>
                                    <p className="text-lg font-bold text-white">
                                        {user._count.events}
                                    </p>
                                </div>
                                <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                                        Votos
                                    </p>
                                    <p className="text-lg font-bold text-white">
                                        {user._count.votes}
                                    </p>
                                </div>
                                <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                                        Reportes
                                    </p>
                                    <p className="text-lg font-bold text-white">
                                        {user._count.reports}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Eventos */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 font-bold text-sm text-gray-400 uppercase tracking-wider flex justify-between items-center">
                            <span>Eventos Creados ({user._count.events})</span>
                        </div>

                        <div className="divide-y divide-white/5">
                            {user.events.length > 0 ? (
                                user.events.map((event) => (
                                    <Link
                                        key={event.id}
                                        href={`/admin/events/${event.id}`}
                                        className="block px-6 py-4 hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex justify-between items-center gap-4">
                                            <div className="min-w-0">
                                                <p className="text-white font-medium group-hover:text-blue-400 transition-colors truncate">
                                                    {event.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {format(
                                                        new Date(event.createdAt),
                                                        "dd/MM/yyyy"
                                                    )}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-[10px] px-2 py-1 rounded font-bold uppercase whitespace-nowrap ${
                                                    event.status === "APPROVED"
                                                        ? "text-green-500 bg-green-900/20"
                                                        : event.status === "DENIED"
                                                        ? "text-red-400 bg-red-900/20"
                                                        : "text-yellow-500 bg-yellow-900/20"
                                                }`}
                                            >
                                                {event.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="px-6 py-8 text-center text-gray-500 text-sm">
                                    Sin eventos.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: ACCIONES Y EDICIÓN COMPLETA */}
                <div>
                    <UserActions
                        user={{
                            id: user.id,
                            role: user.role,
                            ipBan: user.ipBan,
                            name: user.name,
                            username: user.username,
                            email: user.email,
                            stripePriceId: user.stripePriceId,
                            subscriptionStatus: user.subscriptionStatus ?? "free",
                            subscriptionEndDate: user.subscriptionEndDate
                                ? user.subscriptionEndDate.toISOString()
                                : null,
                            cancelAtPeriodEnd: user.cancelAtPeriodEnd,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}