import RegisterForm from '@/components/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden selection:bg-blue-500/30 pt-5 pb-5">

            {/* Fondo Ambiental */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-8 relative z-10">

                {/* Header Card */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-6 group">
                        <div className="flex items-center gap-2 text-blue-500 font-mono text-xs tracking-[0.2em] uppercase group-hover:text-blue-400 transition-colors">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Volver al inicio
                        </div>
                    </Link>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Crea tu cuenta</h1>
                    <p className="text-gray-400">Únete para organizar tus propios eventos digitales en Pollnow.</p>
                </div>

                <div className="bg-neutral-900/50 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl hover:border-blue-500/30 hover:shadow-blue-400/20 hover:shadow-[0_0_100px] transition-all duration-500">
                    <RegisterForm />
                </div>

                <p className="text-center text-gray-500 text-sm mt-8">
                    ¿Ya tienes cuenta? <Link href="/login" className="text-blue-500 hover:underline">Iniciar sesión</Link>
                </p>

            </div>
        </main>
    );
}