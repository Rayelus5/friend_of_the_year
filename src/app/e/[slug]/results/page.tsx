import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import GlobalResultsClient from "@/components/GlobalResultsClient";

type Props = {
    params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic";

export default async function EventGalaPage({ params }: Props) {
    const { slug } = await params;

    // 1. Buscar el evento y sus encuestas
    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            polls: {
                where: { isPublished: true },
                orderBy: { order: 'asc' },
                select: { id: true, title: true }
            }
        }
    });

    if (!event) notFound();

    // 2. SEGURIDAD: Comprobar la fecha DE ESTE EVENTO
    const galaDate = event.galaDate || new Date('2030-01-01');
    const now = new Date();

    // Si intentan entrar antes de tiempo, los mandamos al Lobby del evento
    if (now < galaDate) {
        redirect(`/e/${slug}`);
    }

    // 3. Renderizar Cliente (Reutilizamos tu componente visual)
    // Le pasamos también el slug para que el botón "Volver" sepa a dónde ir
    return <GlobalResultsClient polls={event.polls} eventSlug={slug} />;
}