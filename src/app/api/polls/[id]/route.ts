import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

type Props = {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
    try {
        const { id } = await params;

        // 1. Identificar usuario
        const cookieStore = await cookies();
        const voterId = cookieStore.get('foty_voter_id')?.value;

        const poll = await prisma.poll.findUnique({
            where: { id },
            include: {
                options: {
                    orderBy: { order: 'asc' },
                    include: { participant: true }
                },
            },
        });

        if (!poll) {
            return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
        }

        // 2. Comprobar si ha votado
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

        // 3. Formatear respuesta incluyendo 'hasVoted'
        const formattedPoll = {
            ...poll,
            hasVoted, // <--- Nuevo campo
            options: poll.options.map(opt => ({
                id: opt.id,
                name: opt.participant.name,
                imageUrl: opt.participant.imageUrl,
                subtitle: opt.subtitle,
                participantId: opt.participantId
            }))
        };

        return NextResponse.json(formattedPoll);

    } catch (error) {
        console.error("❌ ERROR EN API:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}