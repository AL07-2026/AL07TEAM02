export type ApplicantRole = 'sales' | 'recruiter' | 'investor';

export type TargetCompany = {
  id?: string;
  name: string;
  industry?: string;
  hiringChange?: string;
  expansionSignal?: string;
  recommendationReason?: string;
  contacts?: Array<{
    sourceTitle?: string;
    sourceUrl?: string;
    name?: string;
    department?: string;
    email?: string;
    phone?: string;
    contactPageUrl?: string;
    estimatedEmails?: string[];
    source?: 'posting_field' | 'posting_html' | 'company_page' | 'estimated';
    verificationStatus?: 'confirmed' | 'needs_verification';
  }>;
};

export type ColdEmailRequestDraft = {
  applicantRole: ApplicantRole;
  applicantEmail: string;
  applicantCompany: string;
  productName: string;
  productDescription: string;
  additionalRequest?: string;
  targetCompany: TargetCompany;
  privacyAgreed: true;
};

export type ColdEmailRequest = ColdEmailRequestDraft & {
  id?: string;
  submittedAt: string;
  delivery?: {
    status: 'sent' | 'skipped' | 'failed';
    provider?: string;
    message?: string;
  };
};
