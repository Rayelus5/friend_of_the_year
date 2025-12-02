import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VotingForm from "@/components/VotingForm";
import { cookies } from 'next/headers';
import { getCurrentUserPlan } from "@/lib/user-plan";

type Props = {
    params: Promise<{ id: string }>
}

export default async function PollPage({ params }: Props) {
    const { id } = await params;
    const cookieStore = await cookies();
    const voterId = cookieStore.get('foty_voter_id')?.value;

    // 1. Buscar encuesta actual y su evento
    const poll = await prisma.poll.findUnique({
        where: { id },
        include: {
            options: {
                orderBy: { order: 'asc' },
                include: { participant: true }
            },
            event: { select: { id: true, slug: true } } // Necesitamos el ID del evento padre
        },
    });

    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium"; // solo UNLIMITED NO ven anuncios

    if (!poll) notFound();

    // 2. Buscar si YA VOTÓ
    let hasVoted = false;
    let initialSelectedOptions: string[] = [];

    if (voterId) {
        const vote = await prisma.vote.findUnique({
            where: {
                pollId_voterHash: {
                    pollId: id,
                    voterHash: voterId
                }
            },
            include: { voteOptions: true }
        });

        if (vote) {
            hasVoted = true;
            initialSelectedOptions = vote.voteOptions.map(vo => vo.optionId);
        }
    }

    // 3. CRITICAL FIX: Buscar Siguiente del MISMO EVENTO
    const nextPoll = await prisma.poll.findFirst({
        where: {
            eventId: poll.event.id, // <--- ESTA LÍNEA EVITA QUE SALTES A OTROS EVENTOS
            isPublished: true,
            order: { gt: poll.order }
        },
        orderBy: { order: 'asc' },
        select: { id: true }
    });

    const formattedPoll = {
        ...poll,
        options: poll.options.map(opt => ({
            id: opt.id,
            name: opt.participant.name,
            imageUrl: opt.participant.imageUrl,
            subtitle: opt.subtitle,
        }))
    };

    return (
        <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            <VotingForm
                poll={formattedPoll}
                nextPollId={nextPoll?.id || null}
                initialHasVoted={hasVoted}
                initialSelected={initialSelectedOptions}
                eventSlug={poll.event.slug}
                showAds={showAds}
            />
        </main>
    );
}