/**
 * Parser leve de XML de NF-e / NFC-e / NFS-e.
 * Dialetos de prefeitura variam — ajuste conforme XMLs reais.
 */

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
 * @property {string} resumo
 * @property {string} xmlBruto
 */

/**
 * @param {string} xmlText
 * @returns {NotaTraduzida}
 */
export function parseXmlNota(xmlText) {
  if (!xmlText || typeof xmlText !== 'string') {
    throw new Error('XML vazio.')
  }

  const trimmed = xmlText.trim()
  if (!trimmed.startsWith('<')) {
    throw new Error('Arquivo não parece XML.')
  }

  const doc = new DOMParser().parseFromString(trimmed, 'application/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('XML inválido ou malformado.')
  }

  const tipo = detectarTipo(doc, trimmed)
  const valor = extrairValor(doc, tipo)
  const data = extrairData(doc, tipo)
  const emitente = extrairNome(doc, ['emit', 'prestador', 'Emitente', 'PrestadorServico'])
  const destinatario = extrairNome(doc, [
    'dest',
    'toma',
    'TomadorServico',
    'Destinatario',
    'tomador',
  ])
  const numero =
    textOf(doc, ['nNF', 'nNFS', 'Numero', 'nDPS', 'IdentificacaoRps > Numero']) || '—'
  const chave =
    textOf(doc, ['chNFe', 'CodigoVerificacao', 'infNFe', 'Id']) ||
    gerarIdCurto(trimmed)

  const quemPagou = destinatario || 'Não identificado'
  const contaNoTeto = true // emissão própria conta; ajuste fino em V2

  const resumo = montarResumo({ tipo, data, quemPagou, valor, contaNoTeto })

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tipo,
    data,
    emitente: emitente || 'Não identificado',
    destinatario: destinatario || 'Não identificado',
    quemPagou,
    valor,
    contaNoTeto,
    numero,
    chave: String(chave).replace(/^NFe/, '').slice(0, 44),
    resumo,
    xmlBruto: trimmed,
  }
}

function detectarTipo(doc, raw) {
  const root = (doc.documentElement?.localName || '').toLowerCase()
  const blob = raw.slice(0, 800).toLowerCase()

  if (root.includes('nfe') || blob.includes('infNFe'.toLowerCase()) || blob.includes('<nfe')) {
    if (blob.includes('mod>65') || blob.includes('<mod>65')) return 'NFC-e'
    return 'NF-e'
  }
  if (
    root.includes('nfse') ||
    blob.includes('nfse') ||
    blob.includes('compnfse') ||
    blob.includes('tcnfse') ||
    blob.includes('dps')
  ) {
    return 'NFS-e'
  }
  if (blob.includes('nfe')) return 'NF-e'
  return 'XML'
}

function extrairValor(doc, tipo) {
  const candidatos =
    tipo === 'NFS-e'
      ? [
          'ValorServicos',
          'ValorLiquidoNfse',
          'vServ',
          'valor',
          'Valores > ValorServicos',
          'infNFSe > valores > vServ',
          'valores > vServ',
        ]
      : ['vNF', 'vProd', 'ValorTotal', 'total > ICMSTot > vNF']

  for (const sel of candidatos) {
    const t = textOf(doc, [sel])
    if (t) {
      const n = parseBRNumber(t)
      if (!Number.isNaN(n) && n > 0) return n
    }
  }

  // fallback: maior número com aspecto de valor monetário em tags comuns
  const tags = doc.querySelectorAll('vNF, ValorServicos, vServ, ValorLiquidoNfse')
  for (const el of tags) {
    const n = parseBRNumber(el.textContent)
    if (!Number.isNaN(n) && n > 0) return n
  }

  return 0
}

function extrairData(doc) {
  const candidatos = [
    'dhEmi',
    'dEmi',
    'DataEmissao',
    'DataEmisao',
    'Competencia',
    'dhEvento',
    'Data',
    'tpAmb',
  ]
  for (const sel of candidatos) {
    const t = textOf(doc, [sel])
    if (t && /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(t)) {
      return normalizarData(t)
    }
  }
  // dhEmi ISO
  const any = [...doc.querySelectorAll('*')].find((el) => {
    const name = el.localName?.toLowerCase() || ''
    return name.includes('emi') || name.includes('data')
  })
  if (any?.textContent && /\d{4}-\d{2}/.test(any.textContent)) {
    return normalizarData(any.textContent.trim())
  }
  return '—'
}

function extrairNome(doc, grupos) {
  for (const g of grupos) {
    const nodes = doc.getElementsByTagName(g)
    if (nodes.length) {
      const block = nodes[0]
      const xNome = textIn(block, ['xNome', 'RazaoSocial', 'NomeFantasia', 'nome'])
      if (xNome) return xNome
    }
    const t = textOf(doc, [`${g} > xNome`, `${g} > RazaoSocial`, `${g} xNome`])
    if (t) return t
  }
  const xNome = doc.querySelector('xNome, RazaoSocial, NomeFantasia')
  return xNome?.textContent?.trim() || ''
}

function textOf(doc, selectors) {
  for (const sel of selectors) {
    try {
      // try CSS-ish then tag walk
      const byCss = doc.querySelector(sel.replace(/\s*>\s*/g, ' '))
      if (byCss?.textContent?.trim()) return byCss.textContent.trim()
    } catch {
      /* ignore invalid selector */
    }
    const parts = sel.split(/\s*>\s*/)
    const tag = parts[parts.length - 1].trim()
    const els = doc.getElementsByTagName(tag)
    if (els.length && els[0].textContent?.trim()) {
      return els[0].textContent.trim()
    }
  }
  return ''
}

function textIn(block, names) {
  for (const n of names) {
    const els = block.getElementsByTagName(n)
    if (els.length && els[0].textContent?.trim()) return els[0].textContent.trim()
  }
  return ''
}

function parseBRNumber(raw) {
  const s = String(raw).trim()
  if (!s) return NaN
  if (s.includes(',') && s.includes('.')) {
    return Number(s.replace(/\./g, '').replace(',', '.'))
  }
  if (s.includes(',')) return Number(s.replace(',', '.'))
  return Number(s)
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
  const v = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const teto = contaNoTeto ? 'conta no teto' : 'não conta no teto'
  return `${tipo} em ${data} · ${quemPagou} · ${v} · ${teto}`
}

function gerarIdCurto(text) {
  let h = 0
  for (let i = 0; i < Math.min(text.length, 400); i++) {
    h = (h << 5) - h + text.charCodeAt(i)
    h |= 0
  }
  return `local-${Math.abs(h)}`
}

/**
 * Lançamento manual (Pix sem XML).
 */
export function criarLancamentoManual({ data, descricao, valor, contaNoTeto = true }) {
  const v = Number(valor) || 0
  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tipo: 'Pix / manual',
    data: data || new Date().toLocaleDateString('pt-BR'),
    emitente: 'Você',
    destinatario: descricao || 'Lançamento manual',
    quemPagou: descricao || 'Cliente',
    valor: v,
    contaNoTeto: Boolean(contaNoTeto),
    numero: '—',
    chave: '',
    resumo: `Pix/manual em ${data || '—'} · ${descricao || 'sem descrição'} · ${v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · ${contaNoTeto ? 'conta no teto' : 'não conta'}`,
    xmlBruto: '',
    manual: true,
  }
}
