'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, Sparkles, CheckCircle, AlertCircle,
  Loader2, ArrowRight,
} from 'lucide-react'

const KEYWORD_PRESETS = [
  'Naturopathe', 'Coach bien-être', 'Professeure de yoga',
  'Sophrologue', 'Diététicienne', 'Ostéopathe',
  'Coach nutrition', 'Méditation & mindfulness',
]

const LOCATION_PRESETS = [
  'Paris', 'Lyon', 'Marseille', 'Bordeaux',
  'Nantes', 'Toulouse', 'Lille', 'France',
]

type State = 'idle' | 'loading' | 'running' | 'success' | 'error'

const WORKFLOW_DURATION = 45

export default function SourcingPage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [lastSearch, setLastSearch] = useState<{ keyword: string; location: string } | null>(null)
  const [countdown, setCountdown] = useState(WORKFLOW_DURATION)

  useEffect(() => {
    if (state !== 'running') return
    setCountdown(WORKFLOW_DURATION)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); setState('success'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword.trim() || !location.trim()) return
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/trigger-sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), location: location.trim() }),
      })
      if (res.ok) {
        setLastSearch({ keyword: keyword.trim(), location: location.trim() })
        setState('running')
      } else {
        const data = await res.json()
        setErrorMsg(data.error ?? 'Une erreur est survenue.')
        setState('error')
      }
    } catch {
      setErrorMsg('Impossible de contacter le serveur.')
      setState('error')
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Sourcer des prospects</h1>
        <p className="text-stone-500 text-sm mt-1">
          Lancez une recherche automatique pour trouver de nouveaux prospects à contacter.
        </p>
      </div>

      {/* Status bar — full width, shown when active */}
      {state === 'running' && lastSearch && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <Loader2 size={16} className="text-amber-600 shrink-0 animate-spin" />
              <p className="text-sm font-medium text-amber-800">
                Recherche de &ldquo;{lastSearch.keyword}&rdquo; à {lastSearch.location} en cours…
              </p>
            </div>
            <span className="text-xs text-amber-600 tabular-nums shrink-0">~{countdown}s</span>
          </div>
          <div className="bg-amber-100 rounded-full h-1.5">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${((WORKFLOW_DURATION - countdown) / WORKFLOW_DURATION) * 100}%` }}
            />
          </div>
          <p className="text-xs text-amber-500 mt-2">
            Les profils seront ajoutés à <strong>Découverts</strong> automatiquement.
          </p>
        </div>
      )}

      {state === 'success' && lastSearch && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800">
              Recherche terminée — &ldquo;{lastSearch.keyword}&rdquo; à {lastSearch.location}
            </p>
          </div>
          <button
            onClick={() => router.push('/discovered')}
            className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-900 transition-colors"
          >
            Voir Découverts <ArrowRight size={13} />
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-800">Une erreur est survenue</p>
            <p className="text-sm text-rose-700">{errorMsg}</p>
            <p className="text-xs text-rose-500 mt-1">
              Vérifiez que <code className="bg-rose-100 px-1 rounded">N8N_WEBHOOK_URL</code> est bien configuré dans <code className="bg-rose-100 px-1 rounded">.env.local</code>.
            </p>
          </div>
        </div>
      )}

      {/* Two-column: form left, how-it-works right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

        {/* ── LEFT: Form ── */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Type de profil recherché
            </label>
            <p className="text-xs text-stone-400 mb-3">
              Le métier ou la niche que vous ciblez. Soyez précise pour de meilleurs résultats.
            </p>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="ex. Naturopathe, Coach bien-être…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                required
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {KEYWORD_PRESETS.map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKeyword(k)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    keyword === k
                      ? 'bg-sage-500 text-white border-sage-500'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-sage-300 hover:text-sage-700'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Ville ou région
            </label>
            <p className="text-xs text-stone-400 mb-3">
              La zone géographique où vous souhaitez trouver des profils.
            </p>
            <div className="relative mb-3">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="ex. Paris, Lyon, Bordeaux…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                required
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {LOCATION_PRESETS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocation(l)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    location === l
                      ? 'bg-sage-500 text-white border-sage-500'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-sage-300 hover:text-sage-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {keyword && location && (
            <div className="flex items-center gap-2 text-sm text-stone-500 bg-stone-50 rounded-lg px-4 py-3 border border-stone-100">
              <Sparkles size={14} className="text-sage-500 shrink-0" />
              Recherche qui sera lancée :
              <span className="font-semibold text-stone-700">&ldquo;{keyword} {location}&rdquo;</span>
            </div>
          )}

          <button
            type="submit"
            disabled={state === 'loading' || state === 'running' || !keyword.trim() || !location.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-sage-500 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state === 'loading' ? (
              <><Loader2 size={16} className="animate-spin" /> Connexion…</>
            ) : state === 'running' ? (
              <><Loader2 size={16} className="animate-spin" /> En cours…</>
            ) : (
              <><Search size={16} /> Lancer la recherche</>
            )}
          </button>
        </form>

        {/* ── RIGHT: How it works ── */}
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-sky-800 mb-4">Comment ça fonctionne ?</h2>
          <ol className="space-y-4">
            {[
              { icon: '🔍', title: 'Choisissez une niche', text: 'Sélectionnez un type de profil (ex. "Naturopathe") et une ville.' },
              { icon: '⚙️', title: 'Le workflow se lance', text: 'Une recherche Google Places visite automatiquement les sites trouvés.' },
              { icon: '💾', title: 'Profils enregistrés', text: 'Les prospects sont ajoutés dans l\'onglet "Découverts" sans intervention.' },
              { icon: '✉️', title: 'Plus qu\'à envoyer', text: 'Rédigez votre message (ou générez-le avec l\'IA) et lancez la prise de contact.' },
            ].map(({ icon, title, text }, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="text-sm font-medium text-sky-800">{title}</p>
                  <p className="text-xs text-sky-600 mt-0.5 leading-relaxed">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  )
}
