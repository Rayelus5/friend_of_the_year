"use server";

import { prisma } from "@/lib/prisma";

export const newVerification = async (token: string) => {
    const existingToken = await prisma.verificationToken.findUnique({
        where: { token },
    });

    if (!existingToken) {
        return { error: "El token no existe o es inválido." };
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
        return { error: "El token ha expirado. Regístrate de nuevo." };
    }

    const existingUser = await prisma.user.findUnique({
        where: { email: existingToken.email },
    });

    if (!existingUser) {
        return { error: "El email no existe." };
    }

    // MARCAR COMO VERIFICADO
    await prisma.user.update({
        where: { id: existingUser.id },
        data: {
            emailVerified: new Date(),
            // Truco: Si cambiamos el email en el perfil, aquí confirmamos el cambio
            email: existingToken.email,
        },
    });

    // BORRAR EL TOKEN USADO
    await prisma.verificationToken.delete({
        where: { id: existingToken.id },
    });

    return { success: "¡Email verificado! Ya puedes iniciar sesión." };
};