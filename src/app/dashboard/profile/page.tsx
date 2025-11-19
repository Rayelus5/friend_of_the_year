import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileForm from "@/components/dashboard/ProfileForm";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard"; // <--- Importar

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) redirect("/login");

    const userData = {
        name: user.name,
        username: user.username,
        image: user.image,
        email: user.email,
        hasPassword: !!user.passwordHash,
    };

    // Datos específicos para la tarjeta de suscripción
    const subData = {
        subscriptionStatus: user.subscriptionStatus,
        stripePriceId: user.stripePriceId,
        subscriptionEndDate: user.subscriptionEndDate
    };

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">

                <header className="mb-10">
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white mb-2 inline-block">← Volver al Dashboard</Link>
                    <h1 className="text-3xl font-bold text-white">Ajustes de Cuenta</h1>
                    <p className="text-gray-400">Gestiona tu identidad y seguridad.</p>
                </header>

                <div className="space-y-8">
                    {/* 1. TARJETA DE SUSCRIPCIÓN (NUEVO) */}
                    <SubscriptionCard user={subData} />

                    {/* 2. FORMULARIOS DE PERFIL */}
                    <ProfileForm user={userData} />
                </div>

            </div>
        </main>
    );
}