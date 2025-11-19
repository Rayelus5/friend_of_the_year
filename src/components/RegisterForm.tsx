'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { registerUser } from '@/app/lib/auth-actions';
import Link from 'next/link';

export default function RegisterForm() {
    const [errorMessage, dispatch] = useFormState(registerUser, undefined);

    return (
        <form action={dispatch} className="space-y-5">

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Nombre Completo
                </label>
                <input
                    name="name"
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    required
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
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

            {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{errorMessage}</p>
                </div>
            )}

            <SubmitButton />

            <p className="text-center text-gray-500 text-sm pt-4">
                ¿Ya tienes cuenta? <Link href="/login" className="text-blue-500 hover:underline font-bold">Inicia Sesión</Link>
            </p>
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? 'Creando cuenta...' : 'Registrarse Gratis'}
        </button>
    );
}