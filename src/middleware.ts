import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Tu IP pública permitida para el panel de Admin
const ALLOWED_IP = '87.219.102.19';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const { pathname } = request.nextUrl;

    // --- 1. SEGURIDAD ADMIN (IP WHITELIST) ---
    if (pathname.startsWith('/admin')) {

        let ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

        if (ip.includes(',')) {
            ip = ip.split(',')[0].trim();
        }

        // --- CORRECCIÓN AQUÍ ---
        // Añadimos '::ffff:127.0.0.1' que es como Node suele ver localhost en algunos sistemas
        const isLocal = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';

        // Si no es tu IP pública Y no es local, bloqueamos
        if (ip !== ALLOWED_IP && !isLocal) {
            console.log(`⛔ Acceso denegado a Admin desde IP: ${ip}`);
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // --- 2. GESTIÓN DE VOTOS (COOKIE DE IDENTIDAD) ---
    if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        const voterId = request.cookies.get('foty_voter_id');

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
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};