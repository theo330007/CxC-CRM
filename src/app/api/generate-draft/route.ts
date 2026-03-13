import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const { name, niche, bio_data, profile_url } = await req.json()

  const prompt = `Tu es Camille, une créatrice de contenu bien-être française.
Tu veux contacter ${name} pour collaborer ou lui proposer tes services.

Voici ce que tu sais sur ce prospect :
- Niche : ${niche ?? 'non précisée'}
- Profil : ${profile_url ?? 'non disponible'}
- Bio / description : ${bio_data ?? 'non disponible'}

Rédige un message d'approche court, chaleureux et personnel (4-6 phrases max).
Le ton doit être authentique, bienveillant et non commercial.
Commence directement par le message, sans introduction ni explication.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  const message = data.content?.[0]?.text ?? ''
  return NextResponse.json({ message })
}
