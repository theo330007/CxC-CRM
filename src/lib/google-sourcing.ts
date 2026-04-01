import { createClient } from '@supabase/supabase-js'

const COUNTRY_CODES: Record<string, string> = {
  'france': 'FR', 'belgique': 'BE', 'belgium': 'BE',
  'suisse': 'CH', 'switzerland': 'CH', 'canada': 'CA',
  'luxembourg': 'LU', 'maroc': 'MA', 'morocco': 'MA',
  'espagne': 'ES', 'spain': 'ES', 'italie': 'IT', 'italy': 'IT',
  'allemagne': 'DE', 'germany': 'DE', 'royaume-uni': 'GB',
  'united kingdom': 'GB', 'états-unis': 'US', 'united states': 'US',
  'pays-bas': 'NL', 'netherlands': 'NL', 'portugal': 'PT',
}

async function scrapeHtml(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CxC-bot/1.0)' },
    })
    clearTimeout(timer)
    return await res.text()
  } catch {
    clearTimeout(timer)
    return ''
  }
}

function cleanHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
}

function decodeEntities(str: string): string {
  return str
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#8211;/g, '\u2013').replace(/&#8212;/g, '\u2014')
    .replace(/&#[0-9]+;/g, ' ').replace(/&[a-z]+;/g, ' ')
}

function extractEmail(html: string): string | null {
  const mailto = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
  if (mailto) return mailto[1]
  const plain = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return plain ? plain[0] : null
}

function extractInstagram(html: string): string | null {
  const matches = [...html.matchAll(/href=["']https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]{3,30})\/?["']/gi)]
  const SKIP = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'tv', 'tags', 'accounts', 'about', 'legal', 'help', 'press', 'api', 'blog'])
  for (const m of matches) {
    if (!SKIP.has(m[1].toLowerCase())) return 'https://www.instagram.com/' + m[1] + '/'
  }
  return null
}

function extractBio(homepageHtml: string): string | null {
  const cleaned = cleanHtml(homepageHtml)
  const pTags = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? []
  const texts = pTags
    .map(tag => decodeEntities(tag.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()))
    .filter(t => t.length > 30)
  return texts.join('\n\n').slice(0, 3000) || null
}

function extractCity(addressComponents: Array<{ longText: string; types: string[] }>): string | null {
  return addressComponents?.find(c => c.types.includes('locality'))?.longText ?? null
}

export async function runGoogleSourcing(params: {
  keyword: string
  location: string
  country: string
  gender: string | null
  user_id: string
}) {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!googleApiKey) { console.error('[sourcing] Missing GOOGLE_PLACES_API_KEY'); return }
  if (!serviceKey) { console.error('[sourcing] Missing SUPABASE_SERVICE_ROLE_KEY'); return }

  const { keyword, location, country, gender, user_id } = params
  const regionCode = COUNTRY_CODES[country.toLowerCase().trim()] ?? 'FR'
  const query = [keyword, location, country].filter(Boolean).join(', ')

  // 1. Google Places search
  let places: Record<string, unknown>[] = []
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'places.displayName.text,places.websiteUri,places.nationalPhoneNumber,places.addressComponents',
      },
      body: JSON.stringify({ textQuery: query, languageCode: 'fr', maxResultCount: 20, regionCode }),
    })
    const data = await res.json()
    places = data.places ?? []
  } catch (e) {
    console.error('[sourcing] Google Places error:', e)
    return
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // 2. Process each place
  for (const place of places) {
    const websiteUrl = (place.websiteUri as string) || null
    const phone = (place.nationalPhoneNumber as string) ?? null
    const city = extractCity((place.addressComponents as Array<{ longText: string; types: string[] }>) ?? [])
    const name = (place.displayName as { text: string })?.text ?? null

    // 3. Skip if already exists for this user (by website or by name if no website)
    if (websiteUrl) {
      const { data: existing } = await admin.from('prospects').select('id').eq('profile_url', websiteUrl).eq('user_id', user_id).limit(1)
      if (existing && existing.length > 0) continue
    } else if (name) {
      const { data: existing } = await admin.from('prospects').select('id').eq('name', name).eq('user_id', user_id).limit(1)
      if (existing && existing.length > 0) continue
    }

    // 4. Scrape website if available
    let bio_data = null, contact_email = null, instagram_url = null
    if (websiteUrl) {
      const contactUrl = websiteUrl.replace(/\/$/, '') + '/contact'
      const [homepageHtml, contactHtml] = await Promise.all([
        scrapeHtml(websiteUrl, 10000),
        scrapeHtml(contactUrl, 8000),
      ])
      const cleanedHome = cleanHtml(homepageHtml)
      const cleanedContact = cleanHtml(contactHtml)
      bio_data = extractBio(homepageHtml)
      contact_email = extractEmail(cleanedContact) ?? extractEmail(cleanedHome)
      instagram_url = extractInstagram(cleanedHome) ?? extractInstagram(cleanedContact)
    }

    // 5. Insert
    const { error } = await admin.from('prospects').insert({
      name, niche: keyword, profile_url: websiteUrl,
      bio_data, contact_email, phone, instagram_url,
      gender, city, user_id, source: 'Google', status: 'discovered',
    })

    if (error) console.error('[sourcing] Insert error:', error.message)
  }

  console.log(`[sourcing] Done: ${keyword} / ${location} / ${country} → ${places.length} places processed`)
}
