import { normalizeCompanyName } from './normalize.js';
import type { JobContactInfo } from './types.js';

type KnownCompanyContactHint = {
  names: string[];
  domain: string;
  contactPageUrl: string;
  department?: string;
};

const knownCompanyContactHints: KnownCompanyContactHint[] = [
  {
    names: ['Toss', '토스', '비바리퍼블리카', 'Viva Republica'],
    domain: 'toss.im',
    contactPageUrl: 'https://toss.im/career/jobs',
    department: '토스채용팀',
  },
];

const knownCompanyContactHintsByName = new Map(
  knownCompanyContactHints.flatMap((hint) =>
    hint.names.map((name) => [normalizeCompanyName(name), hint] as const),
  ),
);

function estimatedEmails(domain: string) {
  return [`recruit@${domain}`, `hr@${domain}`, `jobs@${domain}`];
}

export function getKnownCompanyContactHint(companyName: string): JobContactInfo | undefined {
  const hint = knownCompanyContactHintsByName.get(normalizeCompanyName(companyName));
  if (!hint) return undefined;

  return {
    department: hint.department,
    contactPageUrl: hint.contactPageUrl,
    estimatedEmails: estimatedEmails(hint.domain),
    source: 'estimated',
    verificationStatus: 'needs_verification',
  };
}

export function getCompanyContactFallback(companyName: string): JobContactInfo {
  const knownHint = getKnownCompanyContactHint(companyName);
  if (knownHint) return knownHint;

  return {
    department: '채용팀 또는 인사팀',
    contactPageUrl: `https://www.google.com/search?q=${encodeURIComponent(
      `${companyName} 채용 문의`,
    )}`,
    source: 'estimated',
    verificationStatus: 'needs_verification',
  };
}
