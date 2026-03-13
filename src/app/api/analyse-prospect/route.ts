import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY non configuré' }, { status: 500 })
  }

  const { name, niche, bio_data, profile_url } = await req.json()
  if (!bio_data) {
    return NextResponse.json({ error: 'Pas de bio disponible pour analyser.' }, { status: 400 })
  }

  const prompt = `Tu es une assistante stratégique pour CamilleXCamille (CxC), une marque française de contenu bien-être qui cherche à collaborer avec des professionnels du bien-être (naturopathes, coachs, profs de yoga, sophrologues, etc.).

CxC cherche des profils qui :
- Sont dans la niche bien-être / santé naturelle / développement personnel
- Ont une communauté (même petite) engagée
- Partagent des valeurs de bienveillance, authenticité, lenteur, nature
- Sont basés en France ou francophones
- Pourraient être ouverts à une collaboration ou à recevoir une prestation CxC

Voici le profil à analyser :
- Nom : ${name}
- Niche : ${niche ?? 'non précisée'}
- URL profil : ${profile_url ?? 'non disponible'}
- Bio / description du site : ${bio_data}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "score": <nombre entier de 1 à 5>,
  "verdict": "<Excellent match | Bon match | Match moyen | Faible match | Pas adapté>",
  "points_forts": ["<point 1>", "<point 2>", "<point 3 max>"],
  "points_attention": ["<point 1>", "<point 2 max>"],
  "resume": "<2-3 phrases max expliquant pourquoi ce profil est ou n'est pas pertinent pour CxC>"
}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Strip markdown code fences if Gemini wraps the JSON
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  try {
    const analysis = JSON.parse(cleaned)
    return NextResponse.json(analysis)
  } catch {
    return NextResponse.json({ error: 'Réponse invalide de Gemini', raw }, { status: 500 })
  }
}
