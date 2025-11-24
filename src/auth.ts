import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config" // Config base
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
    // Heredamos páginas, session.strategy, authorized, etc.
    ...authConfig,

    // Añadimos adapter y providers
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,

            // Mapeo del perfil de Google a nuestro modelo de usuario
            profile(profile) {
                const randomSuffix = Math.floor(Math.random() * 10000);
                const baseUsername = profile.email?.split("@")[0] || "user";
                const username = `${baseUsername}${randomSuffix}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "");

                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    username,
                    subscriptionStatus: "free",
                    emailVerified: new Date(),
                    // Por defecto, cualquier user que venga de Google es USER
                    role: "USER" as const,
                };
            },
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                // 1. Validación segura con Zod
                const parsedCredentials = loginSchema.safeParse(credentials);
                if (!parsedCredentials.success) return null;
                const { email, password } = parsedCredentials.data;

                try {
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user || !user.passwordHash) return null;

                    if (!user.emailVerified) {
                        console.log("❌ Usuario correcto pero email no verificado.");
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(
                        password,
                        user.passwordHash
                    );

                    if (passwordsMatch) {
                        // 🔹 Este `user` incluye `role` desde Prisma
                        return user;
                    }
                } catch (e) {
                    return null;
                }

                return null;
            },
        }),
    ],

    callbacks: {
        // Reutilizamos cualquier callback definido en authConfig (por ejemplo `authorized`)
        ...(authConfig.callbacks ?? {}),

        // Sobrescribimos jwt para controlar bien el token
        async jwt({ token, user, trigger, session }) {
            // 1) Primer login / login con credenciales: viene `user`
            if (user) {
                const u = user as any;

                token.id = u.id as string;
                token.username = (u.username ?? u.name ?? "") as string;

                // --- ROLE: sacamos de BD o de lo que venga del provider ---
                let role: "USER" | "ADMIN" | "MODERATOR" = "USER";

                if (u.role) {
                    role = u.role as "USER" | "ADMIN" | "MODERATOR";
                } else if (u.email === "admin@admin.com") {
                    // Parche por si algún provider no mete role pero este email
                    // es de nuestro admin
                    role = "ADMIN";
                } else if (token.role) {
                    role = token.role as "USER" | "ADMIN" | "MODERATOR";
                }

                token.role = role;

                // Limpiar basura que mete NextAuth por defecto
                delete (token as any).picture;
                delete (token as any).image;
            }

            // 2) Cuando haces session.update() desde el cliente
            if (trigger === "update" && session?.user) {
                const sUser = session.user as any;

                token.username = sUser.username ?? token.username;
                token.role =
                    (sUser.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
                    (token.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
                    "USER";
            }

            // 3) Fallback general: que nunca se quede sin role
            if (!token.role) {
                if ((token as any).email === "admin@admin.com") {
                    token.role = "ADMIN";
                } else {
                    token.role = "USER";
                }
            }

            return token;
        },

        // Sesión que llega al cliente (y al middleware vía auth())
        async session({ session, token }) {
            if (session.user) {
                const sUser = session.user as any;

                sUser.id = token.id as string;
                sUser.username = (token as any).username as string;
                sUser.role =
                    (token.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
                    "USER";

                // Evitamos mandar imagen pesada en la sesión
                session.user.image = null;
            }
            return session;
        },
    },

    // Debug solo en desarrollo para ver trazas completas
    debug: process.env.NODE_ENV === "development",
})