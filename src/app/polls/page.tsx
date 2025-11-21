import { prisma } from "@/lib/prisma";
import ExploreClient from "@/components/polls/ExploreClient"; // <--- Importamos el nuevo cliente
import { auth } from "@/auth";

type Props = {
    searchParams?: Promise<{
        q?: string;
        tag?: string;
    }>;
};

export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }: Props) {
    const params = await searchParams;
    const query = params?.q || "";
    const session = await auth();
    if (!session?.user) return null;

    // Consulta a la DB
    const events = await prisma.event.findMany({
        where: {
            isPublic: true,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { tags: { has: query } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { name: true, username: true, image: true } },
            _count: { select: { participants: true, polls: true } }
        }
    });

    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-24 px-6 relative overflow-hidden selection:bg-blue-500/30">

            {/* Fondo Ambiental Global (Estilo Apple Dark) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-blue-900/10 rounded-[100%] blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-900/10 rounded-[100%] blur-[120px] pointer-events-none z-0" />

            {/* Renderizado del Cliente */}
            <ExploreClient events={events} />

        </main>
    );
}