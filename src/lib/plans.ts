export const PLANS = {
    FREE: {
        name: "Free",
        slug: "free",
        quota: 1,
        limits: {
            pollsPerEvent: 5,
            participantsPerEvent: 12
        },
        price: 0,
    },
    PREMIUM: {
        name: "Premium",
        slug: "premium",
        quota: 5,
        limits: {
            pollsPerEvent: 10,
            participantsPerEvent: 30
        },
        price: 4.99,
        priceId: "price_1SVz0lAnnRNk3k0PSEZ15Dr0", // Pon aquí el ID real de Stripe cuando lo crees
    },
    PLUS: {
        name: "Unlimited",
        slug: "plus",
        quota: 9999, // Infinito a efectos prácticos
        limits: {
            pollsPerEvent: 30,
            participantsPerEvent: 150
        },
        price: 12.99,
        priceId: "price_1SVz24AnnRNk3k0PvSjAEVQA",
    },
};

export function getPlanFromUser(user: { subscriptionStatus: string | null; stripePriceId: string | null }) {
    // Si la suscripción no está activa, es FREE
    if (user.subscriptionStatus !== 'active') return PLANS.FREE;

    // Si es activa, miramos qué precio está pagando
    if (user.stripePriceId === PLANS.PLUS.priceId) return PLANS.PLUS;
    if (user.stripePriceId === PLANS.PREMIUM.priceId) return PLANS.PREMIUM;

    return PLANS.FREE;
}