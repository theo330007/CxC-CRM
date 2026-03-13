import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'N8N_WEBHOOK_URL non configuré dans .env.local' },
      { status: 500 }
    )
  }

  const { keyword, location } = await req.json()
  if (!keyword || !location) {
    return NextResponse.json({ error: 'Keyword et location requis' }, { status: 400 })
  }

  const textQuery = `${keyword} ${location}`

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textQuery, keyword, location }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `n8n a répondu avec une erreur: ${text}` }, { status: res.status })
  }

  return NextResponse.json({ ok: true, textQuery })
}
