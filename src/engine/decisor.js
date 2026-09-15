/**
 * Decisor de regime — referência de produto, não enquadramento oficial.
 */

import {
  ANO_REFERENCIA,
  CNAE_AMOSTRA,
  DAS_MEI,
  TETO_MEI,
  TETO_NANO,
  TOLERANCIA_MEI,
} from './constantes.js'

/**
 * @typedef {Object} EntradaDecisor
 * @property {number} faturamentoAno
 * @property {'cpf'|'cnpj'|'ambos'} vendePara
 * @property {'comercio'|'servico'|'comercio_servico'|'caminhoneiro'|'outro'} tipoAtividade
 * @property {string} [cnae]
 * @property {boolean} querCnpj
 * @property {boolean} temEmpregado
 * @property {number} [qtdEmpregados]
 */

/**
 * @param {EntradaDecisor} entrada
 */
export function decidirRegime(entrada) {
  const fat = Number(entrada.faturamentoAno) || 0
  const empregados = entrada.temEmpregado
    ? Math.max(1, Number(entrada.qtdEmpregados) || 1)
    : 0
  const cnaeInfo = CNAE_AMOSTRA.find((c) => c.codigo === entrada.cnae)
  const alertas = []
  const fazer = []
  let regime = 'indefinido'
  let titulo = 'Perfil indefinido'
  let resumo = 'Preencha o formulário para uma leitura de referência.'
  let dasRef = null
  let compatibilidade = 'baixa'

  // CNAE fora / irregular
  if (cnaeInfo && cnaeInfo.mei === false) {
    regime = 'cnae_fora'
    titulo = 'Perfil compatível com CNAE fora da amostra MEI'
    resumo =
      'O CNAE informado aparece na amostra como fora do MEI. Isso não é enquadramento oficial — confira a lista do Portal do Empreendedor.'
    compatibilidade = 'alerta'
    alertas.push(cnaeInfo.alerta || 'CNAE parece fora do MEI na amostra do produto.')
    fazer.push('Confira se o CNAE está na lista oficial do MEI no Portal do Empreendedor.')
    fazer.push('Fale com um contador antes de abrir ou manter MEI com essa atividade.')
  } else if (empregados > 1) {
    regime = 'irregular_mei'
    titulo = 'Perfil parece irregular para MEI'
    resumo =
      'MEI admite no máximo 1 empregado. Com mais de um, o perfil deixa de bater com as regras usuais do MEI.'
    compatibilidade = 'alerta'
    alertas.push('Mais de 1 empregado: incompatível com MEI.')
    fazer.push('Avalie desenquadramento e regime adequado (ex.: ME no Simples) com um contador.')
  } else if (fat > TOLERANCIA_MEI) {
    regime = 'me_simples'
    titulo = 'Perfil compatível com ME no Simples (acima da tolerância MEI)'
    resumo = `Faturamento acima de R$ ${fmt(TOLERANCIA_MEI)} (teto + 20% usualmente citado). Parece fora do MEI — confira no Portal.`
    compatibilidade = 'media'
    alertas.push('Estouro acima da faixa de tolerância citada no mercado.')
    fazer.push('Confira regras de desenquadramento e DAS complementar com a Receita / contador.')
    fazer.push('Guarde todos os XML do período.')
  } else if (fat > TETO_MEI) {
    regime = 'mei_tolerancia'
    titulo = 'Perfil compatível com MEI — faixa de tolerância'
    resumo = `Você já passou do teto de R$ ${fmt(TETO_MEI)}, mas ainda está na faixa de tolerância citada (até R$ ${fmt(TOLERANCIA_MEI)}). Confira o que isso implica no Portal.`
    compatibilidade = 'alerta'
    alertas.push('Acima do teto MEI; dentro da tolerância usual de 20% — regras de excesso precisam ser conferidas.')
    dasRef = dasPorTipo(entrada.tipoAtividade, cnaeInfo)
    fazer.push('Acompanhe o faturamento mês a mês no Relógio.')
    fazer.push('Confira no Portal o tratamento do excesso (DAS complementar / desenquadramento).')
  } else if (
    !entrada.querCnpj &&
    fat <= TETO_NANO &&
    empregados === 0 &&
    entrada.vendePara === 'cpf'
  ) {
    regime = 'nano'
    titulo = 'Perfil compatível com nanoempreendedor (referência 2026)'
    resumo = `Nas divulgações de ${ANO_REFERENCIA}, nanoempreendedor costuma ser citado com teto de R$ ${fmt(TETO_NANO)} e dispensas em recorte específico. CONFERIR A NORMA antes de decidir.`
    compatibilidade = 'media'
    alertas.push(
      'Regras de nanoempreendedor estão em transição na reforma — não afirme na prática sem abrir a norma vigente.',
    )
    if (entrada.vendePara !== 'cpf') {
      alertas.push('Venda para CNPJ geralmente exige nota — nano não cobre esse caso típico.')
    }
    fazer.push('Abra a norma / Portal e confira se o recorte de nano cabe no seu caso.')
    fazer.push('Se vender para CNPJ, prepare-se para emitir nota (padrão de mercado).')
    fazer.push('Mesmo assim, guarde comprovantes e XML se emitir.')
  } else if (fat <= TETO_MEI && empregados <= 1 && (!cnaeInfo || cnaeInfo.mei)) {
    regime = 'mei'
    titulo = 'Perfil compatível com MEI'
    resumo = `Faturamento até R$ ${fmt(TETO_MEI)}/ano e demais respostas batem com o perfil usual de MEI. Isso NÃO significa que você está enquadrado — confira no Portal.`
    compatibilidade = 'alta'
    dasRef = dasPorTipo(entrada.tipoAtividade, cnaeInfo)
    if (entrada.vendePara === 'cnpj' || entrada.vendePara === 'ambos') {
      alertas.push('Cliente PJ: nota fiscal é o padrão. Não misture só Pix sem documento.')
      fazer.push('Emita NFS-e / NF-e conforme a atividade e guarde o XML.')
    }
    if (empregados === 1) {
      alertas.push('MEI com 1 empregado: ok na regra usual — fique atento a encargos.')
    }
    fazer.push('Pague o DAS mensal no Portal do Empreendedor.')
    fazer.push('Acompanhe o teto no Relógio deste app.')
    fazer.push('Guarde XML por 5 anos (PDF do DANFE não substitui).')
  } else {
    regime = 'me_simples'
    titulo = 'Perfil compatível com ME no Simples (ou outro regime)'
    resumo =
      'As respostas não fecham limpo no recorte MEI/nano da amostra. Pode ser ME no Simples ou outro caminho — confira com contador.'
    compatibilidade = 'media'
    fazer.push('Leve esses números a um contador antes de abrir ou mudar CNPJ.')
  }

  // Ajustes transversais
  if (entrada.vendePara === 'cnpj' || entrada.vendePara === 'ambos') {
    if (!fazer.some((f) => /nota/i.test(f))) {
      fazer.push('Para cliente PJ, trate nota como padrão e armazene o XML.')
    }
  }

  if (!entrada.cnae) {
    alertas.push('Sem CNAE informado: a leitura fica mais fraca. Use a amostra ou confira o código oficial.')
  }

  const pctTeto = Math.min(999, Math.round((fat / TETO_MEI) * 1000) / 10)

  return {
    regime,
    titulo,
    resumo,
    compatibilidade,
    alertas,
    fazer,
    dasRef,
    metricas: {
      faturamento: fat,
      tetoMei: TETO_MEI,
      tolerancia: TOLERANCIA_MEI,
      tetoNano: TETO_NANO,
      pctTeto,
      empregados,
      cnae: cnaeInfo || null,
      ano: ANO_REFERENCIA,
    },
  }
}

function dasPorTipo(tipo, cnaeInfo) {
  const chave = cnaeInfo?.tipo || tipo
  const mapa = {
    comercio: DAS_MEI.comercio_industria,
    industria: DAS_MEI.comercio_industria,
    comercio_industria: DAS_MEI.comercio_industria,
    servico: DAS_MEI.servico,
    comercio_servico: DAS_MEI.comercio_servico,
    caminhoneiro: DAS_MEI.caminhoneiro,
  }
  const valor = mapa[chave]
  if (valor == null) return null
  return {
    valor,
    rotulo: rotuloDas(chave),
    nota: 'DAS MEI de referência 2026 (Portal do Empreendedor / gov.br). Confira o valor vigente no mês.',
  }
}

function rotuloDas(chave) {
  const labels = {
    comercio: 'Comércio / indústria',
    industria: 'Comércio / indústria',
    comercio_industria: 'Comércio / indústria',
    servico: 'Serviço',
    comercio_servico: 'Comércio + serviço',
    caminhoneiro: 'Caminhoneiro',
  }
  return labels[chave] || 'MEI'
}

function fmt(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0 })
}
