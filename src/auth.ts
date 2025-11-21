import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config" // <--- Importamos la config ligera
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Esquema de validación
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig, // <--- Heredamos la config ligera
    adapter: PrismaAdapter(prisma), // <--- Añadimos Prisma (Solo Node.js)
    providers: [
        Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true, // Permite vincular si el email ya existe
        
        // Truco Pro: Generamos datos por defecto al crear el usuario
        profile(profile) {
            const randomSuffix = Math.floor(Math.random() * 10000);
            // Generamos un username basado en el email (ej: juan4923)
            const baseUsername = profile.email?.split('@')[0] || 'user';
            const username = `${baseUsername}${randomSuffix}`;

            return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                // Campos extra de nuestro Schema:
                username: username,
                subscriptionStatus: 'free',
                emailVerified: new Date(), // Google ya verificó el email, confiamos en él
            }
        },
        }),
        Credentials({
            // Importante: Poner nombre para identificarlo en logs si hay varios
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                // 1. Validación segura con Zod (safeParse no explota si falla)
                const parsedCredentials = loginSchema.safeParse(credentials);
                if (!parsedCredentials.success) return null;
                const { email, password } = parsedCredentials.data;

                try {
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user || !user.passwordHash) return null;
                    if (!user.emailVerified) {
                        console.log("❌ Usuario correcto pero email no verificado.");
                        // Lanzamos un error específico que podríamos capturar en el frontend si quisiéramos
                        // Auth.js devolverá un error de "AccessDenied" o similar
                        return null; 
                    }
                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
                    if (passwordsMatch) return user;
                } catch (e) { return null }
                    return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
        if (user) {
            token.id = user.id;
            // @ts-ignore
            token.username = user.username;
            
            // --- CORRECCIÓN CRÍTICA ---
            // Borramos la imagen del token para que no explote la cookie
            // (La imagen Base64 pesa demasiado para viajar en cada petición)
            delete token.picture;
            delete token.image;
        }
        
        if (trigger === "update" && session) {
            return { ...token, ...session.user };
        }
        return token;
        },
        async session({ session, token }) {
        if (session.user && token.id) {
            session.user.id = token.id as string;
            // @ts-ignore
            session.user.username = token.username as string;
            // Aseguramos que la sesión tampoco intente llevar la imagen
            session.user.image = null; 
        }
        return session;
        }
    },
    // Debug solo en desarrollo para ver trazas completas
    debug: process.env.NODE_ENV === "development",
})