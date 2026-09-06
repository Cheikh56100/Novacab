/**
 * Normalise les conventions de comptes tiers issues des différents logiciels
 * comptables. NOVACAB travaille ensuite avec un modèle interne stable.
 *
 * 401 = fournisseur
 * 411 = client
 * 0... / 0METRO = fournisseur (convention Quadra/Quadratus observée)
 * 9... / 9METRO = client (pas d analytique dans NOVACAB)
 */
export function normalizeAccountingAccount(value) {
  return String(value ?? '').trim().replace(/\s+/g, '').toUpperCase();
}

export function detectAccountType(value) {
  const account = normalizeAccountingAccount(value);
  if (!account) return null;
  if (account.startsWith('401') || account.startsWith('0')) return '401';
  if (account.startsWith('411') || account.startsWith('9')) return '411';
  return null;
}

export function equivalentLegacyAccount(value) {
  const account = normalizeAccountingAccount(value);
  const type = detectAccountType(account);
  if (type === '401' && account.startsWith('0')) return `401${account.slice(1)}`;
  if (type === '411' && account.startsWith('9')) return `411${account.slice(1)}`;
  return null;
}
