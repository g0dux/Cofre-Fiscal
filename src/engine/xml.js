/**
 * Parser de XML de NF-e / NFC-e / NFS-e (agnóstico a namespace).
 */

import { formatBRL, parseMoney } from './money.js'

/**
 * @typedef {Object} NotaTraduzida
 * @property {string} id
 * @property {string} tipo
 * @property {string} data
 * @property {string} emitente
 * @property {string} destinatario
 * @property {string} quemPagou
 * @property {number} valor
 * @property {boolean} contaNoTeto
 * @property {string} numero
 * @property {string} chave
 * @property {string} fingerprint
 * @property {string} resumo
 * @property {string} xmlBruto
 * @property {boolean} [manual]
 * @property {string} [criadoEm]
 */

/** @param {string} xmlText @returns {NotaTraduzida} */
export function parseXmlNota(xmlText) {
  if (!xmlText || typeof xmlText !== 'string') throw new Error('XML vazio.')
  const trimmed = xmlText.trim().replace(/^\uFEFF/, '')
  if (!trimmed.startsWith('<')) throw new Error('Arquivo não parece XML.')

  const doc = new DOMParser().parseFromString(trimmed, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('XML inválido ou malformado.')

  const tipo = detectarTipo(doc, trimmed)
  const valor = extrairValor(doc, tipo)
  if (!valor || valor <= 0) {
    throw new Error('Não encontrei valor da nota no XML. Confira o arquivo ou use lançamento manual.')
  }

  const data = extrairData(doc)
  const emitente = extrairNome(doc, ['emit', 'prestador', 'Emitente', 'PrestadorServico', 'prest'])
  const destinatario = extrairNome(doc, [
    'dest',
    'toma',
    'TomadorServico',
    'Destinatario',
    'tomador',
  ])
  const numero = firstText(doc, ['nNF', 'nNFS', 'Numero', 'nDPS', 'nRPS', 'numero']) || '—'
  let chave = firstText(doc, ['chNFe', 'CodigoVerificacao', 'codigo_verificacao']) || ''
  if (!chave) {
    const idAttr =
      findByLocalName(doc, 'infNFe')[0]?.getAttribute('Id') ||
      findByLocalName(doc, 'infNFSe')[0]?.getAttribute('Id') ||
      ''
    chave = String(idAttr).replace(/^NFe/i, '')
  }
  if (!chave) chave = fingerprintXml(trimmed)

  /** @type {NotaTraduzida} */
  const nota = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tipo,
    data,
    emitente: emitente || 'Não identificado',
    destinatario: destinatario || 'Não identificado',
    quemPagou: destinatario || 'Não identificado',
    valor,
    contaNoTeto: true,
    numero,
    chave: String(chave).replace(/^NFe/i, '').slice(0, 44),
    fingerprint: fingerprintNota({ tipo, chave, numero, data, valor, xml: trimmed }),
    resumo: '',
    xmlBruto: trimmed,
    criadoEm: new Date().toISOString(),
  }
  nota.resumo = montarResumo(nota)
  return nota
}

function detectarTipo(doc, raw) {
  const root = (doc.documentElement?.localName || '').toLowerCase()
  const blob = raw.slice(0, 1200).toLowerCase()
  const mod = firstText(doc, ['mod', 'modelo'])
  if (mod === '65' || blob.includes('<mod>65') || blob.includes('>65</mod>')) return 'NFC-e'
  if (
    root.includes('nfe') ||
    blob.includes('infnfe') ||
    blob.includes('<nfe') ||
    findByLocalName(doc, 'infNFe').length
  ) {
    return 'NF-e'
  }
  if (
    root.includes('nfse') ||
    blob.includes('nfse') ||
    blob.includes('compnfse') ||
    blob.includes('dps') ||
    findByLocalName(doc, 'InfNfse').length ||
    findByLocalName(doc, 'infNFSe').length
  ) {
    return 'NFS-e'
  }
  if (blob.includes('nfe')) return 'NF-e'
  return 'XML'
}

