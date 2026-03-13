import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const CONTACT_TO = 'devignux@gmail.com'
const CONTACT_FROM = process.env.RESEND_FROM ?? 'RoamCompanion <onboarding@resend.dev>'

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  }

  let body: { name?: string; email?: string; message?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, message } = body
  const name = body.name?.trim()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 })
  }

  try {
    const subject = name ? `Contact from ${name}` : 'Contact form submission'
    const textBody = [
      name && `From: ${name}`,
      `Email: ${email.trim()}`,
      '',
      message.trim(),
    ]
      .filter(Boolean)
      .join('\n')

    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: email.trim(),
      subject: `[RoamCompanion] ${subject}`,
      text: textBody,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send' },
      { status: 500 }
    )
  }
}
