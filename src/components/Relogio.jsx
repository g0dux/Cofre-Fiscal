import { ANO_REFERENCIA, DATA_NORMA_TELA, TETO_MEI, TOLERANCIA_MEI } from '../engine/constantes.js'
import { formatBRL } from '../engine/money.js'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const FAIXA_LABEL = {
  ok: 'Dentro do teto',
  alerta: 'Perto do teto (≥ 80%)',
  tolerancia: 'Faixa de tolerância (até +20%)',
  estouro: 'Acima da tolerância',
}

export default function Relogio({
  soma,
  meses = [],
  ano = ANO_REFERENCIA,
  anos = [],
  onChangeAno,
}) {
  const pctVisual = Math.min(100, soma.pct)
  const maxMes = Math.max(1, ...meses.map((m) => m.total))

  return (
    <div className={`relogio faixa-${soma.faixa}`}>
      <header className="section-head compact">
        <p className="eyebrow">Relógio</p>
        <div className="relogio-head-row">
          <h2>Teto MEI {ano}</h2>
          {anos.length > 0 && (
            <label className="field inline ano-select">
              <span>Ano</span>
              <select value={ano} onChange={(e) => onChangeAno?.(Number(e.target.value))}>
                {anos.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <p className="lede">
          Soma do que está no cofre e conta no teto. Referência {DATA_NORMA_TELA} — confira a norma
          vigente.
        </p>
      </header>

      <div className="relogio-valor">
        <p className="relogio-total">{formatBRL(soma.total)}</p>
        <p className="relogio-sub">
          de {formatBRL(TETO_MEI, { digits: 0 })} · {soma.quantidade} lançamento
          {soma.quantidade === 1 ? '' : 's'}
        </p>
      </div>

      <div
        className="barra"
        role="progressbar"
        aria-valuenow={soma.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Percentual do teto MEI"
      >
        <div className="barra-fill" style={{ width: `${pctVisual}%` }} />
        <div
          className="barra-mark tolerancia"
          style={{ left: `${Math.min(100, (TOLERANCIA_MEI / TETO_MEI) * 100)}%` }}
          title={`Tolerância ${formatBRL(TOLERANCIA_MEI, { digits: 0 })}`}
        />
      </div>

      <div className="relogio-meta">
        <p>
          <strong>{soma.pct}%</strong> do teto
        </p>
        <p className={`faixa-badge faixa-${soma.faixa}`}>{FAIXA_LABEL[soma.faixa]}</p>
        <p className="muted">
          Restam cerca de {formatBRL(soma.restante)} até {formatBRL(TETO_MEI, { digits: 0 })}.
          Tolerância citada: {formatBRL(TOLERANCIA_MEI, { digits: 0 })}.
        </p>
      </div>

      <div className="meses-grid" aria-label="Faturamento mensal">
        {meses.map((m) => (
          <div key={m.mes} className="mes-cell">
            <div
              className="mes-bar"
              style={{ height: `${Math.max(4, (m.total / maxMes) * 64)}px` }}
              title={formatBRL(m.total)}
            />
            <span className="mes-label">{MESES[m.mes - 1]}</span>
            <span className="mes-val">{m.quantidade ? formatBRL(m.total, { digits: 0 }) : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
