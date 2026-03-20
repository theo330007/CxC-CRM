import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY non configuré' }, { status: 500 })
  }

  const { name, niche, draft } = await req.json()

  const prompt = `Tu es Camille, co-fondatrice de CamilleXCamille (CxC), un programme d'accompagnement entrepreneurial pour femmes du bien-être.

Tu dois proposer 3 objets d'email courts et percutants pour contacter ${name}${niche ? ` (${niche})` : ''}.

${draft ? `Le message d'approche est le suivant :\n"${draft.slice(0, 300)}"\n` : ''}

Règles :
- Chaque objet fait 5 à 10 mots maximum
- Ton chaleureux, humain, pas commercial
- Pas de majuscules inutiles ni de ponctuation excessive
- Ne commence pas par "Re:" ou "Fwd:"
- Retourne uniquement les 3 objets, un par ligne, sans numérotation ni explication`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 100 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const subjects = text.split('\n').map((s: string) => s.trim()).filter(Boolean).slice(0, 3)
  return NextResponse.json({ subjects })
}
