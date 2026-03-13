import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_DEEP_SEARCH_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'N8N_DEEP_SEARCH_URL non configuré dans .env.local' }, { status: 500 })
  }

  const { id, profile_url } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'Données prospect manquantes.' }, { status: 400 })
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prospect_id: id, profile_url }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `n8n a répondu avec une erreur: ${text}` }, { status: res.status })
  }

  // If n8n returns email/phone directly, forward them; otherwise just confirm
  try {
    const data = await res.json()
    return NextResponse.json({ ok: true, contact_email: data.contact_email ?? data.email ?? null, phone: data.phone ?? null })
  } catch {
    return NextResponse.json({ ok: true, email: null, phone: null })
  }
}
