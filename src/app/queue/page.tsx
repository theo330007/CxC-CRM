import { ProspectList } from '@/components/ProspectList'

export default function QueuePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">File d&apos;attente</h1>
      <ProspectList status={['drafted']} />
    </div>
  )
}
