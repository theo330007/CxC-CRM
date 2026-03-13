/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import type { Prospect, ProspectStatus } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Untyped client — we cast results manually using our own Prospect interface
let _client: ReturnType<typeof createClient> | null = null

function db(): any {
  if (!_client) _client = createClient(supabaseUrl, supabaseAnonKey)
  return _client
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
    .select('*')
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
