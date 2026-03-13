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

  useEffect(() => {
    getProspect(id).then((p) => {
      if (p) { setProspect(p); setDraft(p.draft_message ?? ''); setEmail(p.contact_email ?? ''); setPhone(p.phone ?? '') }
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
        body: JSON.stringify({ name: prospect.name, niche: prospect.niche, bio_data: prospect.bio_data, profile_url: prospect.profile_url }),
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
                Gemini analyse la bio du prospect et évalue si ce profil est un bon match pour une collaboration CxC.
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
              <div className="space-y-4">
                {/* Score */}
                <div className={`rounded-lg px-4 py-3 flex items-center justify-between ${SCORE_COLORS[analysis.score]}`}>
                  <span className="font-semibold text-sm">{analysis.verdict}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className={i <= analysis.score ? 'fill-current' : 'opacity-25'} />
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-stone-600 leading-relaxed">{analysis.resume}</p>

                {/* Points forts */}
                {analysis.points_forts?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Points forts</p>
                    <ul className="space-y-1">
                      {analysis.points_forts.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                          <CheckCircle size={13} className="text-green-500 shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Points attention */}
                {analysis.points_attention?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Points d&apos;attention</p>
                    <ul className="space-y-1">
                      {analysis.points_attention.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                          <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status actions */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Changer le statut</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => save({ status: 'sent' })} disabled={saving || prospect.status === 'sent'}
                className="flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 text-sm font-medium rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-40 w-full">
                <Send size={14} /> Marqué envoyé
              </button>
              <button onClick={() => save({ status: 'replied' })} disabled={saving || prospect.status === 'replied'}
                className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors disabled:opacity-40 w-full">
                <CheckCircle size={14} /> Répondu
              </button>
              <button onClick={() => save({ status: 'rejected' })} disabled={saving || prospect.status === 'rejected'}
                className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-40 w-full">
                <XCircle size={14} /> Rejeté
              </button>
              {prospect.status !== 'discovered' && (
                <button onClick={() => save({ status: 'discovered' })} disabled={saving}
                  className="flex items-center gap-2 px-3 py-2 bg-stone-50 text-stone-500 text-sm font-medium rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-40 w-full">
                  ↩ Remettre en découverts
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="space-y-5">

          {/* Bio */}
          {prospect.bio_data ? (
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">Bio / Description</h2>
              <p className="text-stone-700 text-base leading-[1.8] whitespace-pre-wrap">{prospect.bio_data}</p>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-xl border border-dashed border-stone-200 p-6 text-center text-stone-400 text-sm">
              Aucune bio disponible pour ce prospect.
            </div>
          )}

          {/* Draft message */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Message d&apos;approche</h2>
              <div className="flex gap-2">
                <button onClick={generateDraft} disabled={generating}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-sage-300 text-sage-700 hover:bg-sage-50 transition-colors disabled:opacity-50">
                  <Sparkles size={12} />
                  {generating ? 'Génération…' : 'Générer avec IA'}
                </button>
                {draft && (
                  <button onClick={copyDraft}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                    {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={10}
              className="w-full border border-stone-200 rounded-xl p-4 text-sm text-stone-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-sage-500 resize-y"
              placeholder="Rédigez votre message d'approche ici, ou utilisez l'IA pour en générer un…"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-stone-400">{draft.length} caractères</span>
              <button
                onClick={() => save({ draft_message: draft, status: 'drafted' })}
                disabled={saving || !draft.trim()}
                className="px-4 py-2 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-900 transition-colors disabled:opacity-40"
              >
                {saving ? 'Enregistrement…' : 'Sauvegarder le brouillon'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
