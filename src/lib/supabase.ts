/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserClient } from '@supabase/ssr'
import type { Prospect, ProspectStatus } from './types'

// Cookie-aware client — auth session is passed automatically, RLS applies
function db(): any {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getProspects(statuses: ProspectStatus[]): Promise<Prospect[]> {
  const { data, error } = await db()
    .from('prospects')
    .select('*')
    .in('status', statuses)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Prospect[]
}

export async function getProspect(id: string): Promise<Prospect | null> {
  const { data, error } = await db()
    .from('prospects')
    .select('id, created_at, name, niche, profile_url, bio_data, draft_message, status, contact_email, phone, source, city')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Prospect
}

export async function updateProspect(
  id: string,
  patch: Partial<Omit<Prospect, 'id' | 'created_at'>>
): Promise<void> {
  const { error } = await db()
    .from('prospects')
    .update(patch)
    .eq('id', id)
  if (error) throw error
}

export async function deleteProspect(id: string): Promise<void> {
  const { error } = await db()
    .from('prospects')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getProspectCounts(): Promise<Record<ProspectStatus, number>> {
  const { data, error } = await db()
    .from('prospects')
    .select('status')
  if (error) throw error
  const counts: Record<string, number> = {
    discovered: 0, drafted: 0, sent: 0, replied: 0, rejected: 0,
  }
  for (const row of data) counts[row.status] = (counts[row.status] ?? 0) + 1
  return counts as Record<ProspectStatus, number>
}
