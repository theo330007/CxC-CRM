import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_TEMPLATE } from '@/lib/settings'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY non configuré' }, { status: 500 })
  }

  const { name, niche, bio_data, profile_url, analysis, template } = await req.json()

  const usedTemplate: string = template ?? DEFAULT_TEMPLATE

  // Extract first name
  const prenom = name?.split(' ')[0] ?? name ?? ''

  // Build prompt to generate only the {{personnalisation}} placeholder
  const analysisSection = analysis ? `
Analyse CxC déjà réalisée sur ce profil :
- Score : ${analysis.score}/5 — ${analysis.verdict}
- Résumé : ${analysis.resume}
- Points forts : ${analysis.points_forts?.join(', ') || 'aucun'}
- Points d'attention : ${analysis.points_attention?.join(', ') || 'aucun'}
` : ''

  const prompt = `Tu dois générer UNE SEULE courte phrase de personnalisation (10-20 mots max) pour remplir le placeholder {{personnalisation}} dans un email d'approche.

Ce placeholder s'insère dans la phrase : "On est tombées sur {{personnalisation}} et on a eu envie de t'écrire."

La personnalisation doit faire référence à quelque chose de concret et spécifique au profil de cette personne (son compte, sa bio, une publication, son activité).

Profil :
- Nom : ${name}
- Niche / activité : ${niche ?? 'non précisée'}
- Profil URL : ${profile_url ?? 'non disponible'}
- Bio : ${bio_data ?? 'non disponible'}
${analysisSection}
Réponds UNIQUEMENT avec la phrase de personnalisation, sans guillemets, sans explication, sans ponctuation finale.
Exemple : "ton compte dédié au yoga prénatal"
Exemple : "tes publications sur l'accompagnement en naturopathie"`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 80 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  const personnalisation = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim().replace(/^["']|["']$/g, '')

  const message = usedTemplate
    .replace(/\{\{Prénom\}\}/g, prenom)
    .replace(/\{\{personnalisation\}\}/g, personnalisation)

  return NextResponse.json({ message })
}
