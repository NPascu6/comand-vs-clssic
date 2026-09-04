/** Full grouped amount, e.g. money(25000000,'EUR') -> "EUR 25,000,000". */
export function money(amount: number, currency = ''): string {
  return (currency ? currency + ' ' : '') + amount.toLocaleString('en-US');
}

/** Compact amount, e.g. compactMoney(25000000) -> "25M". */
export function compactMoney(amount: number): string {
  const magnitude = Math.abs(amount);
  if (magnitude >= 1e9) return (amount / 1e9).toFixed(amount % 1e9 ? 1 : 0) + 'B';
  if (magnitude >= 1e6) return (amount / 1e6).toFixed(amount % 1e6 ? 1 : 0) + 'M';
  if (magnitude >= 1e3) return (amount / 1e3).toFixed(0) + 'K';
  return String(amount);
}
