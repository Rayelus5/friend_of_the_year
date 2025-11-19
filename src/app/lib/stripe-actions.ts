'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { redirect } from "next/navigation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

// --- CHECKOUT (SUSCRIBIRSE) ---
export async function createCheckoutSession(priceId: string) {
    const session = await auth();

    if (!session?.user?.email) {
        throw new Error("Debes iniciar sesión");
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    let stripeCustomerId = user?.stripeCustomerId;

    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: session.user.email,
            name: session.user.name || undefined,
            metadata: { userId: session.user.id }
        });
        stripeCustomerId = customer.id;

        await prisma.user.update({
            where: { id: session.user.id },
            data: { stripeCustomerId }
        });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium?canceled=true`,
        metadata: { userId: session.user.id }
    });

    return checkoutSession.url;
}

// --- PORTAL (GESTIONAR / CANCELAR) ---
export async function createCustomerPortalSession() {
    const session = await auth();
    if (!session?.user?.id) return;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user?.stripeCustomerId) {
        throw new Error("No tienes una suscripción activa para gestionar.");
    }

    // Crear sesión del portal de facturación
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium`,
    });

    return portalSession.url;
}