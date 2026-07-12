import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer'

export interface SendEmailInput {
  to: string
  cc?: string
  subject: string
  text: string
  html?: string
}

let cachedTransporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    return null
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  })
  return cachedTransporter
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM ?? 'no-reply@ollascomunes.pe'

  const mailOptions: SendMailOptions = {
    from,
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    text: input.text,
    html: input.html,
  }

  if (transporter) {
    await transporter.sendMail(mailOptions)
    return
  }

  // Sin credenciales SMTP configuradas: fallback a log en consola.
  // Asi el resto del sistema sigue funcionando en dev/test sin un servidor de correo.
  console.log('[email] (sin SMTP configurado, solo log) Destinatario:', input.to)
  if (input.cc) console.log('[email] CC:', input.cc)
  console.log('[email] Asunto:', input.subject)
  console.log('[email] Cuerpo:\n' + input.text)
}
