import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// --- CONFIGURACIÓN DEL REMITENTE ---
// Opción A (Si ya verificaste tu dominio en Resend):
// const EMAIL_FROM = 'Equipo POLLNOW <no-reply@pollnow.es>';

// Opción B (Si aún estás en modo prueba con Resend):
// Puedes cambiar el TEXTO, pero el correo debe ser onboarding@resend.dev
const EMAIL_FROM = 'POLLNOW App <contacto@rayelus.com>';
// ----------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
    const confirmLink = `${BASE_URL}/auth/new-verification?token=${token}`;

    await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Confirma tu cuenta en POLLNOW",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563EB;">Bienvenido a POLLNOW 🏆</h1>
        <p>Gracias por unirte. Para activar tu cuenta y empezar a crear eventos, por favor verifica tu correo:</p>
        <a href="${confirmLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Confirmar mi Cuenta</a>
        <p style="font-size: 12px; color: #666;">Si no has creado esta cuenta, puedes ignorar este mensaje.</p>
      </div>
    `
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${BASE_URL}/auth/new-password?token=${token}`;

    await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Recuperar Contraseña - POLLNOW",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Restablecer Contraseña</h2>
        <p>Has solicitado cambiar tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>
        <a href="${resetLink}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Cambiar Contraseña</a>
        <p style="font-size: 12px; color: #666;">Este enlace expirará en 1 hora. Si no fuiste tú, ignora este correo.</p>
      </div>
    `
    });
}