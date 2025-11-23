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
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:24px 0; background-color:#020617;">
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:0 16px;">
      
      <div style="border-radius:24px; border:1px solid #1f2937; background-color:#020617; box-shadow:0 18px 45px rgba(15,23,42,0.85); padding:32px 28px;">
        
        <!-- Badge superior -->
        <div style="display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; background:rgba(37,99,235,0.12); border:1px solid rgba(129,140,248,0.4); margin-bottom:20px;">
          <span style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#bfdbfe; font-weight:600;">
            Verificación de cuenta
          </span>
        </div>

        <!-- Cabecera -->
        <h1 style="margin:0 0 8px 0; font-size:24px; line-height:1.2; color:#f9fafb; font-weight:800;">
          Bienvenido a POLLNOW
        </h1>
        <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#9ca3af;">
          Gracias por registrarte. Antes de empezar a crear eventos y galas, necesitamos verificar tu dirección de correo electrónico.
        </p>

        <!-- Bloque destacado -->
        <div style="margin:20px 0 24px 0; padding:16px 18px; border-radius:16px; background:rgba(15,23,42,0.9); border:1px solid rgba(55,65,81,0.9);">
          <p style="margin:0; font-size:13px; line-height:1.6; color:#e5e7eb;">
            Haz clic en el botón de abajo para confirmar tu cuenta y acceder a todas las funciones de POLLNOW.
          </p>
        </div>

        <!-- Botón principal -->
        <a href="${confirmLink}"
           style="
             display:inline-block;
             padding:12px 26px;
             font-size:14px;
             font-weight:600;
             text-decoration:none;
             border-radius:999px;
             background:linear-gradient(135deg,#4f46e5,#6366f1);
             color:#0b1120;
             border:1px solid rgba(191,219,254,0.9);
             text-align:center;
             margin:4px 0 18px 0;
           ">
          Confirmar mi cuenta
        </a>

        <!-- Texto secundario -->
        <p style="margin:0 0 4px 0; font-size:12px; line-height:1.7; color:#6b7280;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:
        </p>
        <p style="margin:0 0 20px 0; font-size:11px; line-height:1.6; color:#9ca3af; word-break:break-all;">
          ${confirmLink}
        </p>

        <!-- Footer legal -->
        <p style="margin:0; font-size:11px; line-height:1.6; color:#4b5563;">
          Si no has creado una cuenta en POLLNOW, puedes ignorar este mensaje. Tu correo no será utilizado.
        </p>
      </div>

      <!-- Pie pequeño -->
      <p style="margin:16px 0 0 0; font-size:11px; line-height:1.6; color:#6b7280; text-align:center;">
        POLLNOW · Gestión de eventos y galas interactivas
      </p>
    </div>
  </body>
</html>
        `
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${BASE_URL}/auth/new-password?token=${token}`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Restablecer contraseña - POLLNOW",
    html: `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:24px 0; background-color:#020617;">
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:0 16px;">

      <div style="border-radius:24px; border:1px solid #1f2937; background-color:#020617; box-shadow:0 18px 45px rgba(15,23,42,0.85); padding:32px 28px;">
        
        <!-- Badge superior -->
        <div style="display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; background:rgba(15,23,42,0.9); border:1px solid rgba(75,85,99,0.9); margin-bottom:20px;">
          <span style="font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#e5e7eb; font-weight:600;">
            Seguridad de la cuenta
          </span>
        </div>

        <!-- Cabecera -->
        <h2 style="margin:0 0 8px 0; font-size:22px; line-height:1.2; color:#f9fafb; font-weight:800;">
          Restablecer contraseña
        </h2>
        <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#9ca3af;">
          Hemos recibido una solicitud para cambiar la contraseña de tu cuenta en POLLNOW.
        </p>

        <!-- Bloque destacado -->
        <div style="margin:20px 0 24px 0; padding:16px 18px; border-radius:16px; background:rgba(15,23,42,0.9); border:1px solid rgba(55,65,81,0.9);">
          <p style="margin:0; font-size:13px; line-height:1.6; color:#e5e7eb;">
            Haz clic en el botón de abajo para establecer una nueva contraseña. 
            Por seguridad, este enlace es válido durante 1 hora.
          </p>
        </div>

        <!-- Botón principal -->
        <a href="${resetLink}"
           style="
             display:inline-block;
             padding:12px 26px;
             font-size:14px;
             font-weight:600;
             text-decoration:none;
             border-radius:999px;
             background:#020617;
             color:#f9fafb;
             border:1px solid rgba(148,163,184,0.9);
             text-align:center;
             margin:4px 0 18px 0;
           ">
          Cambiar contraseña
        </a>

        <!-- Texto secundario -->
        <p style="margin:0 0 4px 0; font-size:12px; line-height:1.7; color:#6b7280;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:
        </p>
        <p style="margin:0 0 20px 0; font-size:11px; line-height:1.6; color:#9ca3af; word-break:break-all;">
          ${resetLink}
        </p>

        <!-- Aviso -->
        <p style="margin:0; font-size:11px; line-height:1.6; color:#4b5563;">
          Si tú no has solicitado este cambio, te recomendamos ignorar este correo. Tu contraseña actual seguirá siendo válida.
        </p>
      </div>

      <!-- Pie pequeño -->
      <p style="margin:16px 0 0 0; font-size:11px; line-height:1.6; color:#6b7280; text-align:center;">
        POLLNOW · Gestión de eventos y galas interactivas
      </p>
    </div>
  </body>
</html>
        `
  });
}
