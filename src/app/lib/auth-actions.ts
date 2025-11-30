'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

// --- SCHEMAS ---
const strictNameRegex = /^[a-z]+$/;

const registerSchema = z.object({
    name: z.string()
        .min(3, "Mínimo 3 letras")
        .max(15, "Máximo 15 caracteres")
        .regex(strictNameRegex, "Solo minúsculas (a-z), sin espacios"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
});

const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Introduce tu contraseña"),
});

// --- 1. REGISTRO DE USUARIO ---
export async function registerUser(prevState: string | undefined, formData: FormData) {
    const rawName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const cleanName = rawName ? rawName.toLowerCase().trim() : "";

    const validatedFields = registerSchema.safeParse({
        name: cleanName,
        email,
        password,
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return fieldErrors.name?.[0] || fieldErrors.email?.[0] || fieldErrors.password?.[0] || "Datos inválidos";
    }

    const data = validatedFields.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        // DETECCIÓN DE CUENTA GOOGLE EN REGISTRO
        if (existingUser && !existingUser.passwordHash) {
            return "Esta cuenta usa Google. Por favor inicia sesión con Google.";
        }

        if (existingUser) {
            return "Este email ya está registrado.";
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const randomSuffix = Math.floor(Math.random() * 1000);
        const username = `${data.name}${randomSuffix}`;

        await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                username,
                passwordHash: hashedPassword,
                subscriptionStatus: 'free',
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
            },
        });

        const verificationToken = await generateVerificationToken(data.email);
        await sendVerificationEmail(verificationToken.email, verificationToken.token);

        return { success: "Cuenta creada. Revisa tu correo para verificarla." };

    } catch (error: any) {
        console.error("Register error:", error);
        return "Error interno al crear usuario.";
    }
}

// --- 2. LOGIN CON CREDENCIALES ---
export async function authenticateCredentials(prevState: string | undefined, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validación básica
    const validatedFields = loginSchema.safeParse({ email, password });
    if (!validatedFields.success) {
        return "Formato de datos inválido.";
    }

    // cerrar sesión primero antes de iniciar sesión (solo cerrar sesión si ya tiene sesión iniciada)
    if (sessionStorage.getItem('next-auth.session-token')) {
        await signOut();
    }

    try {
        // VERIFICACIÓN PREVIA: ¿Es cuenta de Google?
        const user = await prisma.user.findUnique({ where: { email } });

        if (user && !user.passwordHash) {
            return "Esta cuenta está vinculada a Google. Usa el botón de Google.";
        }

        if (user && !user.emailVerified) {
            return "Debes verificar tu correo antes de entrar.";
        }

        // Intento de Login
        await signIn('credentials', {
            email,
            password,
            redirectTo: "/dashboard/profile"
        });

    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales incorrectas.';
                default:
                    return 'Algo salió mal al iniciar sesión.';
            }
        }
        // Next.js usa errores para redirigir, hay que relanzarlos
        throw error;
    }
}

// --- 3. LOGIN CON GOOGLE ---
export async function authenticateGoogle() {
    try {
        // cerrar sesión primero antes de iniciar sesión (solo cerrar sesión si ya tiene sesión iniciada)
        if (sessionStorage.getItem('next-auth.session-token')) {
            await signOut();
        }
        await signIn('google', { redirectTo: "/dashboard/profile" });
    } catch (error) {
        if (error instanceof AuthError) {
            return 'Error al conectar con Google.';
        }
        throw error;
    }
}

// --- 4. LOGOUT ---
export async function logoutUser() {
    await signOut({ redirectTo: "/" });
}