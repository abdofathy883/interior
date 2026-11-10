const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** Western digits with thousands separators: 1234567 -> "1,234,567". */
export function formatNumber(n: number): string {
  return nf.format(n);
}

/**
 * "1,234,567 ج.م". The number is wrapped in a Left-to-Right isolate so that the
 * minus sign and digits keep their order inside an RTL paragraph.
 */
export function formatMoney(n: number, currency = 'ج.م'): string {
  return `⁦${formatNumber(n)}⁩ ${currency}`;
}

export function formatPct(n: number, digits = 0): string {
  return `⁦${n.toFixed(digits)}%⁩`;
}

/** Short axis label, e.g. 1500000 -> "1.5 مليون". */
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)} مليون`;
  if (abs >= 1_000) return `${+(n / 1_000).toFixed(0)} ألف`;
  return String(n);
}
