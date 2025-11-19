import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers'; // Importante

type Props = {
    params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: Props) {
    try {
        const { id: pollId } = await params;
        const body = await req.json();
        const { optionIds } = body;

        // 1. Obtener el ID del votante desde la cookie
        const cookieStore = await cookies();
        const voterId = cookieStore.get('foty_voter_id')?.value;

        if (!voterId) {
            return NextResponse.json({ error: 'No se pudo identificar la sesión' }, { status: 400 });
        }

        // 2. Validar si YA votó (Consultamos DB)
        const existingVote = await prisma.vote.findUnique({
            where: {
                pollId_voterHash: { // Esta es la clave compuesta que creamos en el Schema
                    pollId: pollId,
                    voterHash: voterId
                }
            }
        });

        if (existingVote) {
            return NextResponse.json({ error: 'Ya has votado en esta categoría' }, { status: 403 });
        }

        // ... (Aquí irían tus validaciones de fechas y opciones igual que antes) ...
        const poll = await prisma.poll.findUnique({ where: { id: pollId } });
        if (!poll) return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 });
        // (Validar fechas aquí...)

        // 3. Guardar Voto incluyendo el voterHash
        await prisma.$transaction(async (tx) => {
            const vote = await tx.vote.create({
                data: {
                    pollId,
                    voterHash: voterId, // <--- Guardamos el ID
                },
            });

            await tx.voteOption.createMany({
                data: optionIds.map((optId: string) => ({
                    voteId: vote.id,
                    optionId: optId,
                })),
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) { // Tipamos como any para acceder al code
        console.error(error);

        // Capturamos error de Prisma por si la concurrencia falló y se intentó duplicar
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ya has votado en esta categoría' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}