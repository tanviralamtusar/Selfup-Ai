// Money formatting helpers (client + server safe)

const SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CNY: '¥',
  AUD: 'A$', CAD: 'C$', CHF: 'CHF', BDT: '৳', BRL: 'R$', RUB: '₽',
  ZAR: 'R', SGD: 'S$', HKD: 'HK$', KRW: '₩', MXN: 'MX$', NZD: 'NZ$',
}

export const CURRENCIES = Object.keys(SYMBOLS)

export function currencySymbol(currency = 'USD'): string {
  return SYMBOLS[currency] ?? currency + ' '
}

/** Format an amount with its currency symbol, e.g. $1,240.50 */
export function formatMoney(amount: number, currency = 'USD', opts?: { compact?: boolean }): string {
  const sym = currencySymbol(currency)
  const abs = Math.abs(amount)
  let body: string
  if (opts?.compact && abs >= 1000) {
    body = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(abs)
  } else {
    body = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(abs)
  }
  return `${amount < 0 ? '-' : ''}${sym}${body}`
}

/** Signed amount for a transaction type (income positive, expense negative). */
export function signedAmount(type: string, amount: number): number {
  return type === 'income' ? amount : type === 'expense' ? -amount : 0
}

/** First day of the month (UTC) as an ISO date string YYYY-MM-DD. */
export function monthKey(date: Date | string = new Date()): string {
  const d = new Date(date)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

/** Human month label e.g. "Jul 2026". */
export function monthLabel(monthIso: string): string {
  const d = new Date(monthIso + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
