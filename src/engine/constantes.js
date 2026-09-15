/**
 * Constantes de referência do produto — setembro 2026.
 * NÃO é parecer jurídico. Atualizar quando a norma mudar.
 * Confira sempre no Portal do Empreendedor / Receita / contador.
 */

export const ANO_REFERENCIA = 2026
export const DATA_NORMA_TELA = 'setembro de 2026'

export const TETO_MEI = 81000
export const TOLERANCIA_MEI = 97200 // +20% usualmente citada no mercado
export const TETO_NANO = 40500 // metade do teto MEI nas divulgações de 2026 — CONFERIR NORMA

export const DAS_MEI = {
  comercio_industria: 82.05,
  servico: 86.05,
  comercio_servico: 87.05,
  caminhoneiro: 197.5, // faixa ~R$ 195–200
}

export const GUARDA_XML_ANOS = 5

/** Amostra de CNAEs — NÃO é a lista oficial completa. */
export const CNAE_AMOSTRA = [
  {
    codigo: '4712-1/00',
    nome: 'Comércio varejista de mercadorias em geral',
    mei: true,
    tipo: 'comercio',
  },
  {
    codigo: '5611-2/01',
    nome: 'Restaurantes e similares',
    mei: true,
    tipo: 'comercio_servico',
  },
  {
    codigo: '9602-5/01',
    nome: 'Cabeleireiros, manicure e pedicure',
    mei: true,
    tipo: 'servico',
  },
  {
    codigo: '7319-0/02',
    nome: 'Promoção de vendas',
    mei: true,
    tipo: 'servico',
  },
  {
    codigo: '8599-6/04',
    nome: 'Treinamento em desenvolvimento profissional',
    mei: true,
    tipo: 'servico',
  },
  {
    codigo: '4321-5/00',
    nome: 'Instalação e manutenção elétrica',
    mei: true,
    tipo: 'servico',
  },
  {
    codigo: '4930-2/02',
    nome: 'Transporte rodoviário de carga — caminhoneiro',
    mei: true,
    tipo: 'caminhoneiro',
  },
  {
    codigo: '6201-5/01',
    nome: 'Desenvolvimento de programas de computador sob encomenda',
    mei: false,
    tipo: 'servico',
    alerta: 'CNAE de TI sob encomenda em regra NÃO entra no MEI. Confira a lista oficial.',
  },
  {
    codigo: '6920-5/01',
    nome: 'Atividades de consultoria em gestão empresarial',
    mei: false,
    tipo: 'servico',
    alerta: 'Consultoria costuma ficar fora do MEI. Confira a lista oficial do Portal.',
  },
  {
    codigo: '4789-0/99',
    nome: 'Comércio varejista de outros produtos não especificados',
    mei: true,
    tipo: 'comercio',
  },
]

export const LINKS_OFICIAIS = {
  portalEmpreendedor: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor',
  receita: 'https://www.gov.br/receitafederal',
  sebrae: 'https://www.sebrae.com.br',
}

export const FRASE_PRODUTO = 'Mapa do teto e do XML. Não somos a Receita.'

export const DISCLAIMER =
  'Isto NÃO é parecer jurídico nem contábil. Não somos oficiais, parceiros da Receita nem substitutos do Portal do Empreendedor, Sebrae ou contador. Confira a norma vigente antes de qualquer decisão.'
