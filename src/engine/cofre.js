/**
 * Cofre local — localStorage com dedupe, import e métricas mensais.
 */

import { ANO_REFERENCIA, TETO_MEI, TOLERANCIA_MEI } from './constantes.js'
import { atualizarResumo } from './xml.js'

const STORAGE_KEY = 'fiscal-cofre:v1'
const MAX_SAFE_BYTES = 4.5 * 1024 * 1024

/**
 * @typedef {import('./xml.js').NotaTraduzida} NotaTraduzida
 */

export function carregarCofre() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { notas: [], atualizadoEm: null }
    const data = JSON.parse(raw)
    const notas = Array.isArray(data.notas) ? data.notas.map(normalizarNota).filter(Boolean) : []
    return { notas, atualizadoEm: data.atualizadoEm || null }
  } catch {
    return { notas: [], atualizadoEm: null }
  }
}

function normalizarNota(n) {
  if (!n || typeof n !== 'object') return null
  const valor = Number(n.valor)
  if (!Number.isFinite(valor) || valor < 0) return null
  return {
    id: String(n.id || `mig-${Math.random().toString(36).slice(2)}`),
    tipo: n.tipo || 'XML',
    data: n.data || '—',
    emitente: n.emitente || '—',
    destinatario: n.destinatario || '—',
    quemPagou: n.quemPagou || n.destinatario || '—',
    valor,
    contaNoTeto: n.contaNoTeto !== false,
    numero: n.numero || '—',
    chave: n.chave || '',
    fingerprint: n.fingerprint || n.chave || n.id,
    resumo: n.resumo || '',
    xmlBruto: n.xmlBruto || '',
    manual: Boolean(n.manual),
    criadoEm: n.criadoEm || null,
  }
}

/** @param {NotaTraduzida[]} notas */
export function salvarCofre(notas) {
  const payload = {
    versao: 1,
    produto: 'Fiscal Cofre',
    notas,
    atualizadoEm: new Date().toISOString(),
  }
  const json = JSON.stringify(payload)
  if (json.length > MAX_SAFE_BYTES) {
    throw new Error(
      'Cofre grande demais para o navegador (~5 MB). Exporte o JSON e remova XMLs antigos.',
    )
  }
  try {
    localStorage.setItem(STORAGE_KEY, json)
  } catch {
    throw new Error('Sem espaço no navegador para salvar. Exporte o backup e limpe parte do cofre.')
  }
  return payload
}

/**
 * @param {NotaTraduzida[]} notas
 * @param {NotaTraduzida} nota
 */
export function adicionarComDedupe(notas, nota) {
  const fp = nota.fingerprint || nota.chave || nota.id
  const existe = notas.some(
    (n) =>
      (fp && (n.fingerprint === fp || n.chave === fp)) ||
      (nota.chave && n.chave && n.chave === nota.chave && String(nota.chave).length >= 20),
  )
  if (existe) return { notas, duplicata: true }
  return { notas: [nota, ...notas], duplicata: false }
}

export function limparCofre() {
  localStorage.removeItem(STORAGE_KEY)
  return []
}

export function alternarContaNoTeto(notas, id, contaNoTeto) {
  return notas.map((n) =>
    n.id === id ? atualizarResumo({ ...n, contaNoTeto: Boolean(contaNoTeto) }) : n,
  )
}

/** @param {NotaTraduzida[]} notas @param {number} [ano] */
export function somarAno(notas, ano = ANO_REFERENCIA) {
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
    restanteTolerancia: Math.max(0, TOLERANCIA_MEI - total),
  }
}

/** @param {NotaTraduzida[]} notas @param {number} [ano] */
export function somarMeses(notas, ano = ANO_REFERENCIA) {
  const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0, quantidade: 0 }))
  for (const n of notas) {
    if (!n.contaNoTeto || anoDaNota(n) !== ano) continue
    const m = mesDaNota(n)
    if (m < 1 || m > 12) continue
    meses[m - 1].total += Number(n.valor) || 0
    meses[m - 1].quantidade += 1
  }
  return meses
}

export function anosDisponiveis(notas) {
  const set = new Set([ANO_REFERENCIA, new Date().getFullYear()])
  for (const n of notas) set.add(anoDaNota(n))
  return [...set].filter((y) => Number.isFinite(y)).sort((a, b) => b - a)
}

export function anoDaNota(n) {
  if (!n?.data || n.data === '—') return ANO_REFERENCIA
  const br = String(n.data).match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return Number(br[3])
  const iso = String(n.data).match(/(\d{4})/)
  if (iso) return Number(iso[1])
  return ANO_REFERENCIA
}

function mesDaNota(n) {
  if (!n?.data || n.data === '—') return 0
  const br = String(n.data).match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return Number(br[2])
  const iso = String(n.data).match(/(\d{4})-(\d{2})/)
  if (iso) return Number(iso[2])
  return 0
}

export function exportarJson(notas) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          produto: 'Fiscal Cofre',
          versao: 1,
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

/**
 * @param {string} text
 * @param {NotaTraduzida[]} atuais
 */
export function importarJson(text, atuais = []) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('JSON inválido.')
  }
  const lista = Array.isArray(data) ? data : data.notas
  if (!Array.isArray(lista)) throw new Error('Backup sem lista de notas.')

  let next = [...atuais]
  let adicionadas = 0
  let duplicatas = 0
  for (const raw of lista) {
    const nota = normalizarNota(raw)
    if (!nota) continue
    const r = adicionarComDedupe(next, nota)
    if (r.duplicata) duplicatas += 1
    else {
      next = r.notas
      adicionadas += 1
    }
  }
  return { notas: next, adicionadas, duplicatas }
}

export function baixarXml(nota) {
  if (!nota?.xmlBruto) throw new Error('Esta linha não tem XML guardado.')
  const blob = new Blob([nota.xmlBruto], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nota.tipo || 'nota'}-${nota.numero || nota.id}.xml`.replace(/\s+/g, '-')
  a.click()
  URL.revokeObjectURL(url)
}
