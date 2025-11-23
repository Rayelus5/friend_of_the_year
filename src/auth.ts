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
            allowDangerousEmailAccountLinking: true,

            // IMPORTANTE: Mapeo de perfil
            profile(profile) {
                const randomSuffix = Math.floor(Math.random() * 10000);
                const baseUsername = profile.email?.split('@')[0] || 'user';
                const username = `${baseUsername}${randomSuffix}`.toLowerCase().replace(/[^a-z0-9]/g, "");

                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture, // <--- ESTO ES LO QUE GUARDA LA FOTO EN LA DB
                    username: username,
                    subscriptionStatus: 'free',
                    emailVerified: new Date(),
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