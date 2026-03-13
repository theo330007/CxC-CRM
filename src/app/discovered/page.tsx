import { ProspectList } from '@/components/ProspectList'

export default function DiscoveredPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Découverts</h1>
        <p className="text-stone-500 text-sm mt-1">
          Prospects sourcés automatiquement — à qualifier et rédiger
        </p>
      </div>
      <ProspectList status={['discovered']} />
    </div>
  )
}
