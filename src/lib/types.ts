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
  contact_email: string | null
  phone: string | null
  source: string | null
  city: string | null
}
