import { describe, expect, it } from 'vitest'
import { decidirRegime } from './decisor.js'
import {
  adicionarComDedupe,
  anosDisponiveis,
  importarJson,
  somarAno,
  somarMeses,
} from './cofre.js'
import { formatBRL, parseMoney } from './money.js'
import { criarLancamentoManual, parseXmlNota } from './xml.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

describe('money', () => {
  it('parseia formatos BR', () => {
    expect(parseMoney('1.500,50')).toBe(1500.5)
    expect(parseMoney('R$ 200')).toBe(200)
    expect(parseMoney(90)).toBe(90)
  })

  it('formata BRL', () => {
    expect(formatBRL(1500)).toMatch(/1\.500/)
  })
})

describe('decisor', () => {
  it('indica MEI para perfil típico', () => {
    const r = decidirRegime({
      faturamentoAno: 45000,
      vendePara: 'ambos',
      tipoAtividade: 'servico',
      querCnpj: true,
      temEmpregado: false,
    })
    expect(r.regime).toBe('mei')
    expect(r.compatibilidade).toBe('alta')
    expect(r.dasRef?.valor).toBeGreaterThan(0)
  })

  it('alerta CNAE fora da amostra MEI', () => {
    const r = decidirRegime({
      faturamentoAno: 30000,
      vendePara: 'cnpj',
      tipoAtividade: 'servico',
      cnae: '6201-5/01',
      querCnpj: true,
      temEmpregado: false,
    })
    expect(r.regime).toBe('cnae_fora')
    expect(r.compatibilidade).toBe('alerta')
  })

  it('não duplica itens do checklist', () => {
    const r = decidirRegime({
      faturamentoAno: 20000,
      vendePara: 'cnpj',
      tipoAtividade: 'servico',
      querCnpj: true,
      temEmpregado: false,
    })
    const lower = r.fazer.map((f) => f.toLowerCase())
    expect(new Set(lower).size).toBe(lower.length)
  })
})

describe('cofre', () => {
  it('deduplica e soma por ano/mês', () => {
    const a = criarLancamentoManual({
      data: '15/03/2026',
      descricao: 'Cliente A',
      valor: '1000',
    })
    const b = criarLancamentoManual({
      data: '10/07/2026',
      descricao: 'Cliente B',
      valor: '2500,50',
    })
    let notas = []
    notas = adicionarComDedupe(notas, a).notas
    expect(adicionarComDedupe(notas, a).duplicata).toBe(true)
    notas = adicionarComDedupe(notas, b).notas

    const soma = somarAno(notas, 2026)
    expect(soma.quantidade).toBe(2)
    expect(soma.total).toBeCloseTo(3500.5)
    expect(soma.faixa).toBe('ok')

    const meses = somarMeses(notas, 2026)
    expect(meses[2].total).toBe(1000)
    expect(meses[6].total).toBeCloseTo(2500.5)
    expect(anosDisponiveis(notas)).toContain(2026)
  })

  it('importa backup JSON', () => {
    const nota = criarLancamentoManual({
      data: '01/02/2026',
      descricao: 'Backup',
      valor: 300,
    })
    const { adicionadas, duplicatas, notas } = importarJson(
      JSON.stringify({ notas: [nota] }),
      [],
    )
    expect(adicionadas).toBe(1)
    expect(duplicatas).toBe(0)
    expect(notas).toHaveLength(1)
  })
})

describe('xml', () => {
  it('lê amostra NF-e com namespace', () => {
    const xml = readFileSync(join(root, 'public/samples/nfe-exemplo.xml'), 'utf8')
    const nota = parseXmlNota(xml)
    expect(nota.tipo).toBe('NF-e')
    expect(nota.valor).toBe(1500)
    expect(nota.data).toBe('15/03/2026')
    expect(nota.emitente).toMatch(/MEI Exemplo/i)
  })

  it('lê amostra NFC-e (mod 65)', () => {
    const xml = readFileSync(join(root, 'public/samples/nfce-exemplo.xml'), 'utf8')
    const nota = parseXmlNota(xml)
    expect(nota.tipo).toBe('NFC-e')
    expect(nota.valor).toBeCloseTo(89.9)
  })

  it('lê amostra NFS-e ABRASF', () => {
    const xml = readFileSync(join(root, 'public/samples/nfse-exemplo.xml'), 'utf8')
    const nota = parseXmlNota(xml)
    expect(nota.tipo).toBe('NFS-e')
    expect(nota.valor).toBe(2500)
  })
})
