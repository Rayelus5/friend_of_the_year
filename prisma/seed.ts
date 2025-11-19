// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando Seed...');

    // 1. Limpiar DB (Opcional, por seguridad en dev)
    await prisma.voteOption.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.option.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.participant.deleteMany();

    // 2. Crear Amigos (Participantes)
    // ¡Sustituye esto con los nombres reales de tus amigos!
    const p1 = await prisma.participant.create({ data: { name: 'Alejandro', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alejandro' } });
    const p2 = await prisma.participant.create({ data: { name: 'Sofía', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia' } });
    const p3 = await prisma.participant.create({ data: { name: 'Carlos', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos' } });
    const p4 = await prisma.participant.create({ data: { name: 'Lucía', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia' } });

    console.log('✅ Amigos creados');

    // 3. Crear Encuesta 1: El más tardón
    const poll1 = await prisma.poll.create({
        data: {
            title: 'Categoría: El Reloj Roto',
            description: 'Premio al amigo que nunca llega a su hora, ni aunque su vida dependa de ello.',
            votingType: 'SINGLE',
            endAt: new Date('2025-12-31'), // Futuro
            isPublished: true,
            options: {
                create: [
                    { participantId: p1.id, subtitle: 'Su "estoy llegando" significa 30 min' },
                    { participantId: p2.id, subtitle: 'Vive en otro huso horario' },
                    { participantId: p3.id, subtitle: 'Se duerme en la ducha' },
                ]
            }
        }
    });

    // 4. Crear Encuesta 2: El más fiestero
    const poll2 = await prisma.poll.create({
        data: {
            title: 'Categoría: Animal Nocturno',
            description: '¿Quién cierra siempre el bar?',
            votingType: 'SINGLE',
            endAt: new Date('2025-12-31'),
            isPublished: true,
            options: {
                create: [
                    { participantId: p2.id },
                    { participantId: p3.id },
                    { participantId: p4.id },
                ]
            }
        }
    });

    console.log('✅ Encuestas creadas');
    console.log('🚀 Seed completado con éxito');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });