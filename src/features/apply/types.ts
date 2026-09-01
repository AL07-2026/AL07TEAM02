export type ApplicantRole = 'sales' | 'recruiter' | 'investor';

export type TargetCompany = {
  id?: string;
  name: string;
  industry?: string;
  hiringChange?: string;
  expansionSignal?: string;
  recommendationReason?: string;
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
};
