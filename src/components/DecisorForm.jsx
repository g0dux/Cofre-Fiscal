import { useMemo, useState } from 'react'
import { CNAE_AMOSTRA } from '../engine/constantes.js'
import { decidirRegime } from '../engine/decisor.js'

const INITIAL = {
  faturamentoAno: '',
  vendePara: 'ambos',
  tipoAtividade: 'servico',
  cnae: '',
  querCnpj: true,
  temEmpregado: false,
  qtdEmpregados: 1,
}

export default function DecisorForm({ onResultado }) {
  const [form, setForm] = useState(INITIAL)
  const [resultado, setResultado] = useState(null)

  const cnaeOptions = useMemo(() => CNAE_AMOSTRA, [])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const r = decidirRegime({
      ...form,
      faturamentoAno: Number(String(form.faturamentoAno).replace(/\./g, '').replace(',', '.')) || 0,
      querCnpj: form.querCnpj === true || form.querCnpj === 'true',
      temEmpregado: form.temEmpregado === true || form.temEmpregado === 'true',
    })
    setResultado(r)
    onResultado?.(r)
  }

  return (
    <div className="panel-block">
      <header className="section-head">
        <p className="eyebrow">Decisor</p>
        <h2>Que regime parece caber no seu perfil?</h2>
        <p className="lede">
          Responda o que você sabe hoje. O resultado é referência de produto — confirme no Portal do
          Empreendedor.
        </p>
      </header>

      <form className="decisor-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Faturamento no ano (R$)</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="ex.: 45000"
            value={form.faturamentoAno}
            onChange={(e) => set('faturamentoAno', e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Vende para</span>
          <select value={form.vendePara} onChange={(e) => set('vendePara', e.target.value)}>
            <option value="cpf">Só CPF (pessoa física)</option>
            <option value="cnpj">Só CNPJ</option>
            <option value="ambos">CPF e CNPJ</option>
          </select>
        </label>

        <label className="field">
          <span>Tipo de atividade</span>
          <select
            value={form.tipoAtividade}
            onChange={(e) => set('tipoAtividade', e.target.value)}
          >
            <option value="comercio">Comércio / indústria</option>
            <option value="servico">Serviço</option>
            <option value="comercio_servico">Comércio + serviço</option>
            <option value="caminhoneiro">Caminhoneiro</option>
            <option value="outro">Outro</option>
          </select>
        </label>

        <label className="field">
          <span>CNAE (amostra — não é lista oficial)</span>
          <select value={form.cnae} onChange={(e) => set('cnae', e.target.value)}>
            <option value="">Não sei / não está na amostra</option>
            {cnaeOptions.map((c) => (
              <option key={c.codigo} value={c.codigo}>
                {c.codigo} — {c.nome}
                {!c.mei ? ' (fora do MEI na amostra)' : ''}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="field-row">
          <legend>Quer CNPJ?</legend>
          <label className="radio">
            <input
              type="radio"
              name="querCnpj"
              checked={form.querCnpj === true}
              onChange={() => set('querCnpj', true)}
            />
            Sim
          </label>
          <label className="radio">
            <input
              type="radio"
              name="querCnpj"
              checked={form.querCnpj === false}
              onChange={() => set('querCnpj', false)}
            />
            Não / ainda não
          </label>
        </fieldset>

        <fieldset className="field-row">
          <legend>Tem empregado?</legend>
          <label className="radio">
            <input
              type="radio"
              name="temEmpregado"
              checked={form.temEmpregado === false}
              onChange={() => set('temEmpregado', false)}
            />
            Não
          </label>
          <label className="radio">
            <input
              type="radio"
              name="temEmpregado"
              checked={form.temEmpregado === true}
              onChange={() => set('temEmpregado', true)}
            />
            Sim
          </label>
          {form.temEmpregado && (
            <label className="field inline">
              <span>Quantos?</span>
              <input
                type="number"
                min="1"
                max="99"
                value={form.qtdEmpregados}
                onChange={(e) => set('qtdEmpregados', e.target.value)}
              />
            </label>
          )}
        </fieldset>

        <button type="submit" className="btn btn-primary">
          Ver leitura de perfil
        </button>
      </form>

      {resultado && <ResultadoDecisor resultado={resultado} />}
    </div>
  )
}

function ResultadoDecisor({ resultado }) {
  const tone = {
    alta: 'tone-ok',
    media: 'tone-mid',
    alerta: 'tone-warn',
    baixa: 'tone-mid',
  }[resultado.compatibilidade]

  return (
    <div className={`resultado ${tone}`} role="status">
      <p className="resultado-kicker">Leitura de referência · confira no Portal</p>
      <h3>{resultado.titulo}</h3>
      <p>{resultado.resumo}</p>

      {resultado.dasRef && (
        <p className="das-ref">
          DAS de referência ({resultado.dasRef.rotulo}):{' '}
          <strong>
            {resultado.dasRef.valor.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </strong>
          <span className="muted"> — {resultado.dasRef.nota}</span>
        </p>
      )}

      <p className="pct-line">
        Você já comeu <strong>{resultado.metricas.pctTeto}%</strong> do teto MEI (R${' '}
        {resultado.metricas.tetoMei.toLocaleString('pt-BR')}), com base no que informou.
      </p>

      {resultado.alertas.length > 0 && (
        <div className="lista-bloco">
          <h4>Alertas</h4>
          <ul>
            {resultado.alertas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {resultado.fazer.length > 0 && (
        <div className="lista-bloco">
          <h4>Fazer</h4>
          <ol>
            {resultado.fazer.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
