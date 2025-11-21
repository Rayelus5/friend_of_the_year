'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { redirect } from "next/navigation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

function getBaseUrl() {
    // 1. Prioridad: Variable manual definida en Vercel
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    // 2. Fallback: Vercel URL automática (a veces falla en redirects externos)
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    // 3. Localhost
    return 'http://localhost:3000';
}

export async function createCheckoutSession(priceId: string) {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) return { error: "No autorizado" };

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    let customerId = user?.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: session.user.email,
            name: session.user.name || undefined,
            metadata: { userId: session.user.id }
        });
        customerId = customer.id;
        await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
    }

    const BASE_URL = getBaseUrl();

    try {
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${BASE_URL}/dashboard/profile?success=true`,
            cancel_url: `${BASE_URL}/premium?canceled=true`,
            metadata: { userId: session.user.id }
        });

        if (checkoutSession.url) redirect(checkoutSession.url);
    } catch (error: any) {
        // Si es un redirect de Next.js, déjalo pasar
        if (error.message?.includes("NEXT_REDIRECT")) throw error;
        console.error(error);
        return { error: "Error al conectar con Stripe" };
    }
}

export async function createCustomerPortalSession() {
    const session = await auth();
    if (!session?.user?.id) return;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.stripeCustomerId) return;

    const BASE_URL = getBaseUrl();

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${BASE_URL}/dashboard/profile`,
    });

    redirect(portalSession.url);
}