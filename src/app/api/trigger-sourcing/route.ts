import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { runGoogleSourcing } from '@/lib/google-sourcing'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { source, keyword, keywords, location, country, gender, mode } = await req.json()

  // Instagram — still via n8n (coming soon in app)
  if (source === 'instagram') {
    const webhookUrl = process.env.N8N_INSTAGRAM_WEBHOOK_URL
    if (!webhookUrl) return NextResponse.json({ error: 'N8N_INSTAGRAM_WEBHOOK_URL non configuré' }, { status: 500 })
    if (!keyword || !location) return NextResponse.json({ error: 'Keyword et location requis' }, { status: 400 })
    const payload: Record<string, string> = { keyword, location, source, user_id: user.id }
    if (mode) payload.mode = mode
    const res = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) return NextResponse.json({ error: `n8n erreur: ${await res.text()}` }, { status: res.status })
    return NextResponse.json({ ok: true })
  }

  // Google — run in-app, respond immediately then process in background
  if (!keywords?.length) return NextResponse.json({ error: 'Au moins un métier requis' }, { status: 400 })

  for (const kw of keywords as string[]) {
    runGoogleSourcing({
      keyword: kw,
      location: location || '',
      country: country || 'France',
      gender: gender && gender !== 'any' ? gender : null,
      user_id: user.id,
    }).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
