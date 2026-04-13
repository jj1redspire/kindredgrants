export type DocumentType =
  | '990'
  | 'financial'
  | 'board_bios'
  | 'past_grant'
  | 'program'
  | 'outcomes'
  | 'other'

export type ProcessingStatus = 'pending' | 'processing' | 'complete' | 'error'

export type GrantStatus = 'drafting' | 'review' | 'complete' | 'submitted'

export interface Organization {
  id: string
  owner_id: string
  name: string
  ein: string | null
  mission: string | null
  created_at: string
}

export interface Document {
  id: string
  org_id: string
  filename: string
  file_url: string
  document_type: DocumentType
  processing_status: ProcessingStatus
  page_count: number | null
  uploaded_at: string
}

export interface Chunk {
  id: string
  document_id: string
  org_id: string
  content: string
  chunk_index: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface Grant {
  id: string
  org_id: string
  funder_name: string
  program_name: string | null
  deadline: string | null
  funding_amount: number | null
  required_sections: string[]
  special_instructions: string | null
  status: GrantStatus
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  grant_id: string
  section_name: string
  ai_draft: string | null
  user_edited: string | null
  word_limit: number | null
  word_count: number | null
  sources_used: string[]
  data_gaps: string[]
  version: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  org_id: string
  stripe_customer_id: string | null
  stripe_sub_id: string | null
  status: string
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  '990': '990 Tax Return',
  financial: 'Financial Statement',
  board_bios: 'Board Bios',
  past_grant: 'Past Grant',
  program: 'Program Description',
  outcomes: 'Outcomes Data',
  other: 'Other',
}

export const DEFAULT_SECTIONS = [
  'Organizational Background',
  'Statement of Need',
  'Project Description',
  'Goals & Objectives',
  'Budget Narrative',
  'Evaluation Plan',
  'Organizational Capacity',
  'Sustainability Plan',
]
