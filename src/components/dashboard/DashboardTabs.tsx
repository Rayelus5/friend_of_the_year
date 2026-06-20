"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { clsx } from "clsx";
import { getPusherClient, userChannel, PUSHER_EVENTS } from "@/lib/pusher";
import CreateEventButton from "@/components/dashboard/CreateEventButton";
import CreateTicketButton from "@/components/dashboard/CreateTicketButton";
import DashboardEventCard from "@/components/dashboard/DashboardEventCard";
import {
    markAllUserNotificationsRead,
    markUserNotificationRead,
} from "@/app/lib/user-notification-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { BookCheck, Users, Mail, ChevronLeft, ChevronRight, Lock, CheckCircle2, MessagesSquare, Bell, BellOff, Info } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ProfileForm from "@/components/dashboard/ProfileForm";
import PhoneBizumCard from "@/components/dashboard/PhoneBizumCard";
import IngresosTab, { type PaymentRow, type WithdrawalRow } from "@/components/dashboard/IngresosTab";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import PendingInviteCard from "@/components/dashboard/PendingInviteCard";
import DashboardGuidedTour from "@/components/dashboard/DashboardGuidedTour";

type EventRow = {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    createdAt: Date;
    status: "DRAFT" | "PENDING" | "APPROVED" | "DENIED";
    mode?: "GALA" | "TIERLIST" | "PREGUNTAS" | "DIBUJO";
    _count: { polls: number; participants: number; tiers?: number; questions?: number; drawings?: number };
};

type DashboardTabsProps = {
    user: {
        id: string;
        name: string | null;
        email: string;
        username: string;
        image: string | null;
        subscriptionStatus: string | null;
        stripePriceId: string | null;
        subscriptionEndDate: Date | null;
        cancelAtPeriodEnd: boolean | null;
        stripeSubscriptionId: string | null;
        createdAt: Date;
        hasPassword: boolean;
        emailNotifications: boolean;
        emailCollaborations: boolean;
        phonePrefix: string | null;
        phoneNumber: string | null;
        currentBalance: number;
        totalEarned: number;
    };
    plan: {
        slug: string;
        name: string;
        quota: number;
        limits: {
            pollsPerEvent: number;
            participantsPerEvent: number;
            collaboratorsPerEvent: number;
        };
    };
    events: EventRow[];
    /** Eventos en los que el usuario es colaborador (no dueño) */
    sharedEvents: EventRow[];
    /** IDs de eventos propios que tienen al menos 1 colaborador */
    eventsWithCollaborators: string[];
    /** Invitaciones pendientes de responder */
    pendingInvitations: {
        invitationId: string;
        event: EventRow;
        invitedBy: { name: string; username: string; image: string | null };
    }[];
    notifications: {
        id: string;
        message: string;
        link: string | null;
        isRead: boolean;
        createdAt: Date;
        type: "SYSTEM" | "COLLABORATION";
        invitationId: string | null;
    }[];
    supportChats: {
        id: string;
        isClosed: boolean;
        createdAt: Date;
        lastMessageAt: Date;
    }[];
    payments: PaymentRow[];
    withdrawals: WithdrawalRow[];
};

type TabId = "events" | "profile" | "notifications" | "support" | "ingresos";

/* ========== CONFIG =========== */
const PAGE_SIZE = 6;