function extrairValor(doc, tipo) {
  const candidatos =
    tipo === 'NFS-e'
      ? ['ValorServicos', 'ValorLiquidoNfse', 'vServ', 'valor', 'ValorServico', 'vlServicos']
      : ['vNF', 'vProd', 'ValorTotal', 'vServ']
  for (const name of candidatos) {
    for (const el of findByLocalName(doc, name)) {
      const n = parseMoney(el.textContent)
      if (!Number.isNaN(n) && n > 0) return n
    }
  }
  return 0
}

function extrairData(doc) {
  for (const name of ['dhEmi', 'dEmi', 'DataEmissao', 'DataEmisao', 'Competencia', 'dhEvento', 'Data']) {
    for (const el of findByLocalName(doc, name)) {
      const t = el.textContent?.trim() || ''
      if (/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(t)) return normalizarData(t)
    }
  }
  return '—'
}

function extrairNome(doc, grupos) {
  for (const g of grupos) {
    for (const block of findByLocalName(doc, g)) {
      const xNome = textIn(block, ['xNome', 'RazaoSocial', 'NomeFantasia', 'nome', 'Nome'])
      if (xNome) return xNome
    }
  }
  for (const name of ['xNome', 'RazaoSocial', 'NomeFantasia']) {
    const el = findByLocalName(doc, name)[0]
    if (el?.textContent?.trim()) return el.textContent.trim()
  }
  return ''
}

function findByLocalName(root, localName) {
  const want = localName.toLowerCase()
  const out = []
  const walk = (node) => {
    if (node.nodeType === 1) {
      const ln = (node.localName || node.nodeName || '').toLowerCase()
      const bare = ln.includes(':') ? ln.split(':').pop() : ln
      if (bare === want || ln === want) out.push(node)
      for (const child of node.childNodes) walk(child)
    }
  }
  walk(root.documentElement || root)
  return out
}

function firstText(doc, names) {
  for (const name of names) {
    const t = findByLocalName(doc, name)[0]?.textContent?.trim()
    if (t) return t
  }
  return ''
}

function textIn(block, names) {
  for (const n of names) {
    const t = findByLocalName(block, n)[0]?.textContent?.trim()
    if (t) return t
  }
  return ''
}

function normalizarData(raw) {
  const s = String(raw).trim()
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  const br = s.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return `${br[1]}/${br[2]}/${br[3]}`
  return s.slice(0, 10)
}

function montarResumo({ tipo, data, quemPagou, valor, contaNoTeto }) {
  return `${tipo} em ${data} · ${quemPagou} · ${formatBRL(valor)} · ${
    contaNoTeto ? 'conta no teto' : 'não conta no teto'
  }`
}

export function fingerprintXml(text) {
  let h = 2166136261
  const s = String(text)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `xml-${(h >>> 0).toString(16)}`
}

function fingerprintNota({ tipo, chave, numero, data, valor, xml }) {
  if (chave && String(chave).length >= 20) return `ch-${String(chave).slice(0, 44)}`
  if (xml) return fingerprintXml(xml)
  return `m-${tipo}-${numero}-${data}-${valor}`
}

export function criarLancamentoManual({ data, descricao, valor, contaNoTeto = true }) {
  const v = parseMoney(valor)
  if (!v || v <= 0) throw new Error('Informe um valor válido.')
  const dataBR = data || new Date().toLocaleDateString('pt-BR')
  const desc = (descricao || 'Lançamento manual').trim()
  /** @type {NotaTraduzida} */
  const nota = {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tipo: 'Pix / manual',
    data: dataBR,
    emitente: 'Você',
    destinatario: desc,
    quemPagou: desc,
    valor: v,
    contaNoTeto: Boolean(contaNoTeto),
    numero: '—',
    chave: '',
    fingerprint: `manual-${dataBR}-${v}-${desc.toLowerCase()}`,
    resumo: '',
    xmlBruto: '',
    manual: true,
    criadoEm: new Date().toISOString(),
  }
  nota.resumo = montarResumo(nota)
  return nota
}

/** @param {NotaTraduzida} nota */
export function atualizarResumo(nota) {
  return { ...nota, resumo: montarResumo(nota) }
}
