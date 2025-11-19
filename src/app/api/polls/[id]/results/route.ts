// app/api/polls/[id]/results/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateResults } from '@/lib/countResults';

export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
    try {
        const { id } = await params;

        const poll = await prisma.poll.findUnique({
            where: { id },
            include: {
                // Incluimos participante dentro de opciones
                options: { include: { participant: true } },
                votes: { include: { voteOptions: true } },
            },
        });

        if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

        const allVoteOptions = poll.votes.flatMap((v) => v.voteOptions);

        // Preparamos las opciones con el formato que espera 'calculateResults'
        const optionsForCalc = poll.options.map(o => ({
            id: o.id,
            name: o.participant.name // Mapeamos nombre desde Participant
        }));

        const results = calculateResults(optionsForCalc, allVoteOptions);

        return NextResponse.json({
            pollTitle: poll.title,
            results,
            totalVotes: poll.votes.length,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}