export default function DashboardTabs({
    user,
    plan,
    events,
    sharedEvents,
    eventsWithCollaborators,
    pendingInvitations,
    notifications,
    supportChats,
    payments,
    withdrawals,
}: DashboardTabsProps) {
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [pendingInviteCount, setPendingInviteCount] = useState(pendingInvitations.length);
    const router = useRouter();

    // Sincronizar badge cuando los datos del servidor se actualizan
    useEffect(() => {
        setPendingInviteCount(pendingInvitations.length);
    }, [pendingInvitations.length]);

    // Suscribirse al canal personal del usuario para notificaciones en tiempo real
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const pusher = getPusherClient();
            const ch = pusher.subscribe(userChannel(user.id));
            ch.bind(PUSHER_EVENTS.INVITATION_SENT, () => {
                setPendingInviteCount((prev) => prev + 1);
                router.refresh();
            });
        } catch {
            // Pusher no disponible
        }
        return () => {
            try { getPusherClient().unsubscribe(userChannel(user.id)); } catch { /* noop */ }
        };
    }, [user.id, router]);

    const tabs: { id: TabId; label: string; badge?: number }[] = [
        {
            id: "events",
            label: "Eventos",
            badge: pendingInviteCount || undefined,
        },
        {
            id: "notifications",
            label: "Notificaciones",
            badge: notifications.filter((n) => !n.isRead && n.type === "SYSTEM").length || undefined,
        },
        { id: "ingresos", label: "Ingresos" },
        { id: "support", label: "Soporte" },
        { id: "profile", label: "Mi Cuenta" },
    ];

    // Hooks para manejar la URL
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const initialTab = (searchParams.get("tab") as TabId) || "events";
    const [activeTab, setActiveTab] = useState<TabId>(initialTab);

    // Pagination state per tab
    const [eventsPage, setEventsPage] = useState(1);
    const [notificationsPage, setNotificationsPage] = useState(1);
    const [supportPage, setSupportPage] = useState(1);

    // Sincronizar URL hacia el estado local (por ejemplo, si el usuario navega hacia atrás)
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeTab) {
            setActiveTab(tab as TabId);
        }
    }, [searchParams]);

    // Resetear la paginación al cambiar de tab
    useEffect(() => {
        setEventsPage(1);
        setNotificationsPage(1);
        setSupportPage(1);
    }, [activeTab]);

    // NUEVA FUNCIÓN: Maneja el clic en la pestaña y actualiza la URL
    const handleTabChange = (tabId: TabId) => {
        setActiveTab(tabId); // Actualiza la UI instantáneamente

        // Construye la nueva URL
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tabId);

        // Actualiza la URL en el navegador sin hacer scroll
        // Puedes cambiar 'replace' por 'push' si quieres que cada tab genere historial de navegación
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div>
            <DashboardGuidedTour />

            {/* Tabs */}
            <div className="tour-dashboard-tabs flex border-b-2 border-white/10 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        data-tour-tab={tab.id}
                        // Usamos la nueva función en el onClick
                        onClick={() => handleTabChange(tab.id)}
                        className={clsx(
                            "relative px-5 py-3 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer",
                            activeTab === tab.id
                                ? "text-blue-500"
                                : "text-gray-400 hover:text-white"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white">
                                    {tab.badge}
                                </span>
                            )}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Contenido */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "events" && (
                    <EventsTab
                        events={events}
                        sharedEvents={sharedEvents}
                        eventsWithCollaborators={eventsWithCollaborators}
                        pendingInvitations={pendingInvitations}
                        planSlug={plan.slug}
                        user={user}
                        isCreating={isCreatingEvent}
                        onCreatingChange={setIsCreatingEvent}
                        page={eventsPage}
                        setPage={setEventsPage}
                    />
                )}

                {activeTab === "profile" && (
                    <ProfileTab user={user} plan={plan} />
                )}

                {activeTab === "ingresos" && (
                    <IngresosTab
                        hasPhone={!!user.phoneNumber}
                        phonePrefix={user.phonePrefix}
                        phoneNumber={user.phoneNumber}
                        currentBalance={user.currentBalance}
                        totalEarned={user.totalEarned}
                        payments={payments}
                        withdrawals={withdrawals}
                    />
                )}

                {activeTab === "notifications" && (
                    <NotificationsTab
                        initialNotifications={notifications}
                        page={notificationsPage}
                        setPage={setNotificationsPage}
                    />
                )}

                {activeTab === "support" && (
                    <SupportTab
                        supportChats={supportChats}
                        page={supportPage}
                        setPage={setSupportPage}
                    />
                )}
            </div>
        </div>
    );
}

// ========== TAB: EVENTOS ==========

type PendingInvite = DashboardTabsProps["pendingInvitations"][number];

type EventsTabProps = {
    events: DashboardTabsProps["events"];
    sharedEvents: DashboardTabsProps["sharedEvents"];
    eventsWithCollaborators: DashboardTabsProps["eventsWithCollaborators"];
    pendingInvitations: DashboardTabsProps["pendingInvitations"];
    planSlug: string;
    user: DashboardTabsProps["user"];
    isCreating: boolean;
    onCreatingChange: (v: boolean) => void;
    page: number;
    setPage: (n: number) => void;
};

