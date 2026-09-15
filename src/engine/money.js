/**
 * Parse e formatação de valores em real (pt-BR).
 */

export function parseMoney(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN
  if (raw == null) return NaN
  let s = String(raw).trim()
  if (!s) return NaN
  s = s.replace(/R\$\s?/gi, '').replace(/\s/g, '')
  if (s.includes(',') && s.includes('.')) {
    return Number(s.replace(/\./g, '').replace(',', '.'))
  }
  if (s.includes(',')) return Number(s.replace(',', '.'))
  return Number(s)
}

export function formatBRL(n, opts = {}) {
  const digits = opts.digits ?? 2
  return (Number(n) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
