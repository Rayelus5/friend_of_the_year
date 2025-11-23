'use client';

import { useActionState } from 'react';
import { authenticateCredentials } from '@/app/lib/auth-actions'; // Importamos del archivo unificado

export default function LoginForm() {
    // Usamos el hook moderno de React 19 / Next 15
    const [errorMessage, dispatch, isPending] = useActionState(authenticateCredentials, undefined);

    return (
        <form action={dispatch} className="space-y-6">

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Email
                </label>
                <input
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    id="email"
                    type="email"
                    name="email"
                    placeholder="admin@foty.com"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Contraseña
                </label>
                <input
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    id="password"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                />
            </div>

            {/* Mensaje de Error del Servidor */}
            {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{errorMessage}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {isPending ? 'Entrando...' : 'Iniciar Sesión'}
            </button>
        </form>
    );
}