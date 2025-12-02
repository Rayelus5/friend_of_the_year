import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/plans";
import { getEventStats } from "@/app/lib/stats-actions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import EventTabs from "@/components/dashboard/EventTabs";
import EventSettings from "@/components/dashboard/EventSettings";
import ParticipantList from "@/components/dashboard/ParticipantList";
import PollList from "@/components/dashboard/PollList";
import EventStatistics from "@/components/dashboard/EventStatistics";
import { Folders, UsersRound } from "lucide-react";
import clsx from "clsx";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function EventDashboardPage({ params }: Props) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) redirect("/login");

    const isAdmin =
        session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    // 1. Buscar evento
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            participants: { orderBy: { createdAt: "desc" } },
            polls: {
                orderBy: { order: "asc" },
                include: {
                    _count: { select: { votes: true } },
                    options: { select: { participantId: true } },
                },
            },
        },
    });

    // Si no existe -> 404
    // Si existe PERO no es dueño Y no es admin -> 404
    if (!event || (event.userId !== session.user.id && !isAdmin)) {
        notFound();
    }

    // 2. Obtener usuario (viewer) y plan
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });
    const plan = user ? getPlanFromUser(user) : { slug: "free", name: "Free" };

    // 3. Obtener estadísticas del evento
    const stats = await getEventStats(event.id);

    return (
        <main className="min-h-screen bg-black text-white">
            <header className="border-b border-white/10 bg-neutral-900/30">
                <div className="max-w-7xl mx-auto px-6 py-8 tour-event-header">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link
                            href="/dashboard"
                            className="hover:text-white transition-colors"
                        >
                            Dashboard
                        </Link>
                        <span>/</span>
                        <span className="truncate max-w-50">{event.title}</span>
                        {/* Badge de Plan (del usuario logueado) */}
                        <span
                            className={clsx(
                                "ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                plan.name.toUpperCase() === "PREMIUM"
                                    ? "bg-indigo-500/10 text-indigo-400"
                                    : plan.name.toUpperCase() === "UNLIMITED"
                                    ? "bg-purple-500/10 text-purple-400"
                                    : "bg-white/10 text-gray-400"
                            )}
                        >
                            Plan {plan.name}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight truncate ">
                        {event.title}
                    </h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <EventTabs
                    // PESTAÑA 1: Configuración
                    settings={
                        <EventSettings event={event} planSlug={plan.slug} />
                    }
                    // PESTAÑA 2: Participantes
                    participants={
                        <div className="max-w-7xl tour-participants-section">
                            <div className="mb-6 flex gap-2 items-center">
                                <UsersRound className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-bold">
                                    Participantes del Evento
                                </h2>
                            </div>
                            <ParticipantList
                                initialData={event.participants}
                                eventId={event.id}
                                planSlug={plan.slug}
                            />
                        </div>
                    }
                    // PESTAÑA 3: Encuestas
                    polls={
                        <div className="max-w-7xl tour-polls-section">
                            <div className="mb-6 flex gap-2 items-center">
                                <Folders className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-bold">
                                    Categorías del Evento
                                </h2>
                            </div>
                            <PollList
                                initialPolls={event.polls}
                                allParticipants={event.participants}
                                eventId={event.id}
                                planSlug={plan.slug}
                            />
                        </div>
                    }
                    // PESTAÑA 4: Estadísticas
                    stats={
                        <EventStatistics
                            stats={stats}
                            planSlug={plan.slug}
                            isAdmin={isAdmin}
                        />
                    }
                />
            </div>
        </main>
    );
}