import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginForm from '@/components/LoginForm';
import GoogleForm from '@/components/GoogleForm';
import Link from 'next/link';

export default async function LoginPage() {
    const session = await auth();

    // Si ya hay usuario logueado -> redirigir a /logout
    if (session?.user) {
        redirect("/logout");
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden selection:bg-blue-500/30">

            {/* Fondo Ambiental */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-sky-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-xl p-8 relative z-10">

                {/* Header Card */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-6 group">
                        <div className="flex items-center gap-2 text-blue-500 font-mono text-xs tracking-[0.2em] uppercase group-hover:text-blue-400 transition-colors">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Volver al inicio
                        </div>
                    </Link>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Bienvenido de nuevo</h1>
                    <p className="text-gray-400">Introduce tus credenciales para gestionar tus eventos digitales en Pollnow.</p>
                </div>

                {/* Formulario */}
                <div className="bg-neutral-900/50 border-2 border-white/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl hover:border-blue-500/30 hover:shadow-blue-400/20 hover:shadow-[0_0_100px] transition-all duration-500">
                    <LoginForm />

                    {/* Separador (para futuro Google Login) */}
                    <div className="my-4 flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-gray-500 text-xs uppercase">O continúa con</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    {/* Botón Google */}
                    <GoogleForm />
                </div>

                <p className="text-center text-gray-500 text-sm mt-8">
                    ¿No tienes cuenta? <Link href="/register" className="text-blue-500 hover:underline">Regístrate aquí</Link>
                </p>

                <p className="text-center text-gray-500 text-sm mt-8 opacity-70">
                    Al registrarte o iniciar sesión en nuestra plataforma aceptas nuestros <Link href="/legal/terms" className="text-blue-500 hover:underline">T&eacute;rminos y Condiciones</Link> y nuestra <Link href="/legal/privacy" className="text-blue-500 hover:underline">Política de Privacidad</Link>.
                </p>
            </div>
        </main>
    );
}