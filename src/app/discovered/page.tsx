'use client'

import { useEffect, useState } from 'react'
import { Clock, List } from 'lucide-react'
import { ProspectList } from '@/components/ProspectList'

export default function DiscoveredPage() {
  const [lastSearchTs, setLastSearchTs] = useState<number | undefined>()
  const [showLastOnly, setShowLastOnly] = useState(false)

  useEffect(() => {
    const ts = localStorage.getItem('cxc_last_search_ts')
    if (ts) setLastSearchTs(Number(ts))
  }, [])

  const lastSearchLabel = lastSearchTs
    ? new Date(lastSearchTs).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Découverts</h1>
        <p className="text-stone-500 text-sm mt-1">
          Prospects sourcés automatiquement — à qualifier et rédiger
        </p>
      </div>

      {/* Dernière recherche toggle */}
      {lastSearchLabel && (
        <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock size={16} className="text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Dernière recherche lancée le {lastSearchLabel}</p>
            <p className="text-xs text-amber-600 mt-0.5">Filtrez pour voir uniquement les résultats de cette session.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowLastOnly(true)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                showLastOnly
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Clock size={12} /> Dernière recherche
            </button>
            <button
              onClick={() => setShowLastOnly(false)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                !showLastOnly
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <List size={12} /> Tout afficher
            </button>
          </div>
        </div>
      )}

      <ProspectList status={['discovered']} lastSearchTs={showLastOnly ? lastSearchTs : undefined} />
    </div>
  )
}
