'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Instagram } from 'lucide-react'
import { getProspects } from '@/lib/supabase'
import type { Prospect, ProspectStatus } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse">
      <div className="h-4 bg-stone-200 rounded w-2/3 mb-3" />
      <div className="h-3 bg-stone-100 rounded w-1/3 mb-4" />
      <div className="h-3 bg-stone-100 rounded w-full mb-2" />
      <div className="h-3 bg-stone-100 rounded w-4/5" />
    </div>
  )
}

export function ProspectList({ status }: { status: ProspectStatus[] }) {
  const router = useRouter()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getProspects(status).then(setProspects).finally(() => setLoading(false))
  }, [status.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  // Unique niches for filter chips
  const niches = useMemo(() => {
    const all = prospects.map(p => p.niche).filter(Boolean) as string[]
    return [...new Set(all)].sort()
  }, [prospects])

  const [activeNiche, setActiveNiche] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return prospects.filter(p => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.niche ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.bio_data ?? '').toLowerCase().includes(search.toLowerCase())
      const matchNiche = !activeNiche || p.niche === activeNiche
      return matchSearch && matchNiche
    })
  }, [prospects, search, activeNiche])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X size={14} />
            </button>
          )}
        </div>
        {niches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {niches.map(niche => (
              <button
                key={niche}
                onClick={() => setActiveNiche(activeNiche === niche ? null : niche)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  activeNiche === niche
                    ? 'bg-sage-500 text-white border-sage-500'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-sage-300'
                }`}
              >
                {niche}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-stone-400 mb-4">
          {filtered.length} prospect{filtered.length !== 1 ? 's' : ''}
          {(search || activeNiche) ? ` sur ${prospects.length}` : ''}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🌿</div>
          <p className="text-stone-500 text-lg font-medium">
            {prospects.length === 0 ? 'Tout est calme ici.' : 'Aucun résultat.'}
          </p>
          <p className="text-stone-400 text-sm mt-1">
            {prospects.length === 0 ? 'Aucun prospect pour le moment.' : 'Essayez un autre filtre.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((prospect) => (
            <button
              key={prospect.id}
              onClick={() => router.push(`/prospect/${prospect.id}`)}
              className="bg-white rounded-xl border border-stone-200 p-5 text-left hover:shadow-md hover:border-sage-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-semibold text-stone-800 group-hover:text-sage-700 transition-colors">
                  {prospect.name}
                </span>
                <span className="text-xs text-stone-400 shrink-0 mt-0.5">
                  {formatDate(prospect.created_at)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {prospect.niche && (
                  <span className="inline-block bg-stone-100 text-stone-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    {prospect.niche}
                  </span>
                )}
                {prospect.source?.toLowerCase() === 'instagram' && (
                  <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    <Instagram size={10} /> Instagram
                  </span>
                )}
                {prospect.source?.toLowerCase() === 'google' && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    <Search size={10} /> Google
                  </span>
                )}
              </div>
              {prospect.bio_data && (
                <p className="text-stone-500 text-sm line-clamp-2 leading-relaxed">
                  {prospect.bio_data}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
