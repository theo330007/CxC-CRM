'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, Sparkles, CheckCircle, AlertCircle,
  Loader2, ArrowRight, Instagram, ChevronLeft,
} from 'lucide-react'

const KEYWORD_PRESETS = [
  'Naturopathe', 'Coach bien-être', 'Professeure de yoga',
  'Sophrologue', 'Diététicienne', 'Ostéopathe',
  'Coach nutrition', 'Coach sportif', 'Psychologue',
]

const LOCATION_PRESETS = [
  'Paris', 'Lyon', 'Marseille', 'Bordeaux',
  'Nantes', 'Toulouse', 'Lille', 'France',
]

type State = 'idle' | 'loading' | 'running' | 'success' | 'error'
type Source = 'google' | 'instagram'
type IgMode = 'hashtag' | 'profile'

const GOOGLE_DURATION = 45
const INSTAGRAM_DURATION = 45

/** Build the hashtag preview the same way n8n does: strip accents, lowercase, no spaces */
function toHashtag(keyword: string, location: string) {
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '')
  return `#${normalize(keyword)}${normalize(location)}`
}

function Pill({
  label, active, rose, onClick,
}: { label: string; active: boolean; rose?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? rose ? 'bg-rose-500 text-white border-rose-500' : 'bg-sage-500 text-white border-sage-500'
          : rose
            ? 'bg-stone-50 text-stone-600 border-stone-200 hover:border-rose-300 hover:text-rose-600'
            : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-sage-300 hover:text-sage-700'
      }`}
    >
      {label}
    </button>
  )
}

export default function SourcingPage() {
  const router = useRouter()

  // Wizard
  const [step, setStep] = useState<1 | 2>(1)
  const [source, setSource] = useState<Source | null>(null)

  // Shared fields for both sources
  const [keyword, setKeyword] = useState('')       // Instagram only
  const [keywords, setKeywords] = useState<string[]>([])  // Google multi-select
  const [keywordInput, setKeywordInput] = useState('')    // Google text input
  const [location, setLocation] = useState('')
  const [country, setCountry] = useState('France')
  const [gender, setGender] = useState<'any' | 'female' | 'male'>('any')

  // Instagram-specific
  const [igMode, setIgMode] = useState<IgMode>('hashtag')

  // Run state
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [lastSearch, setLastSearch] = useState<{ label: string; source: Source } | null>(null)
  const [workflowDuration, setWorkflowDuration] = useState(GOOGLE_DURATION)
  const [countdown, setCountdown] = useState(GOOGLE_DURATION)

  useEffect(() => {
    if (state !== 'running') return
    setCountdown(workflowDuration)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); setState('success'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  function pickSource(s: Source) {
    setSource(s)
    setStep(2)
  }

  function goBack() {
    setStep(1)
    setSource(null)
    setState('idle')
    setErrorMsg('')
  }

  const canLaunch = source === 'google'
    ? keywords.length > 0
    : keyword.trim() !== '' && location.trim() !== ''
  const busy = state === 'loading' || state === 'running'

  async function handleLaunch() {
    if (!source || !canLaunch) return
    setState('loading')
    setErrorMsg('')

    const duration = source === 'instagram' ? INSTAGRAM_DURATION : GOOGLE_DURATION
    setWorkflowDuration(duration)

    const label = source === 'instagram'
      ? igMode === 'hashtag'
        ? `${toHashtag(keyword, location)} (hashtag)`
        : `"${keyword} ${location}" (profils)`
      : `${keywords.join(', ')}${location ? ` à ${location}` : ` — ${country || 'France'}`}`

    try {
      const body: Record<string, unknown> = { source }
      if (source === 'google') {
        body.keywords = keywords
        body.location = location.trim()
        body.country = country.trim() || 'France'
        if (gender !== 'any') body.gender = gender
      } else {
        body.keyword = keyword.trim()
        body.location = location.trim()
        body.mode = igMode
      }

      const res = await fetch('/api/trigger-sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setLastSearch({ label, source })
        localStorage.setItem('cxc_last_search_ts', Date.now().toString())
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

  const isInstagram = source === 'instagram'
  const accentRing = isInstagram ? 'focus:ring-rose-400' : 'focus:ring-sage-500'
  const btnClass = isInstagram
    ? 'bg-rose-500 hover:bg-rose-600'
    : 'bg-sage-500 hover:bg-sage-700'

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Sourcer des prospects</h1>
        <p className="text-stone-500 text-sm mt-1">
          Lancez une recherche automatique pour trouver de nouveaux prospects à contacter.
        </p>
      </div>

      {/* Status bars */}
      {state === 'running' && lastSearch && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <Loader2 size={16} className="text-amber-600 shrink-0 animate-spin" />
              <p className="text-sm font-medium text-amber-800">
                {lastSearch.source === 'instagram' ? 'Scraping Instagram' : 'Recherche Google Places'} — {lastSearch.label} en cours…
              </p>
            </div>
            <span className="text-xs text-amber-600 tabular-nums shrink-0">~{countdown}s</span>
          </div>
          <div className="bg-amber-100 rounded-full h-1.5">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${((workflowDuration - countdown) / workflowDuration) * 100}%` }}
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
              Recherche terminée — {lastSearch.label}
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
          </div>
        </div>
      )}

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

        {/* ── LEFT: Wizard ── */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">

          {/* Step 1 — pick source */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-stone-700">Quelle source voulez-vous utiliser ?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => pickSource('google')}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-stone-200 hover:border-sage-500 hover:bg-sage-300/10 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-stone-100 group-hover:bg-sage-300/30 flex items-center justify-center transition-colors">
                    <Search size={20} className="text-stone-500 group-hover:text-sage-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800 group-hover:text-sage-700">Google Places</p>
                    <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                      Trouve des professionnelles locales par métier et ville
                    </p>
                  </div>
                </button>

                <div className="relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-stone-100 bg-stone-50 cursor-not-allowed opacity-60 text-left">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                    <Instagram size={20} className="text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-500">Instagram</p>
                    <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                      Scrape des profils via hashtag niche + ville
                    </p>
                  </div>
                  <span className="absolute top-2.5 right-2.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-500">
                    Bientôt
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — shared form, styled per source */}
          {step === 2 && source && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <button onClick={goBack} disabled={busy} className="text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-40">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                  {isInstagram
                    ? <Instagram size={16} className="text-rose-500" />
                    : <Search size={16} className="text-sage-500" />
                  }
                  <span className="text-sm font-semibold text-stone-700">
                    {isInstagram ? 'Instagram' : 'Google Places'}
                  </span>
                </div>
              </div>

              {/* ── Google form ── */}
              {!isInstagram && (
                <div className="space-y-5">
                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Pays</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['France', 'Belgique', 'Suisse', 'Canada'].map(c => (
                        <Pill key={c} label={c} active={country === c} onClick={() => setCountry(c)} />
                      ))}
                    </div>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        placeholder="ex. France, Belgique, Suisse…"
                        className={`w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 ${accentRing}`}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Ville ou région <span className="text-stone-400 font-normal">(optionnel)</span>
                    </label>
                    <div className="relative mb-2">
                      <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="Laisser vide pour tout le pays…"
                        className={`w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 ${accentRing}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Pill label="Tout le pays" active={location === ''} onClick={() => setLocation('')} />
                      {['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Nantes', 'Toulouse', 'Lille'].map(l => (
                        <Pill key={l} label={l} active={location === l} onClick={() => setLocation(l)} />
                      ))}
                    </div>
                  </div>

                  {/* Jobs multi-select */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Métier(s) ciblé(s) ou autres critères</label>
                    <p className="text-xs text-stone-400 mb-2">Sélectionnez un ou plusieurs métiers — chacun fera l&apos;objet d&apos;une recherche séparée.</p>
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {keywords.map(k => (
                          <span key={k} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-sage-500 text-white">
                            {k}
                            <button type="button" onClick={() => setKeywords(prev => prev.filter(x => x !== k))} className="hover:opacity-70 leading-none">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="relative mb-2">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && keywordInput.trim()) {
                            e.preventDefault()
                            const val = keywordInput.trim()
                            if (!keywords.includes(val)) setKeywords(prev => [...prev, val])
                            setKeywordInput('')
                          }
                        }}
                        placeholder="Tapez un métier et appuyez sur Entrée…"
                        className={`w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 ${accentRing}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {KEYWORD_PRESETS.map(k => (
                        <Pill
                          key={k} label={k} active={keywords.includes(k)}
                          onClick={() => setKeywords(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Genre</label>
                    <p className="text-xs text-stone-400 mb-2">Google Places ne fournit pas toujours cette donnée — filtre indicatif.</p>
                    <div className="flex gap-2">
                      {([['any', 'Tous'], ['female', 'Femme'], ['male', 'Homme']] as const).map(([value, label]) => (
                        <Pill key={value} label={label} active={gender === value} onClick={() => setGender(value)} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Instagram form ── */}
              {isInstagram && (
                <div className="space-y-5">
                  {/* Keyword */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Niche / profession</label>
                    <p className="text-xs text-stone-400 mb-3">Sera combiné avec la ville pour former le hashtag (ex. naturopathe + paris → #naturopatheparis).</p>
                    <div className="relative mb-3">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        placeholder="ex. Naturopathe, Coach bien-être…"
                        className={`w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 ${accentRing}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {KEYWORD_PRESETS.map(k => (
                        <Pill key={k} label={k} active={keyword === k} rose onClick={() => setKeyword(k)} />
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Ville ou région</label>
                    <div className="relative mb-3">
                      <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="ex. Paris, Lyon, Bordeaux…"
                        className={`w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 ${accentRing}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {LOCATION_PRESETS.map(l => (
                        <Pill key={l} label={l} active={location === l} rose onClick={() => setLocation(l)} />
                      ))}
                    </div>
                  </div>

                  {/* Mode toggle */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Mode de recherche</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIgMode('hashtag')}
                        className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border-2 text-left transition-colors ${
                          igMode === 'hashtag' ? 'border-rose-400 bg-rose-50' : 'border-stone-200 hover:border-rose-200'
                        }`}
                      >
                        <span className={`text-xs font-semibold ${igMode === 'hashtag' ? 'text-rose-600' : 'text-stone-600'}`}># Hashtag</span>
                        <span className="text-xs text-stone-400">Qui poste sur la niche</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIgMode('profile')}
                        className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border-2 text-left transition-colors ${
                          igMode === 'profile' ? 'border-rose-400 bg-rose-50' : 'border-stone-200 hover:border-rose-200'
                        }`}
                      >
                        <span className={`text-xs font-semibold ${igMode === 'profile' ? 'text-rose-600' : 'text-stone-600'}`}>@ Profils</span>
                        <span className="text-xs text-stone-400">Comptes sur la niche</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview */}
              {((!isInstagram && keywords.length > 0) || (isInstagram && keyword && location)) && (
                <div className={`flex items-center gap-2 text-sm text-stone-500 rounded-lg px-4 py-3 border ${
                  isInstagram ? 'bg-rose-50 border-rose-100' : 'bg-stone-50 border-stone-100'
                }`}>
                  <Sparkles size={14} className={`shrink-0 ${isInstagram ? 'text-rose-400' : 'text-sage-500'}`} />
                  {isInstagram ? (
                    igMode === 'hashtag'
                      ? <>Hashtag : <span className="font-semibold text-stone-700">{toHashtag(keyword, location)}</span></>
                      : <>Recherche profils : <span className="font-semibold text-stone-700">&ldquo;{keyword} {location}&rdquo;</span></>
                  ) : (
                    <>Recherche : <span className="font-semibold text-stone-700">{keywords.join(', ')}{location ? ` — ${location}` : ''}, {country || 'France'}</span></>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleLaunch}
                disabled={busy || !canLaunch}
                className={`w-full flex items-center justify-center gap-2 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnClass}`}
              >
                {busy
                  ? <><Loader2 size={16} className="animate-spin" /> En cours…</>
                  : isInstagram
                    ? <><Instagram size={16} /> Lancer Instagram</>
                    : <><Search size={16} /> Lancer Google Places</>
                }
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: How it works ── */}
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-sky-800 mb-4">Comment ça fonctionne ?</h2>
          <ol className="space-y-4">
            {[
              { icon: '🎯', title: 'Choisissez une source', text: 'Google Places pour les pros locales, Instagram pour les créatrices de contenu.' },
              { icon: '⚙️', title: "L'outil se lance automatiquement", text: 'La recherche démarre en arrière-plan et collecte les profils correspondant à vos critères.' },
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
