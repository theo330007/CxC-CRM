import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { source, keyword, keywords, location, country, gender, mode } = await req.json()

  const webhookUrl = source === 'instagram'
    ? process.env.N8N_INSTAGRAM_WEBHOOK_URL
    : process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    const envVar = source === 'instagram' ? 'N8N_INSTAGRAM_WEBHOOK_URL' : 'N8N_WEBHOOK_URL'
    return NextResponse.json({ error: `${envVar} non configuré dans .env.local` }, { status: 500 })
  }

  if (source === 'instagram') {
    if (!keyword || !location) {
      return NextResponse.json({ error: 'Keyword et location requis' }, { status: 400 })
    }
    const payload: Record<string, string> = { keyword, location, source, user_id: user.id }
    if (mode) payload.mode = mode
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

  // Google: one webhook call per keyword
  if (!keywords?.length) {
    return NextResponse.json({ error: 'Au moins un métier requis' }, { status: 400 })
  }

  for (const kw of keywords as string[]) {
    const payload: Record<string, string> = {
      keyword: kw,
      location: location || '',
      country: country || 'France',
      source,
      user_id: user.id,
    }
    if (gender && gender !== 'any') payload.gender = gender

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `n8n erreur pour "${kw}": ${text}` }, { status: res.status })
    }
  }

  return NextResponse.json({ ok: true })
}
