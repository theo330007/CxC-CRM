export type ProspectStatus = 'discovered' | 'drafted' | 'sent' | 'replied' | 'rejected'

export interface Prospect {
  id: string
  created_at: string
  name: string
  niche: string | null
  profile_url: string | null
  bio_data: string | null
  draft_message: string | null
  status: ProspectStatus
}
