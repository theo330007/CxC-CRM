'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Instagram, LayoutGrid, List, CheckCircle, XCircle, Download } from 'lucide-react'
import { getProspects, updateProspect } from '@/lib/supabase'
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

export function ProspectList({ status, lastSearchTs }: { status: ProspectStatus[]; lastSearchTs?: number }) {
  const router = useRouter()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [activeSource, setActiveSource] = useState<string>('')
  const [activeNiche, setActiveNiche] = useState<string>('')
  const [activeCity, setActiveCity] = useState<string>('')
  const [toast, setToast] = useState<string | null>(null)

  const isSentPage = status.includes('sent')
  const isRejectedPage = status.length === 1 && status[0] === 'rejected'
  const isQueuePage = status.length === 1 && status[0] === 'drafted'

  useEffect(() => {
    setLoading(true)
    getProspects(status).then(setProspects).finally(() => setLoading(false))
  }, [status.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  function exportCsv() {
    const headers = ['Nom', 'Statut', 'Niche', 'Ville', 'Source', 'Email', 'Téléphone', 'Profil', 'Ajouté le']
    const rows = filtered.map(p => [
      p.name,
      p.status,
      p.niche ?? '',
      p.city ?? '',
      p.source ?? '',
      p.contact_email ?? '',
      p.phone ?? '',
      p.profile_url ?? '',
      new Date(p.created_at).toLocaleDateString('fr-FR'),
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prospects_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function quickAction(e: React.MouseEvent, prospect: Prospect, newStatus: ProspectStatus, label: string) {
    e.stopPropagation()
    await updateProspect(prospect.id, { status: newStatus })
    setProspects(prev => prev.filter(p => p.id !== prospect.id))
    showToast(label)
  }

  const niches = useMemo(() => {
    const all = prospects.map(p => p.niche).filter(Boolean) as string[]
    return [...new Set(all)].sort()
  }, [prospects])

  const cities = useMemo(() => {
    const all = prospects.map(p => p.city).filter(Boolean) as string[]
    return [...new Set(all)].sort()
  }, [prospects])

  const filtered = useMemo(() => {
    return prospects.filter(p => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.niche ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.bio_data ?? '').toLowerCase().includes(search.toLowerCase())
      const matchNiche = !activeNiche || p.niche === activeNiche
      const matchSource = !activeSource || p.source?.toLowerCase() === activeSource
      const matchCity = !activeCity || p.city === activeCity
      const matchLastSearch = !lastSearchTs || new Date(p.created_at).getTime() >= lastSearchTs
      return matchSearch && matchNiche && matchSource && matchCity && matchLastSearch
    })
  }, [prospects, search, activeNiche, activeSource, activeCity, lastSearchTs])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-800 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Search + filters */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          <div className="flex border border-stone-200 rounded-lg overflow-hidden bg-white">
            <button onClick={() => setView('grid')} className={`px-3 py-2 transition-colors ${view === 'grid' ? 'bg-stone-100 text-stone-800' : 'text-stone-400 hover:text-stone-600'}`} title="Vue grille">
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView('table')} className={`px-3 py-2 transition-colors ${view === 'table' ? 'bg-stone-100 text-stone-800' : 'text-stone-400 hover:text-stone-600'}`} title="Vue liste">
              <List size={15} />
            </button>
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            title="Exporter en CSV (Excel)"
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
          >
            <Download size={15} /> Export
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={activeSource}
            onChange={e => setActiveSource(e.target.value)}
            className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="">Plateforme</option>
            <option value="google">Google</option>
            <option value="instagram">Instagram</option>
          </select>
          <select
            value={activeNiche}
            onChange={e => setActiveNiche(e.target.value)}
            className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="">Métier</option>
            {niches.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            value={activeCity}
            onChange={e => setActiveCity(e.target.value)}
            className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-sage-500"
          >
            <option value="">Ville</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(activeSource || activeNiche || activeCity) && (
            <button
              onClick={() => { setActiveSource(''); setActiveNiche(''); setActiveCity('') }}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 px-2 py-1.5 rounded-lg border border-stone-200 bg-white transition-colors"
            >
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-stone-400 mb-4">
          {filtered.length} prospect{filtered.length !== 1 ? 's' : ''}
          {(search || activeSource || activeNiche || activeCity) ? ` sur ${prospects.length}` : ''}
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
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((prospect) => (
            <div key={prospect.id} className="relative bg-white rounded-xl border border-stone-200 hover:shadow-md hover:border-sage-300 transition-all group flex flex-col">
              <button
                onClick={() => router.push(`/prospect/${prospect.id}`)}
                className="w-full text-left p-5 flex-1"
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
              {/* Quick actions */}
              <div className="flex border-t border-stone-100">
                {isRejectedPage ? (
                  <button
                    onClick={(e) => quickAction(e, prospect, 'drafted', `${prospect.name} a été envoyé(e) en File d'attente.`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors rounded-b-xl"
                  >
                    <CheckCircle size={13} /> Re-Qualifier
                  </button>
                ) : (
                  <>
                    {!isSentPage && !isQueuePage && (
                      <>
                        <button
                          onClick={(e) => quickAction(e, prospect, 'drafted', `${prospect.name} a été ajouté(e) à la File d'attente.`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors rounded-bl-xl"
                        >
                          <CheckCircle size={13} /> Pertinent
                        </button>
                        <div className="w-px bg-stone-100" />
                      </>
                    )}
                    <button
                      onClick={(e) => quickAction(e, prospect, 'rejected', `${prospect.name} a été rejeté(e).`)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-50 transition-colors ${isSentPage || isQueuePage ? 'rounded-b-xl' : 'rounded-br-xl'}`}
                    >
                      <XCircle size={13} /> Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500 font-medium uppercase tracking-wide">
                <th className="text-left px-4 py-3">Nom</th>
                <th className="text-left px-4 py-3">Niche</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Bio</th>
                <th className="text-right px-4 py-3">Ajouté</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((prospect) => (
                <tr
                  key={prospect.id}
                  onClick={() => router.push(`/prospect/${prospect.id}`)}
                  className="hover:bg-stone-50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3 font-medium text-stone-800 group-hover:text-sage-700 whitespace-nowrap">
                    {prospect.name}
                  </td>
                  <td className="px-4 py-3">
                    {prospect.niche
                      ? <span className="bg-stone-100 text-stone-600 text-xs font-medium px-2 py-0.5 rounded-full">{prospect.niche}</span>
                      : <span className="text-stone-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
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
                    {!prospect.source && <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-stone-500 max-w-xs hidden md:table-cell">
                    <span className="line-clamp-1">{prospect.bio_data ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs text-right whitespace-nowrap">
                    {formatDate(prospect.created_at)}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {isRejectedPage ? (
                        <button
                          onClick={(e) => quickAction(e, prospect, 'drafted', `${prospect.name} a été envoyé(e) en File d'attente.`)}
                          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors"
                        >
                          <CheckCircle size={12} /> Re-Qualifier
                        </button>
                      ) : (
                        <>
                          {!isSentPage && !isQueuePage && (
                            <button
                              onClick={(e) => quickAction(e, prospect, 'drafted', `${prospect.name} a été ajouté(e) à la File d'attente.`)}
                              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-green-600 hover:bg-green-50 border border-green-200 transition-colors"
                            >
                              <CheckCircle size={12} /> Pertinent
                            </button>
                          )}
                          <button
                            onClick={(e) => quickAction(e, prospect, 'rejected', `${prospect.name} a été rejeté(e).`)}
                            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors"
                          >
                            <XCircle size={12} /> Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
