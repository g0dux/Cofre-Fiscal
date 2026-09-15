/**
 * Cofre local — localStorage.
 * Some se limpar o navegador. V2: nuvem.
 */

import { TETO_MEI, TOLERANCIA_MEI } from './constantes.js'

const STORAGE_KEY = 'fiscal-cofre:v1'

/**
 * @typedef {import('./xml.js').NotaTraduzida} NotaTraduzida
 */

export function carregarCofre() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { notas: [], atualizadoEm: null }
    const data = JSON.parse(raw)
    return {
      notas: Array.isArray(data.notas) ? data.notas : [],
      atualizadoEm: data.atualizadoEm || null,
    }
  } catch {
    return { notas: [], atualizadoEm: null }
  }
}

/**
 * @param {NotaTraduzida[]} notas
 */
export function salvarCofre(notas) {
  const payload = {
    notas,
    atualizadoEm: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  return payload
}

/**
 * @param {NotaTraduzida} nota
 */
export function adicionarNota(nota) {
  const { notas } = carregarCofre()
  const next = [nota, ...notas]
  salvarCofre(next)
  return next
}

export function removerNota(id) {
  const { notas } = carregarCofre()
  const next = notas.filter((n) => n.id !== id)
  salvarCofre(next)
  return next
}

export function limparCofre() {
  localStorage.removeItem(STORAGE_KEY)
  return []
}

/**
 * Soma do ano civil vs teto MEI.
 * @param {NotaTraduzida[]} notas
 * @param {number} [ano]
 */
export function somarAno(notas, ano = new Date().getFullYear()) {
  const noAno = notas.filter((n) => anoDaNota(n) === ano && n.contaNoTeto)
  const total = noAno.reduce((acc, n) => acc + (Number(n.valor) || 0), 0)
  const pct = TETO_MEI > 0 ? (total / TETO_MEI) * 100 : 0

  let faixa = 'ok'
  if (total > TOLERANCIA_MEI) faixa = 'estouro'
  else if (total > TETO_MEI) faixa = 'tolerancia'
  else if (pct >= 80) faixa = 'alerta'

  return {
    ano,
    total,
    quantidade: noAno.length,
    pct: Math.round(pct * 10) / 10,
    faixa,
    teto: TETO_MEI,
    tolerancia: TOLERANCIA_MEI,
    restante: Math.max(0, TETO_MEI - total),
  }
}

function anoDaNota(n) {
  if (!n?.data || n.data === '—') return new Date().getFullYear()
  // dd/mm/yyyy
  const br = String(n.data).match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return Number(br[3])
  const iso = String(n.data).match(/(\d{4})/)
  if (iso) return Number(iso[1])
  return new Date().getFullYear()
}

export function exportarJson(notas) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          produto: 'Fiscal Cofre',
          exportadoEm: new Date().toISOString(),
          aviso: 'Backup local. Não é declaração oficial.',
          notas: notas.map(({ xmlBruto, ...rest }) => ({
            ...rest,
            temXml: Boolean(xmlBruto),
            xmlBruto: xmlBruto || undefined,
          })),
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fiscal-cofre-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
