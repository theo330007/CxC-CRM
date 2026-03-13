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

  const prompt = `Tu es une assistante stratégique pour CamilleXCamille (CxC), un programme d'accompagnement entrepreneurial pour femmes du bien-être.

Positionnement CxC : "Nous aidons les femmes du bien-être à devenir entrepreneures grâce à un accompagnement qui allie profondeur humaine et stratégie entrepreneuriale."

Ce que propose CxC : un programme structuré combinant diagnostic business, méthode pas à pas et accompagnement collectif — pour aider les femmes entrepreneures du bien-être à structurer leur activité sans renoncer à leur authenticité, et développer une vraie autonomie entrepreneuriale.

CxC cherche des prospects qui :
- Sont des femmes entrepreneures ou indépendantes dans le bien-être (naturopathes, coachs, sophrologues, profs de yoga, diététiciennes, thérapeutes, etc.)
- Ont une activité déjà lancée mais qui cherchent à la structurer, la développer ou la rentabiliser
- Semblent vouloir concilier impact, liberté et stabilité financière
- Partagent des valeurs d'authenticité, d'accompagnement humain, de profondeur
- Sont basées en France ou francophones

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
