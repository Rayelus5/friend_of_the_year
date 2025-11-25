import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { MAINTENANCE_MODE } from "@/lib/config";

const { auth } = NextAuth(authConfig);

// Lista de IPs permitidas para acceder al panel de admin (separadas por comas en .env)
// const ADMIN_IPS = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

export default auth(async (req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    // @ts-ignore
    const userRole = (req.auth?.user?.role || 'USER').toUpperCase();

    
    // Obtener IP real del cliente (compatible con Vercel/Proxies)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    // const isLocal = ip === '127.0.0.1' || ip === '::1';

    // console.log('MIDDLEWARE DEBUG', {
    //     path: nextUrl.pathname,
    //     isLoggedIn,
    //     authUser: req.auth?.user,
    //     userRole,
    // });

    // ---------------------------------------------------------
    // 1. MODO MANTENIMIENTO (Prioridad Absoluta)
    // ---------------------------------------------------------
    if (MAINTENANCE_MODE) {
        // Permitimos acceso a rutas internas y estáticas
        if (
            nextUrl.pathname.startsWith("/_next") ||
            nextUrl.pathname.match(/\.(.*)$/) ||
            nextUrl.pathname === "/maintenance"
        ) {
            return NextResponse.next();
        }

        // Excepción: Los ADMINS pueden entrar incluso en mantenimiento
        if (isLoggedIn && userRole === 'ADMIN' && nextUrl.pathname.startsWith('/admin')) {
            return NextResponse.next();
        }

        // Todo lo demás -> Pantalla de mantenimiento
        return NextResponse.rewrite(new URL('/maintenance', req.url));
    }

    // ---------------------------------------------------------
    // 2. PROTECCIÓN DE RUTAS ADMIN (Seguridad Máxima)
    // ---------------------------------------------------------
    if (nextUrl.pathname.startsWith('/admin')) {
        // A. Primero: ¿Está logueado?
        if (!isLoggedIn) {
            const loginUrl = new URL('/login', req.url);
            loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }

        // B. Segundo: ¿Tiene el rol adecuado?
        if (isLoggedIn && userRole === 'ADMIN' && nextUrl.pathname.startsWith('/admin')) {
            return NextResponse.next();
        }


        //&& userRole !== 'MODERATOR'

        // C. Tercero: ¿Es una IP permitida? (Solo si hay lista blanca definida)
        // if (ADMIN_IPS.length > 0 && !ADMIN_IPS.includes(ip) && !isLocal) {
        //      // Si no es IP válida y no es local, 404 falso por seguridad
        //      return NextResponse.rewrite(new URL('/404', req.url));
        // }
    }

    // ---------------------------------------------------------
    // 3. PROTECCIÓN DE RUTAS DE USUARIO (Dashboard, etc)
    // ---------------------------------------------------------
    const protectedUserPaths = ['/dashboard', '/results', '/polls', '/e', '/premium', '/admin'];
    
    // Verificamos si la ruta actual empieza por alguna de las protegidas
    const isProtectedPath = protectedUserPaths.some(path => nextUrl.pathname.startsWith(path));

    if (isProtectedPath && !isLoggedIn) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 4. GESTIÓN DE VOTOS (Cookie Anónima para usuarios no registrados)
    const response = NextResponse.next();
    if (!nextUrl.pathname.startsWith('/_next') && !nextUrl.pathname.includes('.')) {
        const voterId = req.cookies.get('voter_id');
        if (!voterId) {
            const newVoterId = crypto.randomUUID();
            response.cookies.set('voter_id', newVoterId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365, // 1 año
                httpOnly: true,
                sameSite: 'lax',
            });
        }
    }

    return response;
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};