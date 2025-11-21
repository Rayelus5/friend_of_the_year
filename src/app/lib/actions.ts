// src/app/lib/actions.ts
'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

function formDataToObject(formData?: FormData) {
    if (!formData) return {};
    return Object.fromEntries(formData.entries());
}

/**
 * Login con email + password (form submit)
 * Recibe el FormData como primer argumento (así lo hace el form dispatcher).
 */
export async function authenticateCredentials(formData: FormData) {
    try {
        const data = formDataToObject(formData);
        // aquí `signIn` recibe: tipo, payload, opciones
        await signIn('credentials', data, { redirectTo: '/dashboard/profile' });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal.';
            }
        }
        throw error;
    }
}

/**
 * Inicio con Google (también se puede invocar desde un form submit).
 * Acepta opcionalmente FormData (no necesario), pero no se debe ejecutar en render.
 */
export async function authenticateGoogle(formData?: FormData) {
    try {
        // convertimos datos si vienen, aunque para Google no hace falta
        const data = formDataToObject(formData);
        await signIn('google', data, { redirectTo: '/dashboard/profile' });
    } catch (error) {
        if (error instanceof AuthError) {
            return 'Error al iniciar con Google.';
        }
        throw error;
    }
}
