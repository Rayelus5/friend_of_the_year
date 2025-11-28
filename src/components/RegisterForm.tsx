'use client';

import { useActionState } from 'react'; // <--- CAMBIO: Nuevo hook de React 19/Next 15
import { registerUser } from '@/app/lib/auth-actions';
import Link from 'next/link';

export default function RegisterForm() {
    // El nuevo hook usa (action, initialState, permalink?)
    const [state, dispatch, isPending] = useActionState(registerUser, undefined);

  // SI HAY ÉXITO: Mostramos mensaje de confirmación
    if (state && typeof state === 'object' && 'success' in state) {
        return (
            <div className="text-center space-y-6 py-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">¡Revisa tu correo!</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Hemos enviado un enlace de confirmación. <br/>
                        Haz clic en él para activar tu cuenta.
                    </p>
                </div>
                <Link href="/login" className="inline-block text-sm text-blue-500 hover:text-blue-400 font-bold">
                    Volver a Iniciar Sesión
                </Link>
            </div>
        )
    }

    return (
        <form action={dispatch} className="space-y-5">

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Nombre de Usuario
                </label>
                <input
                    name="name"
                    type="text"
                    placeholder="ej: jesus"
                    required
                    // --- RESTRICCIONES HTML ---
                    pattern="[a-z]+"
                    maxLength={25}
                    title="Solo letras minúsculas (a-z), sin espacios ni símbolos."
                    // --------------------------
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    onChange={(e) => {
                        // Forzar minúsculas visualmente mientras escribe
                        e.target.value = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
                    }}
                />
                <p className="text-[10px] text-gray-500 ml-1">
                    Máx 25 caracteres. Solo letras minúsculas (a-z).
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Email
                </label>
                <input
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Contraseña
                </label>
                <input
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
            </div>

            {/* Manejo de error (si state es string, es un mensaje de error) */}
            {state && typeof state === 'string' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <p>{state}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {isPending ? 'Creando cuenta...' : 'Registrarse Gratis'}
            </button>
        </form>
    );
}