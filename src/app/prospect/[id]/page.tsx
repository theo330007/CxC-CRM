'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProspect, updateProspect, deleteProspect } from '@/lib/supabase'
import type { Prospect, ProspectStatus } from '@/lib/types'
import {
  ArrowLeft, Copy, Check, Send, CheckCircle, XCircle,
  Trash2, ExternalLink, Sparkles, Calendar, Star, AlertTriangle, Zap,
  Mail, Phone, ScanSearch, Loader2,
} from 'lucide-react'

const STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string }> = {
  discovered: { label: 'Découvert',  color: 'bg-sky-100 text-sky-700' },
  drafted:    { label: 'Brouillon',  color: 'bg-amber-100 text-amber-700' },
  sent:       { label: 'Envoyé',     color: 'bg-violet-100 text-violet-700' },
  replied:    { label: 'Répondu',    color: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rejeté',     color: 'bg-rose-100 text-rose-700' },
}

const SCORE_COLORS = ['', 'bg-rose-100 text-rose-700', 'bg-orange-100 text-orange-700', 'bg-amber-100 text-amber-700', 'bg-lime-100 text-lime-700', 'bg-green-100 text-green-700']

type Analysis = {
  score: number
  verdict: string
  points_forts: string[]
  points_attention: string[]
  resume: string
}

export default function ProspectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [draft, setDraft] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analysing, setAnalysing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [deepSearching, setDeepSearching] = useState(false)
  const [deepSearchStatus, setDeepSearchStatus] = useState<'idle' | 'running' | 'found' | 'notfound' | 'error'>('idle')
  const [showEmailSend, setShowEmailSend] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [suggestingSubject, setSuggestingSubject] = useState(false)
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([])

  useEffect(() => {
    getProspect(id).then((p) => {
      if (p) {
        setProspect(p)
        setDraft(p.draft_message ?? '')
        setEmail(p.contact_email ?? '')
        setPhone(p.phone ?? '')
        setEmailSubject(`Opportunité CxC — ${p.name}`)
      }
    })
  }, [id])

  async function save(patch: Partial<Omit<Prospect, 'id' | 'created_at'>>) {
    setSaving(true)
    await updateProspect(id, patch)
    setProspect(p => p ? { ...p, ...patch } : p)
    setSaving(false)
  }

  async function copyDraft() {
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function generateDraft() {
    if (!prospect) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prospect.name,
          niche: prospect.niche,
          bio_data: prospect.bio_data,
          profile_url: prospect.profile_url,
          analysis: analysis ?? null,
        }),
      })
      if (res.ok) {
        const { message } = await res.json()
        setDraft(message)
        await save({ draft_message: message, status: 'drafted' })
      }
    } finally {
      setGenerating(false)
    }
  }

  async function analyseProspect() {
    if (!prospect) return
    setAnalysing(true)
    setAnalysisError('')
    setAnalysis(null)
    try {
      const res = await fetch('/api/analyse-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: prospect.name, niche: prospect.niche, bio_data: prospect.bio_data, profile_url: prospect.profile_url }),
      })
      const data = await res.json()
      if (res.ok) setAnalysis(data)
      else setAnalysisError(data.error ?? 'Erreur inconnue.')
    } catch {
      setAnalysisError('Impossible de contacter le serveur.')
    } finally {
      setAnalysing(false)
    }
  }

  async function deepSearch() {
    if (!prospect) return
    setDeepSearching(true)
    setDeepSearchStatus('running')
    try {
      const res = await fetch('/api/deep-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospect.id, profile_url: prospect.profile_url }),
      })
      if (!res.ok) { setDeepSearchStatus('error'); setDeepSearching(false); return }
      // n8n responds immediately; workflow runs async and updates Supabase directly
      // Wait 5s then re-fetch to pick up any newly found contact info
      await new Promise(resolve => setTimeout(resolve, 5000))
      const updated = await getProspect(id)
      if (updated) {
        setProspect(updated)
        setEmail(updated.contact_email ?? '')
        setPhone(updated.phone ?? '')
        setDeepSearchStatus(updated.contact_email || updated.phone ? 'found' : 'notfound')
      }
    } catch {
      setDeepSearchStatus('error')
    } finally {
      setDeepSearching(false)
    }
  }

  async function suggestSubjects() {
    if (!prospect) return
    setSuggestingSubject(true)
    setSubjectSuggestions([])
    try {
      const res = await fetch('/api/suggest-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: prospect.name, niche: prospect.niche, draft }),
      })
      if (res.ok) {
        const { subjects } = await res.json()
        setSubjectSuggestions(subjects)
      }
    } finally {
      setSuggestingSubject(false)
    }
  }

  function openGmailCompose() {
    const url = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(draft)}`
    window.open(url, '_blank')
    save({ status: 'sent' })
  }

  async function handleDelete() {
    await deleteProspect(id)
    router.push('/discovered')
  }

  if (!prospect) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400 animate-pulse">
        Chargement…
      </div>
    )
  }

  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[prospect.status]

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm transition-colors">
          <ArrowLeft size={16} /> Retour
        </button>
        <button onClick={() => setShowDelete(!showDelete)} className="text-stone-400 hover:text-rose-500 transition-colors" title="Supprimer">
          <Trash2 size={16} />
        </button>
      </div>

      {showDelete && (
        <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-rose-700 font-medium">Supprimer ce prospect définitivement ?</p>
          <div className="flex gap-2">
            <button onClick={() => setShowDelete(false)} className="text-xs text-stone-600 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50">Annuler</button>
            <button onClick={handleDelete} className="text-xs text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg">Supprimer</button>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

        {/* ── LEFT PANEL ── */}
        <div className="space-y-4">

          {/* Identity card */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h1 className="text-xl font-semibold text-stone-800 mb-2 leading-snug">{prospect.name}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
              {prospect.niche && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">{prospect.niche}</span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-stone-400">
                <Calendar size={13} />
                <span>{new Date(prospect.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {prospect.profile_url && (
                <a href={prospect.profile_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sage-700 hover:underline">
                  <ExternalLink size={13} />
                  <span className="truncate">Voir le site / profil</span>
                </a>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Coordonnées</p>
              <button
                onClick={deepSearch}
                disabled={deepSearching}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 transition-colors disabled:opacity-40"
                title="Recherche approfondie — trouve l'email et le téléphone"
              >
                {deepSearching
                  ? <><Loader2 size={11} className="animate-spin" /> Recherche…</>
                  : <><ScanSearch size={11} /> Approfondir</>
                }
              </button>
            </div>

            {deepSearchStatus === 'found' && (
              <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-3">
                Coordonnées trouvées et enregistrées.
              </p>
            )}
            {deepSearchStatus === 'notfound' && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                Aucune coordonnée trouvée cette fois.
              </p>
            )}
            {deepSearchStatus === 'error' && (
              <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-3">
                Erreur lors de la recherche. Vérifiez que N8N_DEEP_SEARCH_URL est configuré.
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                  <Mail size={12} /> Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => save({ contact_email: email || null })}
                  placeholder="email@exemple.com"
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-500 text-stone-800 placeholder-stone-300"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                  <Phone size={12} /> Téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onBlur={() => save({ phone: phone || null })}
                  placeholder="+33 6 00 00 00 00"
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage-500 text-stone-800 placeholder-stone-300"
                />
              </div>
            </div>
          </div>

          {/* Gemini analysis */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-700">Analyse CxC</h2>
              <button
                onClick={analyseProspect}
                disabled={analysing || !prospect.bio_data}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-40"
                title={!prospect.bio_data ? 'Aucune bio disponible' : ''}
              >
                <Zap size={12} />
                {analysing ? 'Analyse…' : 'Analyser'}
              </button>
            </div>

            {!analysis && !analysing && !analysisError && (
              <p className="text-xs text-stone-400 leading-relaxed">
                Gemini évalue si ce profil est un bon match pour une collaboration CxC.
              </p>
            )}

            {analysing && (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-full" />
                <div className="h-3 bg-stone-100 rounded w-2/3" />
              </div>
            )}

            {analysisError && (
              <p className="text-xs text-rose-600 bg-rose-50 rounded-lg p-3">{analysisError}</p>
            )}

            {analysis && (
              <div className="space-y-3">
                <div className={`rounded-lg px-3 py-2.5 flex items-center justify-between ${SCORE_COLORS[analysis.score]}`}>
                  <span className="font-semibold text-sm">{analysis.verdict}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={13} className={i <= analysis.score ? 'fill-current' : 'opacity-25'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{analysis.resume}</p>
                {analysis.points_forts?.length > 0 && (
                  <ul className="space-y-1">
                    {analysis.points_forts.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-700">
                        <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                {analysis.points_attention?.length > 0 && (
                  <ul className="space-y-1">
                    {analysis.points_attention.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-700">
                        <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Status actions */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Changer le statut</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => save({ status: 'sent' })} disabled={saving || prospect.status === 'sent'}
                className="flex items-center gap-2 px-3 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed w-full">
                <Send size={14} /> Marquer envoyé
              </button>
              <button onClick={() => save({ status: 'replied' })} disabled={saving || prospect.status === 'replied'}
                className="flex items-center gap-2 px-3 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed w-full">
                <CheckCircle size={14} /> Répondu
              </button>
              <button onClick={() => save({ status: 'rejected' })} disabled={saving || prospect.status === 'rejected'}
                className="flex items-center gap-2 px-3 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed w-full">
                <XCircle size={14} /> Rejeté
              </button>
              {prospect.status !== 'discovered' && (
                <button onClick={() => save({ status: 'discovered' })} disabled={saving}
                  className="flex items-center gap-2 px-3 py-2.5 bg-stone-100 text-stone-600 text-sm font-medium rounded-lg hover:bg-stone-200 active:scale-95 transition-all disabled:opacity-40 w-full">
                  ↩ Remettre en découverts
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="space-y-5">

          {/* Draft message — hero action, always first */}
          <div className="bg-white rounded-xl border-2 border-sage-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Message d&apos;approche</h2>
              <div className="flex gap-2">
                {draft && (
                  <button onClick={copyDraft}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                    {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                )}
              </div>
            </div>

            {/* Templates */}
            <div className="mb-4">
              <p className="text-xs text-stone-400 mb-2">Templates de départ</p>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: 'Découverte douce',
                    text: `Bonjour ${prospect?.name?.split(' ')[0] ?? ''},\n\nJ'ai découvert votre profil et j'ai été touchée par votre approche — ce que vous faites résonne vraiment avec les femmes que j'accompagne.\n\nJe co-fonde CamilleXCamille, un programme pour les entrepreneures du bien-être qui veulent structurer leur activité sans perdre leur authenticité.\n\nSeriez-vous ouverte à en discuter quelques minutes ?`,
                  },
                  {
                    label: 'Valorisation profil',
                    text: `Bonjour ${prospect?.name?.split(' ')[0] ?? ''},\n\nVotre travail autour de ${prospect?.niche ?? 'votre activité'} m'a vraiment interpellée — il y a quelque chose d'authentique dans ce que vous portez.\n\nAvec CamilleXCamille, j'aide des femmes comme vous à donner une vraie structure à leur activité, pour aller encore plus loin.\n\nÇa vous dirait qu'on échange ?`,
                  },
                  {
                    label: 'Directe & courte',
                    text: `Bonjour ${prospect?.name?.split(' ')[0] ?? ''},\n\nJe travaille avec des entrepreneures du bien-être pour les aider à structurer et développer leur activité — et votre profil a retenu mon attention.\n\nSi vous êtes ouverte à en savoir plus, je serais ravie d'échanger avec vous.`,
                  },
                ].map(({ label, text }) => (
                  <button
                    key={label}
                    onClick={() => setDraft(text)}
                    className="text-xs px-2.5 py-1 rounded-full border border-stone-200 text-stone-600 bg-stone-50 hover:border-sage-300 hover:text-sage-700 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate CTA — prominent when no draft yet */}
            {!draft && !generating && (
              <button
                onClick={generateDraft}
                className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-sage-500 text-white text-sm font-medium rounded-lg hover:bg-sage-700 transition-colors"
              >
                <Sparkles size={15} />
                Générer un message avec l&apos;IA
              </button>
            )}

            {generating && (
              <div className="flex items-center gap-2 text-sm text-stone-400 py-3 mb-4">
                <Loader2 size={15} className="animate-spin text-sage-500" />
                Génération en cours…
              </div>
            )}

            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={draft ? 10 : 4}
              className="w-full border border-stone-200 rounded-xl p-4 text-sm text-stone-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-sage-500 resize-y"
              placeholder="Rédigez votre message ici…"
            />

            <div className="flex items-center justify-between mt-3">
              <button onClick={generateDraft} disabled={generating}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-sage-600 transition-colors disabled:opacity-40">
                <Sparkles size={12} />
                {generating ? 'Génération…' : 'Regénérer'}
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-400">{draft.length} caractères</span>
                <button
                  onClick={() => save({ draft_message: draft, status: 'drafted' })}
                  disabled={saving || !draft.trim()}
                  className="px-4 py-2 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-900 transition-colors disabled:opacity-40"
                >
                  {saving ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            {/* Send by email */}
            {draft && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                {!showEmailSend ? (
                  <button
                    onClick={() => setShowEmailSend(true)}
                    disabled={!email}
                    title={!email ? 'Aucun email pour ce prospect' : ''}
                    className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Mail size={14} />
                    {email ? 'Envoyer par email' : 'Envoyer par email (email manquant)'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-stone-500">Objet de l&apos;email</label>
                        <button
                          onClick={suggestSubjects}
                          disabled={suggestingSubject}
                          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition-colors disabled:opacity-40"
                        >
                          <Sparkles size={11} />
                          {suggestingSubject ? 'Génération…' : 'Suggérer'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)}
                        placeholder="ex: Une opportunité pour votre activité"
                        className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-800 placeholder-stone-300"
                      />
                      {subjectSuggestions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {subjectSuggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => { setEmailSubject(s); setSubjectSuggestions([]) }}
                              className="w-full text-left text-xs px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100 text-violet-700 hover:bg-violet-100 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openGmailCompose}
                        disabled={!emailSubject.trim()}
                        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40"
                      >
                        <Send size={14} />
                        Ouvrir dans Gmail
                      </button>
                      <button
                        onClick={() => setShowEmailSend(false)}
                        className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                    <p className="text-xs text-stone-400">Gmail s&apos;ouvrira avec le message pré-rempli — il suffira de cliquer Envoyer.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bio */}
          {prospect.bio_data ? (
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">Bio / Description</h2>
              <p className="text-stone-700 text-sm leading-[1.8] whitespace-pre-wrap">{prospect.bio_data}</p>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-xl border border-dashed border-stone-200 p-6 text-center text-stone-400 text-sm">
              Aucune bio disponible pour ce prospect.
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
