'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    // Valores crudos
    const rawName = (formData.get("name") as string | null)?.trim() ?? "";
    const rawUsername = (formData.get("username") as string | null)?.trim() ?? "";
    const image = formData.get("image") as string | null;

    // Normalizar username a minúsculas
    const username = rawUsername.toLowerCase();

    // === VALIDACIONES USERNAME (@) ===
    // - solo minúsculas y _
    // - longitud máxima 20
    if (!username) {
        return { error: "El nombre de usuario (@) es obligatorio." };
    }

    if (username.length > 20) {
        return { error: "El nombre de usuario (@) no puede tener más de 20 caracteres." };
    }

    if (!/^[a-z_]+$/.test(username)) {
        return {
            error: "El nombre de usuario (@) solo puede contener letras minúsculas (a-z) y guiones bajos (_).",
        };
    }

    // === VALIDACIONES NAME (nombre en pantalla) ===
    // - permite letras (cualquier idioma) y espacios
    // - sin símbolos ni números
    // - longitud máxima 25
    const name = rawName;

    if (!name) {
        return { error: "El nombre en pantalla es obligatorio." };
    }

    if (name.length > 25) {
        return { error: "El nombre en pantalla no puede tener más de 25 caracteres." };
    }

    // \p{L} = cualquier letra unicode, \s = espacios
    if (!/^[\p{L}\s]+$/u.test(name)) {
        return {
            error: "El nombre en pantalla solo puede contener letras y espacios (sin símbolos ni números).",
        };
    }

    // === USERNAME ÚNICO (si cambia) ===
    if (username !== session.user.username) {
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return { error: "Este nombre de usuario (@) ya está en uso." };
        }
    }

    // Actualizar usuario
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name,
            username,
            image: image ?? null,
        },
    });

    revalidatePath("/dashboard/profile");
    return { success: "Perfil actualizado correctamente." };
}


export async function changePassword(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    // 1. Verificar contraseña actual
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user || !user.passwordHash) {
        return { error: "Este usuario no usa contraseña (quizás usas Google)." };
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return { error: "La contraseña actual es incorrecta." };

    // 2. Encriptar nueva
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Guardar
    await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: hashedPassword }
    });

    revalidatePath('/dashboard/profile');
    return { success: "Contraseña cambiada. Inicia sesión de nuevo." };
}