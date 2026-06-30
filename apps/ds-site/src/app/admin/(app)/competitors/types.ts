export interface CompetitorAnalysis {
  summary: string
  website: { strengths: string[]; takeaways: string[] }
  services: { offerings: string[]; gaps: string[] }
  pricing: string
  opportunities: { title: string; detail: string }[]
}

export type CompetitorStatus = 'pending' | 'analyzing' | 'analyzed' | 'error'

export interface Competitor {
  id: string
  name: string
  url: string
  summary: string
  analysis: CompetitorAnalysis | null
  status: CompetitorStatus
  scrapedAt: string | null
  createdAt: string
}
