import { useMemo, useState } from 'react'
import DecisorForm from './components/DecisorForm.jsx'
import CofrePanel from './components/CofrePanel.jsx'
import Relogio from './components/Relogio.jsx'
import {
  DATA_NORMA_TELA,
  DISCLAIMER,
  FRASE_PRODUTO,
  LINKS_OFICIAIS,
} from './engine/constantes.js'
import {
  carregarCofre,
  limparCofre,
  salvarCofre,
  somarAno,
} from './engine/cofre.js'

export default function App() {
  const [notas, setNotas] = useState(() => carregarCofre().notas)

  const soma = useMemo(() => somarAno(notas), [notas])

  function handleAdd(nota) {
    const next = [nota, ...notas]
    setNotas(next)
    salvarCofre(next)
  }

  function handleRemove(id) {
    const next = notas.filter((n) => n.id !== id)
    setNotas(next)
    salvarCofre(next)
  }

  function handleClear() {
    limparCofre()
    setNotas([])
  }

  return (
    <div className="app">
      <a className="skip" href="#app">
        Ir ao conteúdo
      </a>

      <header className="topbar">
        <a className="brand-mark" href="#topo">
          <span className="brand-mark-icon" aria-hidden="true" />
          Fiscal Cofre
        </a>
        <nav className="topnav" aria-label="Seções">
          <a href="#decisor">Decisor</a>
          <a href="#relogio">Relógio</a>
          <a href="#cofre">Cofre</a>
        </nav>
      </header>

      <main id="app">
        <section className="hero" id="topo">
          <div className="hero-atmosphere" aria-hidden="true">
            <div className="hero-glow" />
            <div className="hero-grid" />
            <div className="hero-vault">
              <svg viewBox="0 0 640 480" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="vaultFace" x1="120" y1="40" x2="520" y2="440" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1A6B45" />
                    <stop offset="0.55" stopColor="#0C3D28" />
                    <stop offset="1" stopColor="#062318" />
                  </linearGradient>
                  <linearGradient id="goldRing" x1="260" y1="160" x2="380" y2="300" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F5D76E" />
                    <stop offset="1" stopColor="#C8962E" />
                  </linearGradient>
                </defs>
                <rect x="90" y="70" width="460" height="340" rx="28" fill="url(#vaultFace)" opacity="0.92" />
                <rect x="118" y="98" width="404" height="284" rx="18" stroke="#E8C45A" strokeOpacity="0.35" strokeWidth="2" />
                <circle cx="320" cy="230" r="78" stroke="url(#goldRing)" strokeWidth="10" />
                <circle cx="320" cy="230" r="42" fill="#0A2E1E" stroke="#E8C45A" strokeWidth="3" />
                <circle cx="320" cy="230" r="10" fill="#F0C14B" />
                <path d="M320 188v-18M320 290v18M278 230h-18M380 230h18" stroke="#E8C45A" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
                <rect x="150" y="130" width="70" height="12" rx="6" fill="#E8C45A" opacity="0.25" />
                <rect x="420" y="130" width="70" height="12" rx="6" fill="#E8C45A" opacity="0.25" />
                <rect x="150" y="330" width="70" height="12" rx="6" fill="#E8C45A" opacity="0.2" />
                <rect x="420" y="330" width="70" height="12" rx="6" fill="#E8C45A" opacity="0.2" />
              </svg>
            </div>
          </div>

          <div className="hero-copy">
            <p className="hero-brand">Fiscal Cofre</p>
            <h1>Mapa do teto e do XML para quem vive de Pix e nota.</h1>
            <p className="hero-support">
              Decisor de regime, cofre de XML e relógio do teto MEI — sem emitir nota e sem fingir que
              somos a Receita.
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#decisor">
                Começar pelo Decisor
              </a>
              <a className="btn btn-ghost-light" href="#cofre">
                Abrir o cofre
              </a>
            </div>
            <p className="hero-tagline">{FRASE_PRODUTO}</p>
          </div>
        </section>

        <aside className="disclaimer-bar" role="note">
          <strong>Atenção.</strong> {DISCLAIMER} Referência de tela: {DATA_NORMA_TELA}.
        </aside>

        <section className="section" id="decisor">
          <DecisorForm />
        </section>

        <section className="section section-relogio" id="relogio">
          <Relogio soma={soma} />
        </section>

        <section className="section" id="cofre">
          <CofrePanel
            notas={notas}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onClear={handleClear}
          />
        </section>

        <section className="section section-links">
          <header className="section-head">
            <p className="eyebrow">Fontes</p>
            <h2>Confira no lugar certo</h2>
            <p className="lede">O app aponta. A decisão é no Portal e com o contador.</p>
          </header>
          <ul className="links-oficiais">
            <li>
              <a href={LINKS_OFICIAIS.portalEmpreendedor} target="_blank" rel="noreferrer">
                Portal do Empreendedor
              </a>
            </li>
            <li>
              <a href={LINKS_OFICIAIS.receita} target="_blank" rel="noreferrer">
                Receita Federal
              </a>
            </li>
            <li>
              <a href={LINKS_OFICIAIS.sebrae} target="_blank" rel="noreferrer">
                Sebrae
              </a>
            </li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>
          <strong>Fiscal Cofre</strong> · V1 local · {DATA_NORMA_TELA}
        </p>
        <p className="muted">{FRASE_PRODUTO}</p>
      </footer>
    </div>
  )
}
