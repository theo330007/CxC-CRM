'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sparkles, Inbox, CheckCircle, LayoutDashboard, Search, XCircle, Settings } from 'lucide-react'
import { getProspectCounts } from '@/lib/supabase'
import type { ProspectStatus } from '@/lib/types'

const navItems = [
  { href: '/',           label: 'Dashboard',      Icon: LayoutDashboard, badge: null as ProspectStatus | null },
  { href: '/sourcing',   label: 'Sourcer',         Icon: Search,          badge: null as ProspectStatus | null },
  { href: '/discovered', label: 'Découverts',      Icon: Sparkles,        badge: 'discovered' as ProspectStatus },
  { href: '/queue',      label: "File d'attente",  Icon: Inbox,           badge: 'drafted' as ProspectStatus },
  { href: '/sent',       label: 'Envoyés',         Icon: CheckCircle,     badge: null as ProspectStatus | null },
  { href: '/rejected',   label: 'Rejetés',         Icon: XCircle,         badge: 'rejected' as ProspectStatus },
]

export function Sidebar() {
  const pathname = usePathname()
  const [counts, setCounts] = useState<Record<ProspectStatus, number> | null>(null)

  useEffect(() => {
    getProspectCounts().then(setCounts)
    // Refresh counts every 30s to pick up n8n-sourced prospects
    const id = setInterval(() => getProspectCounts().then(setCounts), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <aside className="w-60 bg-stone-100 border-r border-stone-200 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-stone-200">
        <div className="text-2xl font-semibold text-sage-700 tracking-tight">CxC</div>
        <div className="text-xs text-stone-500 mt-0.5">Espace d&apos;envoi</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, Icon, badge }) => {
          const isActive = href === '/'
            ? pathname === '/'
            : pathname === href || pathname.startsWith(href + '/')
          const count = badge && counts ? counts[badge] : 0

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sage-500 text-white'
                  : 'text-stone-600 hover:bg-stone-200 hover:text-stone-800'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge && count > 0 && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-stone-200 space-y-1">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-sage-500 text-white'
              : 'text-stone-600 hover:bg-stone-200 hover:text-stone-800'
          }`}
        >
          <Settings size={18} />
          <span>Paramètres</span>
        </Link>
        <p className="text-xs text-stone-400 px-3 pt-1">CamilleXCamille © 2025</p>
      </div>
    </aside>
  )
}
