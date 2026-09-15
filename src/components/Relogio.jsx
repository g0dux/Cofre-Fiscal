import { TETO_MEI, TOLERANCIA_MEI, DATA_NORMA_TELA } from '../engine/constantes.js'

export default function Relogio({ soma }) {
  const pctVisual = Math.min(100, soma.pct)
  const faixaLabel = {
    ok: 'Dentro do teto',
    alerta: 'Perto do teto (≥ 80%)',
    tolerancia: 'Faixa de tolerância (até +20%)',
    estouro: 'Acima da tolerância',
  }[soma.faixa]

  return (
    <div className={`relogio faixa-${soma.faixa}`}>
      <header className="section-head compact">
        <p className="eyebrow">Relógio</p>
        <h2>Teto MEI {soma.ano}</h2>
        <p className="lede">
          Soma do que está no cofre e conta no teto. Referência {DATA_NORMA_TELA} — confira a norma
          vigente.
        </p>
      </header>

      <div className="relogio-valor">
        <p className="relogio-total">
          {soma.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <p className="relogio-sub">
          de R$ {TETO_MEI.toLocaleString('pt-BR')} · {soma.quantidade} lançamento
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
          style={{ left: `${(TOLERANCIA_MEI / TETO_MEI) * 100}%` }}
          title="Tolerância 97.200"
        />
      </div>

      <div className="relogio-meta">
        <p>
          <strong>{soma.pct}%</strong> do teto
        </p>
        <p className={`faixa-badge faixa-${soma.faixa}`}>{faixaLabel}</p>
        <p className="muted">
          Restam cerca de{' '}
          {soma.restante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} até R${' '}
          {TETO_MEI.toLocaleString('pt-BR')}. Tolerância citada: R${' '}
          {TOLERANCIA_MEI.toLocaleString('pt-BR')}.
        </p>
      </div>
    </div>
  )
}
