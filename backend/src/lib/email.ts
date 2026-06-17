import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST ?? ''
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587
const SMTP_USER = process.env.SMTP_USER ?? ''
const SMTP_PASS = process.env.SMTP_PASS ?? ''
const SMTP_FROM = process.env.SMTP_FROM ?? 'noreply@sigo-ollas.pe'
const EMAIL_MODE =
  process.env.EMAIL_MODE ?? (process.env.NODE_ENV === 'production' ? 'smtp' : 'console')

export const isConsoleEmailMode = (): boolean => EMAIL_MODE === 'console'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP no esta configurado. Define SMTP_HOST, SMTP_USER y SMTP_PASS.')
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

  return transporter
}

export async function sendOtpEmail(
  to: string,
  code: string,
  fullName: string,
): Promise<void> {
  if (isConsoleEmailMode()) {
    console.log('\n========================================')
    console.log('[DEV OTP] Codigo de inicio de sesion')
    console.log(`Usuario: ${fullName}`)
    console.log(`Correo: ${to}`)
    console.log(`Codigo: ${code}`)
    console.log('Expira en: 2 minutos')
    console.log('========================================\n')
    return
  }

  const t = getTransporter()

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#1a1a2e">Codigo de Verificacion</h2>
      <p>Hola <strong>${fullName}</strong>,</p>
      <p>Usa el siguiente codigo para completar tu inicio de sesion:</p>
      <div style="background:#f4f4f4;border-radius:8px;padding:20px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:700;margin:20px 0">
        ${code}
      </div>
      <p style="color:#666;font-size:13px">Este codigo expira en 2 minutos. No lo compartas con nadie.</p>
      <hr style="border:none;border-top:1px solid #eee" />
      <p style="color:#999;font-size:12px">SIGO-Ollas — Sistema de Gestion de Ollas Comunes</p>
    </div>
  `

  await t.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Tu codigo de verificacion - SIGO-Ollas',
    html,
  })
}

export async function sendLoginAlertEmail(
  to: string,
  fullName: string,
): Promise<void> {
  if (isConsoleEmailMode()) {
    console.log(`[DEV EMAIL] Alerta de inicio de sesion omitida para ${fullName} <${to}>.`)
    return
  }

  const t = getTransporter()

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#1a1a2e">Inicio de Sesion Detectado</h2>
      <p>Hola <strong>${fullName}</strong>,</p>
      <p>Se ha iniciado sesion en tu cuenta de <strong>SIGO-Ollas</strong>.</p>
      <p style="color:#666;font-size:14px">Si fuiste tu, puedes ignorar este mensaje.</p>
      <div style="background:#fff3cd;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #ffc107">
        <p style="margin:0;font-size:14px;color:#856404">
          <strong>Si no has sido tu,</strong> contactanos de inmediato al correo
          <a href="mailto:soporte@sigo-ollas.pe" style="color:#1a1a2e">soporte@sigo-ollas.pe</a>
          para proteger tu cuenta.
        </p>
      </div>
      <hr style="border:none;border-top:1px solid #eee" />
      <p style="color:#999;font-size:12px">SIGO-Ollas — Sistema de Gestion de Ollas Comunes</p>
    </div>
  `

  await t.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Alerta de seguridad: nuevo inicio de sesion - SIGO-Ollas',
    html,
  })
}

export function isEmailConfigured(): boolean {
  return isConsoleEmailMode() || Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)
}
