'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProspect, updateProspect, deleteProspect } from '@/lib/supabase'
import type { Prospect, ProspectStatus } from '@/lib/types'
import { ArrowLeft, Copy, Check, Send, CheckCircle, XCircle, Trash2, ExternalLink, Sparkles, Calendar } from 'lucide-react'

const STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string }> = {
  discovered: { label: 'Découvert',  color: 'bg-sky-100 text-sky-700' },
  drafted:    { label: 'Brouillon',  color: 'bg-amber-100 text-amber-700' },
  sent:       { label: 'Envoyé',     color: 'bg-violet-100 text-violet-700' },
  replied:    { label: 'Répondu',    color: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rejeté',     color: 'bg-rose-100 text-rose-700' },
}

export default function ProspectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    getProspect(id).then((p) => {
      if (p) { setProspect(p); setDraft(p.draft_message ?? '') }
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

  async function handleDelete() {
    await deleteProspect(id)
    router.push('/discovered')
  }

  if (!prospect) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse text-stone-400">Chargement…</div>
      </div>
    )
  }

  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[prospect.status]

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <button
          onClick={() => setShowDelete(!showDelete)}
          className="text-stone-400 hover:text-rose-500 transition-colors"
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {showDelete && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-rose-700">Supprimer ce prospect ?</p>
          <div className="flex gap-2">
            <button onClick={() => setShowDelete(false)} className="text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 bg-white">Annuler</button>
            <button onClick={handleDelete} className="text-xs text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg">Supprimer</button>
          </div>
        </div>
      )}

      {/* Prospect info */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-xl font-semibold text-stone-800">{prospect.name}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {prospect.niche && (
            <span className="inline-block bg-stone-100 text-stone-600 text-xs font-medium px-2.5 py-1 rounded-full">
              {prospect.niche}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-stone-400">
            <Calendar size={11} />
            {new Date(prospect.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        {prospect.profile_url && (
          <a
            href={prospect.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-sage-700 hover:underline mb-3"
          >
            <ExternalLink size={13} /> Voir le profil
          </a>
        )}
        {prospect.bio_data && (
          <div className="bg-stone-50 rounded-lg p-4 text-sm text-stone-600 leading-relaxed">
            {prospect.bio_data}
          </div>
        )}
      </div>

      {/* Message draft */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-stone-700">Message d&apos;approche</label>
          <div className="flex gap-2">
            <button
              onClick={generateDraft}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-sage-300 text-sage-700 hover:bg-sage-50 transition-colors disabled:opacity-50"
            >
              <Sparkles size={12} />
              {generating ? 'Génération…' : 'Générer avec IA'}
            </button>
            {draft && (
              <button
                onClick={copyDraft}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
              >
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            )}
          </div>
        </div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={8}
          className="w-full border border-stone-200 rounded-lg p-4 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
          placeholder="Rédigez votre message d'approche…"
        />
        <button
          onClick={() => save({ draft_message: draft, status: 'drafted' })}
          disabled={saving || !draft.trim()}
          className="mt-3 px-4 py-2 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-900 transition-colors disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : 'Sauvegarder'}
        </button>
      </div>

      {/* Status actions */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <p className="text-sm font-medium text-stone-700 mb-3">Changer le statut</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => save({ status: 'sent' })}
            disabled={saving || prospect.status === 'sent'}
            className="flex items-center gap-2 px-3 py-2 bg-violet-100 text-violet-700 text-sm font-medium rounded-lg hover:bg-violet-200 transition-colors disabled:opacity-40"
          >
            <Send size={14} /> Marqué envoyé
          </button>
          <button
            onClick={() => save({ status: 'replied' })}
            disabled={saving || prospect.status === 'replied'}
            className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors disabled:opacity-40"
          >
            <CheckCircle size={14} /> Répondu
          </button>
          <button
            onClick={() => save({ status: 'rejected' })}
            disabled={saving || prospect.status === 'rejected'}
            className="flex items-center gap-2 px-3 py-2 bg-rose-100 text-rose-700 text-sm font-medium rounded-lg hover:bg-rose-200 transition-colors disabled:opacity-40"
          >
            <XCircle size={14} /> Rejeté
          </button>
          {prospect.status !== 'discovered' && (
            <button
              onClick={() => save({ status: 'discovered' })}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-2 bg-stone-100 text-stone-600 text-sm font-medium rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-40"
            >
              ↩ Remettre en découverts
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
