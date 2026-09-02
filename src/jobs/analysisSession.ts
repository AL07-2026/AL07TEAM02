import type { CompanyRoleAnalysis } from './types.js';

const storagePrefix = 'sales-signal:company-analysis:';

function storageKey(companyName: string) {
  return `${storagePrefix}${encodeURIComponent(companyName)}`;
}

export function storeCompanyAnalysis(analysis: CompanyRoleAnalysis) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(storageKey(analysis.companyName), JSON.stringify(analysis));
}

export function readCompanyAnalysis(companyName: string) {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(storageKey(companyName));
  if (!raw) return null;

  try {
    const analysis = JSON.parse(raw) as CompanyRoleAnalysis;
    return analysis.companyName === companyName ? analysis : null;
  } catch {
    return null;
  }
}
