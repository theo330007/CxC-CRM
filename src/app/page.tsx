'use client'

import { useEffect, useState } from 'react'
import { getProspectCounts } from '@/lib/supabase'
import type { ProspectStatus } from '@/lib/types'
import Link from 'next/link'

const PIPELINE: { status: ProspectStatus; label: string; href: string; color: string; bg: string }[] = [
  { status: 'discovered', label: 'Découverts',    href: '/discovered', color: 'text-sky-700',    bg: 'bg-sky-50 border-sky-200' },
  { status: 'drafted',    label: 'En attente',    href: '/queue',      color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  { status: 'sent',       label: 'Envoyés',       href: '/sent',       color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  { status: 'replied',    label: 'Réponses',      href: '/sent',       color: 'text-sage-700',   bg: 'bg-green-50 border-green-200' },
  { status: 'rejected',   label: 'Rejetés',       href: '/sent',       color: 'text-rose-700',   bg: 'bg-rose-50 border-rose-200' },
]

export default function Dashboard() {
  const [counts, setCounts] = useState<Record<ProspectStatus, number> | null>(null)

  useEffect(() => {
    getProspectCounts().then(setCounts)
  }, [])

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0
  const replyRate = counts && counts.sent + counts.replied + counts.rejected > 0
    ? Math.round((counts.replied / (counts.sent + counts.replied + counts.rejected)) * 100)
    : null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800">Tableau de bord</h1>
        <p className="text-stone-500 text-sm mt-1">Vue d&apos;ensemble de votre pipeline d&apos;outreach</p>
      </div>

      {/* Process steps */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-8">
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-4">Comment ça marche</h2>
        <div className="flex items-stretch gap-2">
          {[
            { number: '1', label: 'Sourcer', desc: 'Trouver des profils via Instagram ou Google', href: '/sourcing', color: 'bg-violet-100 text-violet-700' },
            { number: '2', label: 'Découvrir', desc: 'Qualifier les prospects sourcés', href: '/discovered', color: 'bg-sky-100 text-sky-700' },
            { number: '3', label: 'Traiter', desc: 'Rédiger et envoyer les messages', href: '/queue', color: 'bg-amber-100 text-amber-700' },
          ].map((step, i, arr) => (
            <div key={step.number} className="flex items-stretch gap-2 flex-1">
              <Link href={step.href} className="flex-1 flex items-start gap-3 bg-stone-50 border border-stone-200 rounded-lg p-3 hover:border-stone-300 hover:bg-stone-100 transition-colors group h-full">
                <span className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 ${step.color}`}>{step.number}</span>
                <div>
                  <div className="text-sm font-semibold text-stone-700 group-hover:text-stone-900">{step.label}</div>
                  <div className="text-xs text-stone-400 mt-0.5 leading-snug">{step.desc}</div>
                </div>
              </Link>
              {i < arr.length - 1 && (
                <svg className="shrink-0 text-stone-300" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-10">
        {PIPELINE.map(({ status, label, href, color, bg }) => (
          <Link
            key={status}
            href={href}
            className={`rounded-xl border p-4 ${bg} hover:shadow-sm transition-shadow`}
          >
            <div className={`text-3xl font-bold ${color}`}>
              {counts ? counts[status] : '—'}
            </div>
            <div className="text-xs text-stone-500 mt-1 font-medium">{label}</div>
          </Link>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="text-2xl font-bold text-stone-800">{total}</div>
          <div className="text-sm text-stone-500 mt-1">Prospects total</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="text-2xl font-bold text-stone-800">
            {replyRate !== null ? `${replyRate}%` : '—'}
          </div>
          <div className="text-sm text-stone-500 mt-1">Taux de réponse</div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="text-2xl font-bold text-stone-800">
            {counts ? counts.discovered + counts.drafted : '—'}
          </div>
          <div className="text-sm text-stone-500 mt-1">À traiter</div>
        </div>
      </div>

      {/* Pipeline visual */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-medium text-stone-600 mb-4">Funnel</h2>
        {counts && total > 0 ? (
          <div className="space-y-2">
            {PIPELINE.filter(p => counts[p.status] > 0).map(({ status, label, color }) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-24 text-xs text-stone-500 text-right">{label}</div>
                <div className="flex-1 bg-stone-100 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color.replace('text-', 'bg-').replace('-700', '-400')}`}
                    style={{ width: `${Math.max(4, (counts[status] / total) * 100)}%` }}
                  />
                </div>
                <div className="w-6 text-xs font-medium text-stone-700">{counts[status]}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-400 text-sm">Aucune donnée pour le moment.</p>
        )}
      </div>
    </div>
  )
}
