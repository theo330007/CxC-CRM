import https from 'https'
import http from 'http'

const agent = new https.Agent({ rejectUnauthorized: false })

export async function scrapeHtml(url: string, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(''), timeoutMs)

    const done = (html: string) => { clearTimeout(timer); resolve(html) }

    const attempt = (targetUrl: string, redirects = 0) => {
      if (redirects > 5) return done('')
      const isHttps = targetUrl.startsWith('https')
      const lib = isHttps ? https : http
      const options: https.RequestOptions = {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CxC-bot/1.0)' },
        timeout: timeoutMs,
        ...(isHttps ? { agent } : {}),
      }
      const req = lib.get(targetUrl, options, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, targetUrl).href
          res.resume()
          attempt(next, redirects + 1)
          return
        }
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => done(Buffer.concat(chunks).toString('utf-8', 0, 500_000)))
        res.on('error', () => done(''))
      })
      req.on('error', () => done(''))
      req.on('timeout', () => { req.destroy(); done('') })
    }

    attempt(url)
  })
}
