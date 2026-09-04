/** Full grouped amount, e.g. money(25000000,'EUR') -> "EUR 25,000,000". */
export function money(n: number, currency = ''): string {
  return (currency ? currency + ' ' : '') + n.toLocaleString('en-US');
}

/** Compact amount, e.g. compactMoney(25000000) -> "25M". */
export function compactMoney(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(n % 1e9 ? 1 : 0) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return String(n);
}
