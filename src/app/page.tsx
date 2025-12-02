import LandingClient from "@/components/home/LandingClient";
import { auth } from "@/auth";
import { getCurrentUserPlan } from "@/lib/user-plan";

export default async function LandingPage() {
    const session = await auth();
    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium"; // solo UNLIMITED NO ven anuncios
    return (
        <main className="bg-black min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
            <LandingClient session={session} showAds={showAds} />
        </main>
    );
}