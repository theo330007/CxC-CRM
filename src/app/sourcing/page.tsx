'use client'

import { useState } from 'react'
import { Search, MapPin, Sparkles, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'

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

type State = 'idle' | 'loading' | 'success' | 'error'

export default function SourcingPage() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [lastSearch, setLastSearch] = useState<{ keyword: string; location: string } | null>(null)

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
        setState('success')
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
          disabled={state === 'loading' || !keyword.trim() || !location.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-sage-500 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === 'loading' ? (
            <>
              <span className="animate-spin text-lg">⚙️</span>
              Recherche en cours…
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

      {/* Success */}
      {state === 'success' && lastSearch && (
        <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Recherche lancée avec succès !</p>
            <p className="text-sm text-green-700 mt-1">
              Le workflow cherche <span className="font-medium">&ldquo;{lastSearch.keyword}&rdquo;</span> à{' '}
              <span className="font-medium">{lastSearch.location}</span>.
              Les résultats apparaîtront dans l&apos;onglet{' '}
              <a href="/discovered" className="underline font-medium">Découverts</a>{' '}
              dans quelques instants.
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
