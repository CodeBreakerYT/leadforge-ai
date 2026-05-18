export type LeadStatus = 
  | 'PROCESSING'
  | 'SCRAPING'
  | 'GENERATING_REPORT'
  | 'PDF_CREATED'
  | 'EMAILED'
  | 'FAILED';

export interface Lead {
  id?: string;
  name: string;
  email: string;
  company: string;
  website: string;
  message?: string;
  status: LeadStatus;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  pdfUrl?: string;
  reportSummary?: string;
}

export interface ReportData {
  company: string;
  website: string;
  niche: string;
  insights: string;
  seoRecommendations: string;
  uxSuggestions: string;
  growthOpportunities: string;
  conversionOptimization: string;
  technicalRecommendations: string;
}
