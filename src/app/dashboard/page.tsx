import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPlanFromUser } from "@/lib/plans";
import DashboardTabs from "@/components/dashboard/DashboardTabs";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) redirect("/login");

    const plan = getPlanFromUser(user);

    const [events, notifications, supportChats] = await Promise.all([
        prisma.event.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { polls: true, participants: true } },
            },
        }),
        prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        }),
        prisma.supportChat.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    // Adaptamos el usuario de Prisma al shape que espera DashboardTabs
    const dashboardUser = {
        id: user.id,
        name: user.name,
        email: user.email!, // en tu modelo probablemente es NOT NULL
        username: user.username || "", // por si es null en la BD
        image: user.image,
        subscriptionStatus: user.subscriptionStatus,
        stripePriceId: user.stripePriceId,
        subscriptionEndDate: user.subscriptionEndDate,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        createdAt: user.createdAt,
        hasPassword: !!user.passwordHash,
    };

    return (
        <main className="min-h-screen bg-black text-white px-6 md:px-12 py-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Panel de control</h1>
                    <p className="text-gray-400 text-sm">
                        Gestiona tu perfil, tus eventos y la comunicación con el equipo.
                    </p>
                </header>

                <DashboardTabs
                    user={dashboardUser}
                    plan={plan}
                    events={events}
                    notifications={notifications}
                    supportChats={supportChats}
                />
            </div>
        </main>
    );
}