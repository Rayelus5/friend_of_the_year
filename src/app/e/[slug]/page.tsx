import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import HomeHero from "@/components/HomeHero";
import { Lock } from "lucide-react"; // Necesitarás importar iconos si usas la UI de bloqueo
import { auth } from "@/auth";
import { getCurrentUserPlan } from "@/lib/user-plan";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ key?: string }>; // Capturamos query params
}

export const dynamic = "force-dynamic";

export default async function EventLobbyPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { key } = await searchParams;

    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            polls: {
                where: { isPublished: true },
                orderBy: { order: 'asc' },
                take: 1,
                select: { id: true }
            }
        }
    });

    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium"; // solo UNLIMITED NO ven anuncios

    if (!event) notFound();

    // --- LÓGICA DE SEGURIDAD ---
    // Si es privado Y la clave no coincide...
    if (!event.isPublic && event.accessKey !== key) {
        return (
            <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center selection:bg-red-500/30">
                <div className="bg-neutral-900/50 border border-red-500/20 p-10 rounded-3xl backdrop-blur-md max-w-md w-full">
                    <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Evento Privado</h1>
                    <p className="text-gray-400 mb-6">
                        Necesitas un enlace de invitación válido para acceder a esta gala.
                    </p>
                    <div className="text-xs text-gray-600 font-mono">
                        Error: Invalid Access Key
                    </div>
                </div>
            </main>
        );
    }
    // ---------------------------

    const galaDate = event.galaDate || new Date('2030-01-01');
    const now = new Date();
    const isGalaTime = now >= galaDate;
    const firstPollId = event.polls[0]?.id;

    const session = await auth();
    if (!session?.user) return null;

    return (
        <HomeHero
            firstPollId={firstPollId}
            isGalaTime={isGalaTime}
            galaDate={galaDate}
            title={event.title}
            description={event.description || ""}
            eventId={event.id}
            slug={event.slug}
            showAds={showAds}
        />
    );
}