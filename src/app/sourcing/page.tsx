'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Sparkles, CheckCircle, AlertCircle, ChevronRight, Loader2 } from 'lucide-react'

const KEYWORD_PRESETS = [
  'Naturopathe',
  'Coach bien-être',
  'Professeure de yoga',
  'Sophrologue',
  'Diététicienne',
  'Ostéopathe',
  'Coach nutrition',
  'Méditation & mindfulness',
]

const LOCATION_PRESETS = [
  'Paris',
  'Lyon',
  'Marseille',
  'Bordeaux',
  'Nantes',
  'Toulouse',
  'Lille',
  'France',
]

type State = 'idle' | 'loading' | 'running' | 'success' | 'error'

const WORKFLOW_DURATION = 45 // seconds to wait before showing "done"

export default function SourcingPage() {
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
    <div className="p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">Sourcer des prospects</h1>
        <p className="text-stone-500 text-sm mt-1">
          Lancez une recherche automatique pour trouver de nouveaux prospects à contacter.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-sky-50 border border-sky-100 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-sky-800 mb-3">Comment ça fonctionne ?</h2>
        <ol className="space-y-2">
          {[
            { icon: '🔍', text: 'Vous choisissez un type de profil (ex. "Naturopathe") et une ville (ex. "Lyon").' },
            { icon: '⚙️', text: 'Notre workflow lance une recherche Google Places et visite les sites web trouvés.' },
            { icon: '💾', text: 'Les profils sont automatiquement enregistrés dans l\'onglet "Découverts".' },
            { icon: '✉️', text: 'Il n\'y a plus qu\'à rédiger votre message et envoyer !' },
          ].map(({ icon, text }, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-sky-700">
              <span className="mt-0.5 shrink-0">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">

        {/* Keyword */}
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

        {/* Location */}
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
              onChange={e => setLocation(location => location = e.target.value)}
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

        {/* Preview */}
        {keyword && location && (
          <div className="flex items-center gap-2 text-sm text-stone-500 bg-stone-50 rounded-lg px-4 py-3 border border-stone-100">
            <Sparkles size={14} className="text-sage-500 shrink-0" />
            Recherche qui sera lancée :
            <span className="font-semibold text-stone-700">&ldquo;{keyword} {location}&rdquo;</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={state === 'loading' || state === 'running' || !keyword.trim() || !location.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-sage-500 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === 'loading' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Connexion…
            </>
          ) : (
            <>
              <Search size={16} />
              Lancer la recherche
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Running */}
      {state === 'running' && lastSearch && (
        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 size={18} className="text-amber-600 shrink-0 animate-spin" />
            <p className="text-sm font-medium text-amber-800">Workflow en cours…</p>
          </div>
          <p className="text-sm text-amber-700 mb-4">
            Recherche de <span className="font-medium">&ldquo;{lastSearch.keyword}&rdquo;</span> à{' '}
            <span className="font-medium">{lastSearch.location}</span> en cours.
            Les profils seront ajoutés à <strong>Découverts</strong> automatiquement.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-amber-100 rounded-full h-2">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((WORKFLOW_DURATION - countdown) / WORKFLOW_DURATION) * 100}%` }}
              />
            </div>
            <span className="text-xs text-amber-600 shrink-0 tabular-nums">{countdown}s</span>
          </div>
          <p className="text-xs text-amber-500 mt-3">
            ⏳ Patientez encore ~{countdown} secondes avant d&apos;aller dans{' '}
            <a href="/discovered" className="underline font-medium">Découverts</a>.
          </p>
        </div>
      )}

      {/* Success */}
      {state === 'success' && lastSearch && (
        <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Recherche terminée !</p>
            <p className="text-sm text-green-700 mt-1">
              Les profils <span className="font-medium">&ldquo;{lastSearch.keyword}&rdquo;</span> à{' '}
              <span className="font-medium">{lastSearch.location}</span> ont été ajoutés.{' '}
              <a href="/discovered" className="underline font-medium">Voir les Découverts →</a>
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="mt-5 bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-rose-800">Une erreur est survenue</p>
            <p className="text-sm text-rose-700 mt-1">{errorMsg}</p>
            <p className="text-xs text-rose-500 mt-2">
              Vérifiez que <code className="bg-rose-100 px-1 rounded">N8N_WEBHOOK_URL</code> est bien configuré dans le fichier <code className="bg-rose-100 px-1 rounded">.env.local</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
