export type JobSource = 'alio' | 'jooble' | 'saramin' | 'work24' | 'normalized';

export type JobFamily =
  | 'sales'
  | 'recruiting'
  | 'engineering'
  | 'marketing'
  | 'product'
  | 'finance'
  | 'operations'
  | 'manufacturing'
  | 'healthcare'
  | 'other';

export type Seniority = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | 'unknown';

export type JobRoleDetail = {
  name: string;
  headcount: number | null;
  department: string;
  duties: string[];
  qualification: string;
  contractEvidence: string;
  hiringReason: string;
};

export type NormalizedJobPosting = {
  source: JobSource;
  externalId: string;
  sourceUrl: string;
  companyName: string;
  normalizedCompanyName: string;
  title: string;
  description: string;
  industry: string;
  jobFamily: JobFamily;
  seniority: Seniority;
  skills: string[];
  keywords: string[];
  location: string;
  employmentType: string;
  headcount: number | null;
  publishedAt: string;
  updatedAt: string | null;
  expiresAt: string | null;
  active: boolean;
  collectedAt: string;
  fingerprint: string;
  qualityScore: number;
  roleDetails?: JobRoleDetail[];
};

export type NormalizedJobInput = Omit<
  NormalizedJobPosting,
  'normalizedCompanyName' | 'jobFamily' | 'seniority' | 'skills' | 'fingerprint' | 'qualityScore'
> & {
  jobFamily?: JobFamily;
  seniority?: Seniority;
  skills?: string[];
};

export type CompanyHiringSignal = {
  companyName: string;
  recentPostingCount: number;
  previousPostingCount: number;
  activePostingCount: number;
  recentHeadcount: number;
  newJobFamilies: JobFamily[];
  jobFamilies: JobFamily[];
  leadershipHireCount: number;
  repostCount: number;
  sourceCount: number;
  confidenceScore: number;
  evidence: NormalizedJobPosting[];
};

export type AnalysisRole = 'sales' | 'recruiter' | 'investor';

export type RoleAnalysisRequest = {
  role: AnalysisRole;
  query: string;
  secondaryQuery?: string;
};

export type CompanyRoleAnalysis = {
  companyName: string;
  role: AnalysisRole;
  totalScore: number;
  breakdown: Array<{ label: string; score: number; maximum: number }>;
  hiringSituation: string;
  recommendationReasons: string[];
  observedFacts: string[];
  interpretation: string;
  confidenceScore: number;
  riskFlags: string[];
  evidenceUrls: string[];
  evidence: Array<{
    title: string;
    url: string;
    publishedAt: string;
    location: string;
    headcount: number | null;
  }>;
  roleFindings: JobRoleDetail[];
};

export type TrySearchRequest = RoleAnalysisRequest & {
  region?: 'all' | 'seoul' | 'gyeonggi' | 'busan';
};

export type TrySearchResponse = {
  collectedAt: string;
  matches: CompanyRoleAnalysis[];
  postingCount: number;
};
