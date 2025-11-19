// app/polls/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VotingForm from "@/components/VotingForm";
import { cookies } from 'next/headers'; // Necesario para leer cookie

type Props = {
    params: Promise<{ id: string }>
}

export default async function PollPage({ params }: Props) {
    const { id } = await params;
    const cookieStore = await cookies();
    const voterId = cookieStore.get('foty_voter_id')?.value;

    // 1. Buscar encuesta
    const poll = await prisma.poll.findUnique({
        where: { id },
        include: {
            options: {
                orderBy: { order: 'asc' },
                include: { participant: true }
            }
        },
    });

    if (!poll) notFound();

    // 2. Buscar si YA VOTÓ
    let hasVoted = false;
    if (voterId) {
        const vote = await prisma.vote.findUnique({
            where: {
                pollId_voterHash: {
                    pollId: id,
                    voterHash: voterId
                }
            }
        });
        hasVoted = !!vote;
    }

    // 3. Buscar Siguiente
    const nextPoll = await prisma.poll.findFirst({
        where: {
            isPublished: true,
            createdAt: { gt: poll.createdAt }
        },
        orderBy: { createdAt: 'asc' },
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
        <main className="min-h-screen bg-black text-white selection:bg-amber-500/30">
            <VotingForm
                poll={formattedPoll}
                nextPollId={nextPoll?.id || null}
                initialHasVoted={hasVoted} // Pasamos el estado
            />
        </main>
    );
}