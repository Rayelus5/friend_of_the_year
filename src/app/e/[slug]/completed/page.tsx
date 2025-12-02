import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CompletedView from "@/components/CompletedView";
import { auth } from "@/auth";
import { getCurrentUserPlan } from "@/lib/user-plan";

type Props = {
    params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic";

export default async function EventCompletedPage({ params }: Props) {
    const { slug } = await params;

    const session = await auth();
    if (!session?.user) return null;

    // Buscar evento para obtener su fecha
    const event = await prisma.event.findUnique({
        where: { slug },
        select: { galaDate: true, slug: true }
    });

    if (!event) notFound();

    // Si no hay fecha configurada, usamos una por defecto lejana
    const galaDate = event.galaDate || new Date('2030-01-01');

    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium"; // solo UNLIMITED NO ven anuncios

    return <CompletedView targetDate={galaDate} eventSlug={event.slug} showAds={showAds} />;
}