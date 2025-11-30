// src/app/logout/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { logoutUser } from "@/app/lib/auth-actions";
import Link from "next/link";

export default async function LogoutPage() {
    const session = await auth();

    // Si NO hay sesión, mandamos al login directamente
    if (!session?.user) {
        redirect("/login");
    }

    const user = session.user;

    return (
        <main className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden selection:bg-blue-500/30">

            {/* Fondos ambientales similares a login/register */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-8 relative z-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6 group">
                        <div className="flex items-center gap-2 text-blue-500 font-mono text-xs tracking-[0.2em] uppercase group-hover:text-blue-400 transition-colors">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Volver al inicio
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                        Ya tienes una sesión activa
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Estás conectado como{" "}
                        <span className="font-semibold text-white">
                            {user.username || user.email || user.name || "usuario"}
                        </span>.
                    </p>
                </div>

                {/* Tarjeta principal */}
                <div className="bg-neutral-900/60 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl space-y-6">
                    <p className="text-sm text-gray-300">
                        Para <span className="font-semibold">iniciar sesión con otra cuenta</span> o{" "}
                        <span className="font-semibold">registrar una nueva</span>, primero debes cerrar sesión.
                    </p>

                    <div className="space-y-3 text-sm text-gray-400">
                        <p>Desde aquí puedes:</p>
                        <ul className="list-disc list-inside space-y-1 text-left">
                            <li>Volver a tu panel de control actual.</li>
                            <li>Cerrar sesión para entrar con otra cuenta.</li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Link
                            href="/dashboard"
                            className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-white/5 text-gray-100 text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Volver al Dashboard
                        </Link>

                        <form action={logoutUser} className="flex-1">
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors cursor-pointer"
                            >
                                Cerrar sesión
                            </button>
                        </form>
                    </div>
                </div>

                {/* <p className="text-center text-gray-500 text-xs mt-6">
                    Una vez cierres sesión, podrás acceder de nuevo a{" "}
                    <span className="text-gray-300">/login</span> y <span className="text-gray-300">/register</span>.
                </p> */}
            </div>
        </main>
    );
}