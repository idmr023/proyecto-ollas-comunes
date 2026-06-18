import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(params: { to: string; cc?: string; subject: string; text: string; html?: string }): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  if (!from) {
    console.warn('[Email] SMTP no configurado. No se envió el correo.')
    return
  }

  try {
    await transporter.sendMail({
      from: `"SIGO-Ollas" <${from}>`,
      to: params.to,
      cc: params.cc,
      subject: params.subject,
      text: params.text,
      html: params.html ?? params.text.replace(/\n/g, '<br/>'),
    })
    console.log('[Email] Correo enviado a', params.to)
  } catch (err) {
    console.error('[Email] Error al enviar correo:', err)
  }
}
