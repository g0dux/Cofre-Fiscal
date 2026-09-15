import { useRef, useState } from 'react'
import { criarLancamentoManual, parseXmlNota } from '../engine/xml.js'
import { exportarJson } from '../engine/cofre.js'

export default function CofrePanel({ notas, onAdd, onRemove, onClear }) {
  const fileRef = useRef(null)
  const [erro, setErro] = useState('')
  const [manual, setManual] = useState({
    data: new Date().toISOString().slice(0, 10),
    descricao: '',
    valor: '',
    contaNoTeto: true,
  })

  async function handleFiles(files) {
    setErro('')
    const list = [...files]
    for (const file of list) {
      try {
        const text = await file.text()
        const nota = parseXmlNota(text)
        onAdd(nota)
      } catch (err) {
        setErro(err.message || 'Falha ao ler XML.')
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleManual(e) {
    e.preventDefault()
    setErro('')
    const valor = Number(String(manual.valor).replace(/\./g, '').replace(',', '.'))
    if (!valor || valor <= 0) {
      setErro('Informe um valor válido no lançamento manual.')
      return
    }
    const dataBR = manual.data
      ? manual.data.split('-').reverse().join('/')
      : new Date().toLocaleDateString('pt-BR')
    const nota = criarLancamentoManual({
      data: dataBR,
      descricao: manual.descricao,
      valor,
      contaNoTeto: manual.contaNoTeto,
    })
    onAdd(nota)
    setManual((m) => ({ ...m, descricao: '', valor: '' }))
  }

  return (
    <div className="panel-block">
      <header className="section-head">
        <p className="eyebrow">Cofre + Tradutor</p>
        <h2>Guarde o XML. Leia em português.</h2>
        <p className="lede">
          A obrigação de guarda, em geral, é do XML por 5 anos. PDF do DANFE / DANFSE não substitui.
          Tudo fica neste navegador (localStorage) — some se limpar os dados do site.
        </p>
      </header>

      <div className="cofre-actions">
        <label className="upload-zone">
          <input
            ref={fileRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span className="upload-title">Soltar ou escolher XML</span>
          <span className="upload-sub">NF-e · NFC-e · NFS-e</span>
        </label>

        <div className="toolbar">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!notas.length}
            onClick={() => exportarJson(notas)}
          >
            Exportar JSON
          </button>
          <button
            type="button"
            className="btn btn-ghost danger"
            disabled={!notas.length}
            onClick={() => {
              if (confirm('Apagar todo o cofre deste navegador?')) onClear()
            }}
          >
            Limpar cofre
          </button>
        </div>
      </div>

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      <form className="manual-form" onSubmit={handleManual}>
        <h3>Lançamento manual (Pix sem XML)</h3>
        <div className="manual-grid">
          <label className="field">
            <span>Data</span>
            <input
              type="date"
              value={manual.data}
              onChange={(e) => setManual((m) => ({ ...m, data: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>Quem pagou / descrição</span>
            <input
              type="text"
              placeholder="Cliente, serviço…"
              value={manual.descricao}
              onChange={(e) => setManual((m) => ({ ...m, descricao: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>Valor (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="1500"
              value={manual.valor}
              onChange={(e) => setManual((m) => ({ ...m, valor: e.target.value }))}
              required
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={manual.contaNoTeto}
              onChange={(e) => setManual((m) => ({ ...m, contaNoTeto: e.target.checked }))}
            />
            Conta no teto MEI
          </label>
        </div>
        <button type="submit" className="btn btn-secondary">
          Guardar lançamento
        </button>
      </form>

      <div className="tradutor-lista">
        <h3>Linhas humanas</h3>
        {!notas.length && (
          <p className="empty">
            Nenhum XML ou Pix ainda. O primeiro arquivo verdadeiro é o teste que importa.
          </p>
        )}
        <ul>
          {notas.map((n) => (
            <li key={n.id} className="nota-linha">
              <div>
                <p className="nota-meta">
                  <span className="tag">{n.tipo}</span>
                  <time>{n.data}</time>
                  {n.contaNoTeto ? (
                    <span className="pill-ok">conta no teto</span>
                  ) : (
                    <span className="pill-off">fora do teto</span>
                  )}
                </p>
                <p className="nota-resumo">{n.resumo}</p>
                <p className="nota-detail muted">
                  {n.emitente !== 'Você' && <>Emitente: {n.emitente} · </>}
                  Valor:{' '}
                  {n.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  {n.numero !== '—' && <> · Nº {n.numero}</>}
                </p>
              </div>
              <button type="button" className="btn btn-tiny" onClick={() => onRemove(n.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
