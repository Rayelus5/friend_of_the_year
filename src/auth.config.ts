import type { NextAuthConfig } from "next-auth";

// Definimos la configuración ligera para el Edge
export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" },
    callbacks: {
        // Lógica de JWT y Sesión (sin DB)
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.username = user.username;
                // Limpiamos imagen para que no pese
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
                session.user.image = null;
            }
            return session;
        },
        // Lógica de autorización (Protección de rutas)
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirige a login
            }
            return true;
        },
    },
    providers: [], // Se deja vacío intencionalmente para el Middleware
} satisfies NextAuthConfig;