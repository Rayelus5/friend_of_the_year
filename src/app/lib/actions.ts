'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    signInType: 'credentials' | 'google',
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        // AÑADIDO: Tercer argumento { redirectTo: "/" }
        await signIn(signInType, formData, { redirectTo: "/dashboard/profile" });
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