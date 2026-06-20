import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { getPlanFromUser } from "@/lib/user-plan";
import { getEventStats, getModeStats } from "@/app/lib/stats-actions";
import { listVoteSnapshots } from "@/app/lib/snapshot-actions";
import VoteSnapshotsSection from "@/components/dashboard/VoteSnapshotsSection";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import EventTabs from "@/components/dashboard/EventTabs";
import EventSettings from "@/components/dashboard/EventSettings";
import ParticipantList from "@/components/dashboard/ParticipantList";
import PollList from "@/components/dashboard/PollList";
import EventStatistics from "@/components/dashboard/EventStatistics";
import ModeStatistics from "@/components/dashboard/ModeStatistics";
import TeamTab from "@/components/dashboard/TeamTab";
import TierlistManager from "@/components/dashboard/TierlistManager";
import QuestionManager from "@/components/dashboard/QuestionManager";
import DrawingConfig from "@/components/dashboard/DrawingConfig";
import SideRailAds from "@/components/ads/SideRailAds";
import { Folders, UsersRound, Layers, CircleHelp, Brush } from "lucide-react";
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

    // 1. Buscar evento (incluye todos los campos escalares para permisos)
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            participants: { orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }] },
            polls: {
                orderBy: { order: "asc" },
                include: {
                    _count: { select: { votes: true } },
                    options: { select: { participantId: true } },
                },
            },
            tiers: { orderBy: { order: "asc" } },
            questions: {
                orderBy: { order: "asc" },
                include: { options: { orderBy: { order: "asc" } } },
            },
        },
    });

    if (!event) notFound();

    // Estadísticas del modo DIBUJO (solo si aplica)
    const drawingStats =
        event.mode === "DIBUJO"
            ? {
                  submissions: await prisma.drawingSubmission.count({ where: { eventId: id } }),
                  reactions: await prisma.drawingReaction.count({ where: { eventId: id } }),
              }
            : { submissions: 0, reactions: 0 };

    const isOwner = event.userId === session.user.id;

    // Verificar si es colaborador (con todos los campos de permisos)
    const collaborator = !isOwner
        ? await prisma.eventCollaborator.findUnique({
              where: { eventId_userId: { eventId: id, userId: session.user.id } },
          })
        : null;

    // Acceso: dueño, admin del sistema, o colaborador
    if (!isOwner && !isAdmin && !collaborator) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border-2 border-white/10 flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-7 h-7 text-gray-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Sin acceso a este evento</h1>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                        No tienes permiso para ver este evento. Es posible que hayas sido eliminado como colaborador o que el enlace no sea válido.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/8 hover:bg-white/12 border-2 border-white/10 text-sm font-semibold text-white transition-all"
                    >
                        Volver al dashboard
                    </Link>
                </div>
            </main>
        );
    }

    // 2. Obtener usuario y plan
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });
    const plan = user ? await getPlanFromUser(user) : { slug: "free", name: "Free", limits: PLANS.FREE.limits };

    const collaboratorLimit = plan.limits.collaboratorsPerEvent;

    // 3. Calcular permisos efectivos para colaboradores
    const permissions = {
        canEditSettings: true,
        canDeleteEvent: true,
        canRegenerateKey: true,
        canManageNominees: true,
        canManagePolls: true,
        canViewStats: true,
    };

    if (!isOwner && !isAdmin && collaborator) {
        permissions.canEditSettings = collaborator.canEditSettings ?? event.defaultCanEditSettings;
        permissions.canDeleteEvent = collaborator.canDeleteEvent ?? event.defaultCanDeleteEvent;
        permissions.canRegenerateKey = collaborator.canRegenerateKey ?? event.defaultCanRegenerateKey;
        permissions.canManageNominees = collaborator.canManageNominees ?? event.defaultCanManageNominees;
        permissions.canManagePolls = collaborator.canManagePolls ?? event.defaultCanManagePolls;
        permissions.canViewStats = collaborator.canViewStats ?? event.defaultCanViewStats;
    }

    // Bloqueo de edición de contenido: mientras el evento esté publicado (APPROVED)
    // o en revisión (PENDING), nadie salvo admin puede editar nominados/categorías/
    // tiers/preguntas. Hay que volver a borrador desde Ajustes ("Quiero hacer cambios").
    const editingLocked =
        (event.status === "APPROVED" || event.status === "PENDING") && !isAdmin;
    if (editingLocked) {
        permissions.canManageNominees = false;
        permissions.canManagePolls = false;
    }

    // 4. Obtener estadísticas del evento (GALA usa el panel clásico; el resto, stats por modo)
    const isGala = event.mode === "GALA";
    // La identidad de votantes solo se adjunta si el plan lo permite (plus/unlimited o admin)
    // Y el evento NO está en modo anónimo. Coincide con el gating de EventStatistics (GALA).
    const isPlusPlan = plan.slug === "plus" || plan.slug === "unlimited";
    const canSeeVoters = (isPlusPlan || isAdmin) && !event.isAnonymousVoting;
    const showAds = plan.slug === "free" || plan.slug === "premium";
    const stats = isGala ? await getEventStats(event.id) : null;
    const modeStats = !isGala
        ? await getModeStats(event.id, event.mode as "TIERLIST" | "PREGUNTAS" | "DIBUJO", { includeVoters: canSeeVoters })
        : null;
    const snapshots = event.mode !== "DIBUJO" && permissions.canViewStats ? await listVoteSnapshots(event.id) : [];

    // Aviso reutilizable cuando el contenido está bloqueado por publicación/revisión.
    const lockedBanner = editingLocked ? (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/5">
            <Lock size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200/90 leading-relaxed">
                El evento está {event.status === "APPROVED" ? "publicado" : "en revisión"}, así que su contenido está
                bloqueado. Para editarlo, ve a <strong>Ajustes</strong> y pulsa <strong>Quiero hacer cambios</strong> para
                volver a ponerlo en borrador.
            </p>
        </div>
    ) : null;

    return (
        <main className="min-h-screen bg-black text-white">
            <header className="border-b-2 border-white/10 bg-neutral-900/30">
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
                        {/* Badge de Plan */}
                        <span
                            className={clsx(
                                "ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                plan.slug === "enterprise"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : plan.slug === "unlimited"
                                        ? "bg-purple-500/10 text-purple-400"
                                        : plan.slug === "plus"
                                            ? "bg-blue-500/10 text-blue-400"
                                            : plan.slug === "premium"
                                                ? "bg-indigo-500/10 text-indigo-400"
                                                : "bg-white/10 text-gray-400"
                            )}
                        >
                            {plan.slug === "enterprise" ? "⭐ " : ""}Plan {plan.name}
                        </span>
                        {/* Badge colaborador */}
                        {!isOwner && collaborator && (
                            <span className="ml-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-400">
                                Colaborador
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight truncate">
                        {event.title}
                    </h1>
                </div>
            </header>

            <SideRailAds showAds={showAds}>
            <div className="max-w-7xl mx-auto px-6 py-8">
                <EventTabs
                    eventId={event.id}
                    currentUserId={session.user.id}
                    mode={event.mode}
                    settings={
                        <EventSettings
                            event={event}
                            planSlug={plan.slug}
                            permissions={permissions}
                            isAdmin={isAdmin}
                        />
                    }
                    participants={
                        <div className="max-w-7xl tour-participants-section">
                            <div className="mb-6 flex gap-2 items-center">
                                <UsersRound className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-bold">
                                    {event.mode === "TIERLIST" ? "Nominados de la Tierlist" : "Participantes del Evento"}
                                </h2>
                            </div>
                            {lockedBanner}
                            <ParticipantList
                                initialData={event.participants}
                                eventId={event.id}
                                planSlug={plan.slug}
                                canManageNominees={permissions.canManageNominees}
                                square={event.mode === "TIERLIST"}
                                limitOverride={event.mode === "TIERLIST" ? plan.limits.tierlistMaxOptions : plan.limits.participantsPerEvent}
                            />
                        </div>
                    }
                    tiers={
                        <div className="max-w-7xl">
                            <div className="mb-6 flex gap-2 items-center">
                                <Layers className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-bold">Tiers de la Tierlist</h2>
                            </div>
                            {lockedBanner}
                            <TierlistManager
                                initialTiers={event.tiers}
                                eventId={event.id}
                                planSlug={plan.slug}
                                canManage={permissions.canManagePolls}
                            />
                        </div>
                    }
                    questions={
                        <div className="max-w-7xl">
                            <div className="mb-6 flex gap-2 items-center">
                                <CircleHelp className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-bold">Preguntas del Formulario</h2>
                            </div>
                            {lockedBanner}
                            <QuestionManager
                                initialQuestions={event.questions}
                                eventId={event.id}
                                planSlug={plan.slug}
                                canManage={permissions.canManagePolls}
                            />
                        </div>
                    }
                    drawing={
                        <div className="max-w-7xl">
                            <div className="mb-6 flex gap-2 items-center">
                                <Brush className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-bold">Configuración del Dibujo</h2>
                            </div>
                            <DrawingConfig
                                eventId={event.id}
                                planSlug={plan.slug}
                                drawingPrompt={event.drawingPrompt}
                                drawingDeadline={event.drawingDeadline}
                                votingDeadline={event.votingDeadline}
                                drawingTimeLimit={event.drawingTimeLimit}
                                drawingPhase={(event.drawingPhase ?? "DRAWING")}
                                stats={drawingStats}
                                canManage={permissions.canEditSettings}
                            />
                        </div>
                    }
                    polls={
                        <div className="max-w-7xl tour-polls-section">
                            <div className="mb-6 flex gap-2 items-center">
                                <Folders className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-bold">Categorías del Evento</h2>
                            </div>
                            {lockedBanner}
                            <PollList
                                initialPolls={event.polls}
                                allParticipants={event.participants}
                                eventId={event.id}
                                planSlug={plan.slug}
                                canManagePolls={permissions.canManagePolls}
                                limitOverride={plan.limits.pollsPerEvent}
                            />
                        </div>
                    }
                    stats={
                        <div className="space-y-8">
                            {isGala ? (
                                <EventStatistics
                                    stats={stats}
                                    planSlug={plan.slug}
                                    isAdmin={isAdmin}
                                    canViewStats={permissions.canViewStats}
                                />
                            ) : (
                                <ModeStatistics
                                    stats={modeStats}
                                    planSlug={plan.slug}
                                    isAdmin={isAdmin}
                                    isAnonymousVoting={event.isAnonymousVoting}
                                    canViewStats={permissions.canViewStats}
                                />
                            )}
                            {/* Ediciones guardadas: disponible en todos los modos menos DIBUJO */}
                            {event.mode !== "DIBUJO" && permissions.canViewStats && (
                                <VoteSnapshotsSection
                                    eventId={event.id}
                                    mode={event.mode as "GALA" | "TIERLIST" | "PREGUNTAS"}
                                    initialSnapshots={snapshots}
                                    canManage={isOwner || isAdmin}
                                />
                            )}
                        </div>
                    }
                    team={
                        <TeamTab
                            eventId={event.id}
                            eventTitle={event.title}
                            planSlug={plan.slug}
                            collaboratorLimit={collaboratorLimit}
                            isOwner={isOwner}
                            currentUserId={session.user.id}
                        />
                    }
                />
            </div>
            </SideRailAds>
        </main>
    );
}
