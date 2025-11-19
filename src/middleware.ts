import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

// Inicializamos NextAuth SOLO con la config ligera para el Edge
const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    // 1. PROTECCIÓN DE DASHBOARD
    // La lógica `authorized` en auth.config.ts ya maneja el true/false,
    // pero si queremos redirección manual personalizada:
    if (nextUrl.pathname.startsWith('/dashboard') && !isLoggedIn) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 2. GESTIÓN DE VOTOS (Cookie Anónima) - Se mantiene
    const response = NextResponse.next();
    if (!nextUrl.pathname.startsWith('/_next') && !nextUrl.pathname.includes('.')) {
        const voterId = req.cookies.get('foty_voter_id');
        if (!voterId) {
            const newVoterId = crypto.randomUUID();
            response.cookies.set('foty_voter_id', newVoterId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                httpOnly: true,
                sameSite: 'lax',
            });
        }
    }

    return response;
});

export const config = {
    // Matcher para excluir estáticos y llamadas internas
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};