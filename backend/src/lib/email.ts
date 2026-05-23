import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST ?? ''
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587
const SMTP_USER = process.env.SMTP_USER ?? ''
const SMTP_PASS = process.env.SMTP_PASS ?? ''
const SMTP_FROM = process.env.SMTP_FROM ?? 'noreply@sigo-ollas.pe'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  } else {
    // Dev fallback: log instead of send
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
    })
  }

  return transporter
}

export async function sendOtpEmail(
  to: string,
  code: string,
  fullName: string,
): Promise<void> {
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

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS)
}
