import nodemailer from 'nodemailer'

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@macknightsafety.com'

  if (!transporter) {
    console.log('[mail] SMTP not configured. Password reset link:')
    console.log(`  to: ${to}`)
    console.log(`  url: ${resetUrl}`)
    return { delivered: false, mode: 'console', resetUrl }
  }

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your MacKnight prospecting password',
    text: `Reset your password using this link (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Reset your password using this link (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  })

  return { delivered: true, mode: 'smtp' }
}
