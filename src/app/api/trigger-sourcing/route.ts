import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { source, keyword, location, country, mode } = await req.json()

  if (!keyword || !location) {
    return NextResponse.json({ error: 'Keyword et location requis' }, { status: 400 })
  }

  const webhookUrl = source === 'instagram'
    ? process.env.N8N_INSTAGRAM_WEBHOOK_URL
    : process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    const envVar = source === 'instagram' ? 'N8N_INSTAGRAM_WEBHOOK_URL' : 'N8N_WEBHOOK_URL'
    return NextResponse.json(
      { error: `${envVar} non configuré dans .env.local` },
      { status: 500 }
    )
  }

  const payload: Record<string, string> = { keyword, location, source }
  if (source === 'google') payload.country = country || 'France'
  if (source === 'instagram' && mode) payload.mode = mode

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `n8n a répondu avec une erreur: ${text}` }, { status: res.status })
  }

  return NextResponse.json({ ok: true })
}
