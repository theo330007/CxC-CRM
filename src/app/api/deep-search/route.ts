import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scrapeHtml } from '@/lib/scraper'

const PAGES = ['', '/contact', '/nous-contacter', '/a-propos', '/mentions-legales']

function clean(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
}

function extractEmail(html: string): string | null {
  const m = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
  if (m) return m[1]
  const p = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return p ? p[0] : null
}

function extractPhone(html: string): string | null {
  const m = html.match(/(?:\+33[\s.\-]?|0033[\s.\-]?|0)[1-9](?:[\s.\-]?\d{2}){4}/)
  return m ? m[0].replace(/\s+/g, ' ').trim() : null
}

export async function POST(req: NextRequest) {
  const { id, profile_url } = await req.json()
  if (!id || !profile_url) return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configuré' }, { status: 500 })

  const base = profile_url.replace(/\/$/, '')
  const urls = PAGES.map(p => base + p)

  // Scrape all pages in parallel
  const htmlPages = await Promise.all(urls.map(url => scrapeHtml(url)))

  let contact_email: string | null = null
  let phone: string | null = null

  for (const html of htmlPages) {
    const cleaned = clean(html)
    if (!phone) phone = extractPhone(cleaned)
    if (!contact_email) contact_email = extractEmail(cleaned)
  }

  // Prefer email from legal/mentions page (last page = /mentions-legales)
  const legalEmail = extractEmail(clean(htmlPages[4] ?? ''))
  if (legalEmail) contact_email = legalEmail

  // Update prospect
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
  const { error } = await admin
    .from('prospects')
    .update({ contact_email, phone })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, contact_email, phone })
}
