// src/lib/user-plan.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser, PLANS } from "@/lib/plans";

export async function getCurrentUserPlan() {
    const session = await auth();

    if (!session?.user?.id) {
        // Visitante no logueado = FREE (ve anuncios)
        return PLANS.FREE;
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            subscriptionStatus: true,
            stripePriceId: true,
        },
    });

    if (!user) return PLANS.FREE;

    return getPlanFromUser(user);
}
