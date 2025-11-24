import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1) Primer login o re-login: viene "user"
      if (user) {
        const u = user as any;

        // ID y username
        token.id = u.id as string;
        token.username = (u.username ?? u.name ?? "") as string;

        // --- RESOLVER ROLE ---
        let role: "USER" | "ADMIN" | "MODERATOR" = "USER";

        // a) Si viene de la BD/proveedor, úsalo
        if (u.role) {
          role = u.role as "USER" | "ADMIN" | "MODERATOR";
        } else {
          // b) Parche: este email será ADMIN sí o sí
          if (u.email === "admin@admin.com") {
            role = "ADMIN";
          } else if (token.role) {
            role = token.role as "USER" | "ADMIN" | "MODERATOR";
          }
        }

        token.role = role;
        // ----------------------

        // Limpiar props que no usamos
        delete (token as any).picture;
        delete (token as any).image;
      }

      // 2) Cuando haces session.update() desde el cliente
      if (trigger === "update" && session?.user) {
        const sUser = session.user as any;
        // Actualizamos campos, pero sin perder el role si no viene
        token.username = sUser.username ?? token.username;
        token.role =
          (sUser.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
          (token.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
          "USER";
      }

      // 3) Fallback general: aseguramos que SIEMPRE haya role
      if (!token.role) {
        // Parche también para tokens viejos sin role pero con email de admin
        if ((token as any).email === "admin@admin.com") {
          token.role = "ADMIN";
        } else {
          token.role = "USER";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const sUser = session.user as any;

        sUser.id = token.id as string;
        sUser.username = (token as any).username as string;
        sUser.role =
          (token.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
          "USER";

        session.user.image = null;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirige a login si no está logueado
      }

      // /admin lo controlas en el middleware (role + IP), así que aquí lo dejamos pasar
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
