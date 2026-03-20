import { ProspectList } from '@/components/ProspectList'

export default function RejectedPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Rejetés</h1>
        <p className="text-stone-500 text-sm mt-1">
          Profils non retenus — à supprimer quand vous êtes prêt(e)
        </p>
      </div>
      <ProspectList status={['rejected']} />
    </div>
  )
}