function EventsTab({
    events,
    sharedEvents,
    eventsWithCollaborators,
    pendingInvitations: initialPending,
    planSlug,
    user,
    isCreating,
    onCreatingChange,
    page,
    setPage,
}: EventsTabProps) {
    const router = useRouter();
    const [pending, setPending] = useState<PendingInvite[]>(initialPending);

    const total = events.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const paged = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return events.slice(start, start + PAGE_SIZE);
    }, [events, page]);

    const collaboratorSet = useMemo(() => new Set(eventsWithCollaborators), [eventsWithCollaborators]);

    const handleAccepted = (invitationId: string) => {
        setPending((prev) => prev.filter((i) => i.invitationId !== invitationId));
        // Refrescar datos del servidor para que el evento aparezca en sharedEvents
        router.refresh();
    };

    const handleRejected = (invitationId: string) => {
        setPending((prev) => prev.filter((i) => i.invitationId !== invitationId));
    };

    return (
        <section className="tour-events-section">
            {/* Invitaciones pendientes */}
            {pending.length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-bold text-white">Invitaciones pendientes</h3>
                        <span className="ml-1 inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold">
                            {pending.length}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-5">
                        Te han invitado a colaborar en estos eventos. Acepta o rechaza la invitación.
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pending.map((inv) => (
                            <PendingInviteCard
                                key={inv.invitationId}
                                invitationId={inv.invitationId}
                                event={inv.event}
                                invitedBy={inv.invitedBy}
                                onAccepted={() => handleAccepted(inv.invitationId)}
                                onRejected={() => handleRejected(inv.invitationId)}
                            />
                        ))}
                    </div>
                    <div className="border-b-2 border-white/8 mt-10" />
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Mis Eventos</h2>
                    <p className="text-gray-400 text-sm">
                        Gestiona tus galas y entregas de premios.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {isCreating && (
                        <div className="flex items-center gap-2 text-xs text-blue-300">
                            <span className="inline-block w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                            Creando tu evento...
                        </div>
                    )}
                    <CreateEventButton
                        planSlug={planSlug}
                        user={user}
                        onCreatingChange={onCreatingChange}
                    />
                </div>
            </div>

            <div
                className={clsx(
                    "grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity",
                    isCreating && "opacity-60 pointer-events-none"
                )}
            >
                {paged.map((event) => (
                    <DashboardEventCard
                        key={event.id}
                        event={event}
                        hasCollaborators={collaboratorSet.has(event.id)}
                    />
                ))}

                {events.length === 0 && (
                    <div className="col-span-full py-16 border-2 border-dashed border-white/10 rounded-2xl text-center">
                        <p className="text-gray-500 mb-2">No tienes eventos activos.</p>
                        <p className="text-sm text-gray-600">¡Crea el primero para empezar la gala!</p>
                    </div>
                )}
            </div>

            {total > PAGE_SIZE && (
                <Pagination className="mt-8" page={page} setPage={setPage} totalPages={totalPages} total={total} itemLabel="eventos" />
            )}

            {/* Eventos compartidos (invitaciones aceptadas) */}
            {sharedEvents.length > 0 && (
                <div className="mt-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-bold text-white">Eventos en los que colaboras</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        Eventos de otros usuarios donde has sido invitado como colaborador.
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sharedEvents.map((event) => (
                            <DashboardEventCard key={event.id} event={event} isShared />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

// ========== TAB: PERFIL ==========

function ProfileTab({
    user,
    plan,
}: {
    user: DashboardTabsProps["user"];
    plan: DashboardTabsProps["plan"];
}) {
    const profileUserData = {
        name: user.name,
        username: user.username,
        image: user.image,
        email: user.email,
        hasPassword: user.hasPassword,
        emailNotifications: user.emailNotifications,
        emailCollaborations: user.emailCollaborations,
    };

    const subData = {
        subscriptionStatus: user.subscriptionStatus,
        stripePriceId: user.stripePriceId,
        subscriptionEndDate: user.subscriptionEndDate,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        stripeSubscriptionId: user.stripeSubscriptionId,
    };

    return (
        <section className="max-w-7xl space-y-8">
            {/* TARJETA DE SUSCRIPCIÓN */}
            <SubscriptionCard user={subData} plan={plan} />

            {/* FORMULARIOS DE PERFIL */}
            <ProfileForm user={profileUserData} />

            {/* TELÉFONO PARA BIZUM */}
            <PhoneBizumCard initialPrefix={user.phonePrefix} initialNumber={user.phoneNumber} />
        </section>
    );
}

// ========== TAB: NOTIFICACIONES ==========

function NotificationsTab({
    initialNotifications,
    page,
    setPage,
}: {
    initialNotifications: DashboardTabsProps["notifications"];
    page: number;
    setPage: (n: number) => void;
}) {
    const notifications = initialNotifications;

    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const paged = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return notifications.slice(start, start + PAGE_SIZE);
    }, [notifications, page]);

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <BellOff className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Todo al día</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">No tienes notificaciones por ahora. Te avisaremos cuando haya novedades.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        Mis Notificaciones
                        {unread > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">{unread}</span>
                        )}
                    </h2>
                    <p className="text-gray-400 text-sm">Revisa tus notificaciones y actualizaciones.</p>
                </div>
                {unread > 0 && (
                    <div className="flex justify-end">
                        <form action={markAllUserNotificationsRead}>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 cursor-pointer"
                            >
                                <BookCheck size={20} /> Marcar todas como leídas
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <ul className="space-y-3">
                {paged.map((n) => {
                    const isCollaboration = n.type === "COLLABORATION";
                    const accent = isCollaboration
                        ? { text: "text-amber-400", iconBg: "bg-amber-500/10", border: "border-amber-500/30", tint: "bg-amber-500/[0.04]", dot: "bg-amber-400", label: "Invitación de colaboración", Icon: Users }
                        : { text: "text-blue-400", iconBg: "bg-blue-500/10", border: "border-blue-500/40", tint: "bg-blue-500/[0.04]", dot: "bg-blue-400", label: "Sistema", Icon: Info };
                    const Icon = accent.Icon;

                    return (
                        <li
                            key={n.id}
                            className={clsx(
                                "flex gap-4 p-4 rounded-2xl border-2 transition-colors",
                                n.isRead ? "border-white/10 bg-neutral-900/40" : `${accent.border} ${accent.tint}`
                            )}
                        >
                            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", n.isRead ? "bg-white/5 text-gray-500" : `${accent.iconBg} ${accent.text}`)}>
                                <Icon size={18} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={clsx("text-[10px] font-bold uppercase tracking-wider", n.isRead ? "text-gray-500" : accent.text)}>
                                        {accent.label}
                                    </span>
                                    {!n.isRead && <span className={clsx("w-2 h-2 rounded-full", accent.dot)} />}
                                </div>
                                <p className={clsx("text-sm leading-relaxed", n.isRead ? "text-gray-400" : "text-gray-100")}>{n.message}</p>
                                <p className="text-[11px] text-gray-500 mt-1.5">
                                    {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: es })}
                                </p>

                                <div className="mt-3 flex items-center gap-3 flex-wrap">
                                    {isCollaboration && !n.isRead && (
                                        <a
                                            href="/dashboard?tab=events"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                                        >
                                            <Mail size={13} /> Ver en Mis Eventos
                                        </a>
                                    )}
                                    {isCollaboration && n.isRead && (
                                        <span className="text-[11px] text-gray-600">Ya respondida</span>
                                    )}
                                    {!isCollaboration && n.link && (
                                        <a href={n.link} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                                            <ChevronRight size={13} /> Ver detalle
                                        </a>
                                    )}
                                    {!isCollaboration && !n.isRead && (
                                        <form action={markUserNotificationRead.bind(null, n.id)}>
                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-200 border-2 border-white/10 cursor-pointer transition-colors"
                                            >
                                                <BookCheck size={12} /> Marcar como leída
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {total > PAGE_SIZE && (
                <Pagination className="mt-6" page={page} setPage={setPage} totalPages={totalPages} total={total} itemLabel="notificaciones" />
            )}
        </div>
    );
}

// ========== TAB: SOPORTE ==========

function SupportTab({
    supportChats,
    page,
    setPage,
}: {
    supportChats: DashboardTabsProps["supportChats"];
    page: number;
    setPage: (n: number) => void;
}) {
    if (supportChats.length === 0) {
        return (
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Chats de Soporte</h2>
                        <p className="text-gray-400 text-sm">
                            Contacta con nosotros si necesitas ayuda.
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <CreateTicketButton />
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                        <MessagesSquare className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">No tienes tickets abiertos</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">Crea uno nuevo si necesitas ayuda; el equipo te responderá por aquí.</p>
                </div>
            </section>
        );
    }

    const total = supportChats.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const paged = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return supportChats.slice(start, start + PAGE_SIZE);
    }, [supportChats, page]);

    return (
        <section className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Chats de Soporte</h2>
                    <p className="text-gray-400 text-sm">
                        Contacta con nosotros si necesitas ayuda.
                    </p>
                </div>
                <div className="flex justify-end">
                    <CreateTicketButton />
                </div>
            </div>

            <div className="space-y-3">
                {paged.map((chat) => (
                    <a
                        key={chat.id}
                        href={`/dashboard/support/${chat.id}`}
                        className="group flex items-center gap-4 p-4 rounded-2xl border-2 border-white/10 bg-neutral-900/60 hover:border-blue-500/40 hover:bg-neutral-900 transition-colors cursor-pointer"
                    >
                        <Avatar name="Soporte" variant="support" size="lg" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                    Ticket #{chat.id.slice(0, 8)}
                                </span>
                                <span
                                    className={clsx(
                                        "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border-2 font-bold",
                                        chat.isClosed
                                            ? "border-red-500/30 text-red-400 bg-red-500/10"
                                            : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                    )}
                                >
                                    {chat.isClosed ? <Lock size={10} /> : <CheckCircle2 size={10} />}
                                    {chat.isClosed ? "Cerrado" : "Abierto"}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                Último mensaje{" "}
                                {formatDistanceToNow(chat.lastMessageAt, { addSuffix: true, locale: es })}
                            </p>
                        </div>
                        <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors shrink-0" />
                    </a>
                ))}
            </div>

            {/* PAGINADOR */}
            {total > PAGE_SIZE && (
                <Pagination
                    className="mt-6"
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                    total={total}
                    itemLabel="tickets"
                />
            )}
        </section>
    );
}

/* =======================
   Reusable Pagination UI
   (mismo estilo que el explorador de /polls)
   ======================= */
function Pagination({
    page,
    setPage,
    totalPages,
    total,
    itemLabel,
    className,
}: {
    page: number;
    setPage: (n: number) => void;
    totalPages: number;
    total?: number;
    itemLabel?: string;
    className?: string;
}) {
    const prev = () => setPage(Math.max(1, page - 1));
    const next = () => setPage(Math.min(totalPages, page + 1));

    const pillClass =
        "flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-white/10 bg-white/5 text-sm font-semibold text-gray-400 hover:border-white/25 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer";

    return (
        <div className={clsx("flex flex-col items-center gap-4", className)}>
            <p className="text-xs text-gray-600 font-mono">
                Página {page} de {totalPages}
                {typeof total === "number" && itemLabel ? ` · ${total} ${itemLabel}` : ""}
            </p>
            <div className="flex items-center gap-2">
                {/* Anterior */}
                <button onClick={prev} disabled={page <= 1} className={pillClass}>
                    <ChevronLeft size={15} />
                    Anterior
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                    {getPageNumbers(page, totalPages).map((p, i) =>
                        p === "..." ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-sm select-none">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => setPage(p as number)}
                                className={clsx(
                                    "w-9 h-9 rounded-full text-sm font-bold transition-all cursor-pointer",
                                    page === p
                                        ? "bg-blue-600 text-white border-2 border-blue-500 shadow-lg shadow-blue-900/30"
                                        : "border-2 border-white/10 bg-white/5 text-gray-400 hover:border-white/25 hover:text-white"
                                )}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                {/* Siguiente */}
                <button onClick={next} disabled={page >= totalPages} className={pillClass}>
                    Siguiente
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
    );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | "...")[] = [1];

    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push("...");

    pages.push(total);
    return pages;
}