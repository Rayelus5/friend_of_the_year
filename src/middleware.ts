import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MAINTENANCE_MODE } from "@/lib/config";

// Inicializamos NextAuth SOLO con la config ligera para el Edge
const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    // 1. PROTECCIÓN DE DASHBOARD
    // La lógica `authorized` en auth.config.ts ya maneja el true/false,
    // pero si queremos redirección manual personalizada:
    const protectedPaths = ['/dashboard', '/polls', '/results', '/e', '/premium'];
    if (protectedPaths.some(path => nextUrl.pathname.startsWith(path)) && !isLoggedIn) {
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


//MANTENIMIENTO

export function middleware(req: NextRequest) {
    if (!MAINTENANCE_MODE) {
        return NextResponse.next();
    }

    const { pathname } = req.nextUrl;

    // 1. Permitir la propia página de mantenimiento
    if (pathname === "/maintenance") {
        return NextResponse.next();
    }

    // 2. Permitir assets estáticos y rutas técnicas
    if (
        pathname.startsWith("/_next") ||                   // archivos de Next
        pathname === "/favicon.ico" ||
        pathname === "/robots.txt" ||
        pathname === "/sitemap.xml" ||
        pathname.match(/\.(.*)$/)                          // cualquier archivo con extensión: .png, .jpg, .css, .js, etc.
    ) {
        return NextResponse.next();
    }

    // 3. Reescribir el resto a /maintenance
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";

    return NextResponse.rewrite(url);
}


export const config = {
    // Matcher para excluir estáticos y llamadas internas
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};