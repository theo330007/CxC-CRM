import { MapPin } from 'lucide-react'

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  google_places: {
    label: 'Google Places',
    icon: <MapPin size={10} />,
    className: 'bg-blue-50 text-blue-600 border-blue-100',
  },
}

export function SourceBadge({ source }: { source: string | null }) {
  if (!source) return null
  const config = SOURCE_CONFIG[source]
  if (!config) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-stone-50 text-stone-500 border-stone-100">
        {source}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  )
}
