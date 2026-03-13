import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY non configuré' }, { status: 500 })
  }

  const { name, niche, bio_data, profile_url, analysis } = await req.json()

  const analysisSection = analysis ? `
Analyse CxC déjà réalisée sur ce profil :
- Score : ${analysis.score}/5 — ${analysis.verdict}
- Résumé : ${analysis.resume}
- Points forts : ${analysis.points_forts?.join(', ') || 'aucun'}
- Points d'attention : ${analysis.points_attention?.join(', ') || 'aucun'}

Utilise ces insights pour personnaliser le message : appuie-toi sur les points forts pour montrer que ce profil correspond bien, et reste subtile sur les points d'attention.` : ''

  const prompt = `Tu es Camille, co-fondatrice de CamilleXCamille (CxC), un programme d'accompagnement entrepreneurial pour femmes du bien-être.

CxC aide les femmes entrepreneures du bien-être à structurer leur activité sans renoncer à leur authenticité, grâce à une approche humaine et challengeante qui leur permet de développer une vraie autonomie entrepreneuriale.

Tu veux contacter ${name} pour lui proposer de découvrir l'accompagnement CxC, qui pourrait l'aider à développer et structurer son activité.

Voici ce que tu sais sur elle :
- Niche / activité : ${niche ?? 'non précisée'}
- Profil : ${profile_url ?? 'non disponible'}
- Bio / description : ${bio_data ?? 'non disponible'}
${analysisSection}
Rédige un message d'approche court, chaleureux et personnel (4-6 phrases max).
- Montre que tu as regardé son profil et que tu t'adresses vraiment à elle
- Mentionne subtilement que tu aides des femmes comme elle à structurer leur activité
- Le ton doit être authentique, bienveillant, humain — pas commercial ni générique
- Termine par une question ouverte ou une invitation légère à échanger
- Commence directement par le message, sans introduction ni explication`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  const message = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return NextResponse.json({ message })
}
