import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { auth } from "@/auth"; // <--- Importar auth

type Props = {
    params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: Props) {
    try {
        const { id: pollId } = await params;
        const body = await req.json();
        const { optionIds } = body;

        // 1. Identificación (Híbrida: Cookie + Sesión)
        const cookieStore = await cookies();
        const voterId = cookieStore.get('voter_id')?.value;

        // Intentamos obtener sesión de usuario real
        const session = await auth();
        const userId = session?.user?.id;

        if (!voterId) {
            return NextResponse.json({ error: 'No se pudo identificar la sesión' }, { status: 400 });
        }

        // 2. Validar si YA votó
        const existingVote = await prisma.vote.findUnique({
            where: {
                pollId_voterHash: {
                    pollId: pollId,
                    voterHash: voterId
                }
            }
        });

        if (existingVote) {
            return NextResponse.json({ error: 'Ya has votado en esta categoría' }, { status: 403 });
        }

        // ... (Validaciones de Poll, Fechas, etc. se mantienen igual) ...
        const poll = await prisma.poll.findUnique({ where: { id: pollId } });
        if (!poll) return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 });

        // 3. Guardar Voto (AHORA CON USERID SI EXISTE)
        await prisma.$transaction(async (tx) => {
            const vote = await tx.vote.create({
                data: {
                    pollId,
                    voterHash: voterId,
                    userId: userId || null, // <--- Guardamos la identidad real si existe
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

    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ya has votado en esta categoría' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}