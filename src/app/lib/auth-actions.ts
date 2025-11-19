'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";

const registerSchema = z.object({
    name: z.string().min(2, "El nombre es muy corto"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function registerUser(prevState: string | undefined, formData: FormData) {
    // 1. Validar datos
    const validatedFields = registerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return validatedFields.error.errors[0].message;
    }

    const { name, email, password } = validatedFields.data;

    try {
        // 2. Verificar si ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return "Este email ya está registrado.";
        }

        // 3. Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Generar username único base (ej: rayelus492)
        const baseUsername = email.split('@')[0];
        const randomSuffix = Math.floor(Math.random() * 10000);
        const username = `${baseUsername}${randomSuffix}`;

        // 5. Crear usuario
        await prisma.user.create({
            data: {
                name,
                email,
                username,
                passwordHash: hashedPassword,
                subscriptionStatus: 'free', // Empiezan como Free
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` // Avatar por defecto
            },
        });

    } catch (error) {
        console.error("Register error:", error);
        return "Error interno al crear usuario.";
    }

    // 6. Redirigir al login
    redirect('/login?registered=true');
}