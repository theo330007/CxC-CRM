import { ProspectList } from '@/components/ProspectList'

export default function SentPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Envoyés</h1>
      <ProspectList status={['sent', 'replied', 'rejected']} />
    </div>
  )
}
