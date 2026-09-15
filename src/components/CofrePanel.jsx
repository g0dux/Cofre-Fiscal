import { useMemo, useRef, useState } from 'react'
import { ANO_REFERENCIA } from '../engine/constantes.js'
import { baixarXml, exportarJson, importarJson } from '../engine/cofre.js'
import { formatBRL } from '../engine/money.js'
import { criarLancamentoManual, parseXmlNota } from '../engine/xml.js'

export default function CofrePanel({
  notas,
  ano = ANO_REFERENCIA,
  onAdd,
  onAddMany,
  onRemove,
  onToggleTeto,
  onClear,
  onNotify,
}) {
  const fileRef = useRef(null)
  const importRef = useRef(null)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [dragging, setDragging] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [somenteAno, setSomenteAno] = useState(true)
  const [manual, setManual] = useState({
    data: `${ANO_REFERENCIA}-03-15`,
    descricao: '',
    valor: '',
    contaNoTeto: true,
  })

  const filtradas = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    return notas.filter((n) => {
      if (somenteAno) {
        const br = String(n.data).match(/(\d{2})\/(\d{2})\/(\d{4})/)
        const y = br ? Number(br[3]) : ANO_REFERENCIA
        if (y !== ano) return false
      }
      if (!q) return true
      const blob = `${n.resumo} ${n.emitente} ${n.destinatario} ${n.tipo} ${n.numero}`.toLowerCase()
      return blob.includes(q)
    })
  }, [notas, filtro, somenteAno, ano])

  async function handleFiles(files) {
    setErro('')
    setOk('')
    const list = [...(files || [])]
    if (!list.length) return
    let okCount = 0
    const errs = []
    for (const file of list) {
      try {
        onAdd(parseXmlNota(await file.text()))
        okCount += 1
      } catch (err) {
        errs.push(`${file.name}: ${err.message || 'falha'}`)
      }
    }
    if (okCount) setOk(`${okCount} arquivo(s) processado(s).`)
    if (errs.length) setErro(errs.join(' · '))
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleManual(e) {
    e.preventDefault()
    setErro('')
    setOk('')
    try {
      const dataBR = manual.data
        ? manual.data.split('-').reverse().join('/')
        : new Date().toLocaleDateString('pt-BR')
      onAdd(
        criarLancamentoManual({
          data: dataBR,
          descricao: manual.descricao,
          valor: manual.valor,
          contaNoTeto: manual.contaNoTeto,
        }),
      )
      setManual((m) => ({ ...m, descricao: '', valor: '' }))
      setOk('Lançamento manual guardado.')
    } catch (err) {
      setErro(err.message || 'Falha no lançamento manual.')
    }
  }

  async function handleImportJson(file) {
    setErro('')
    setOk('')
    try {
      const { notas: next, adicionadas, duplicatas } = importarJson(await file.text(), notas)
      onAddMany(next, `Import: ${adicionadas} nova(s), ${duplicatas} duplicata(s).`)
      setOk(`Backup importado: +${adicionadas}, ${duplicatas} duplicata(s).`)
    } catch (err) {
      setErro(err.message || 'Falha ao importar JSON.')
    }
    if (importRef.current) importRef.current.value = ''
  }

  async function loadSample(name) {
    setErro('')
    setOk('')
    try {
      const res = await fetch(`/samples/${name}`)
      if (!res.ok) throw new Error('Amostra não encontrada.')
      onAdd(parseXmlNota(await res.text()))
      setOk(`Amostra ${name} carregada.`)
    } catch (err) {
      setErro(err.message || 'Falha ao carregar amostra.')
    }
  }

  return (
    <div className="panel-block">
      <header className="section-head">
        <p className="eyebrow">Cofre + Tradutor</p>
        <h2>Guarde o XML. Leia em português.</h2>
        <p className="lede">
          Guarda local no navegador, com dedupe por chave/fingerprint, import/export e download do
          XML original. PDF do DANFE não substitui o XML.
        </p>
      </header>

      <div
        className={`cofre-actions ${dragging ? 'is-dragging' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <label className="upload-zone">
          <input
            ref={fileRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span className="upload-title">Soltar ou escolher XML</span>
          <span className="upload-sub">NF-e · NFC-e · NFS-e · vários de uma vez</span>
        </label>

        <div className="toolbar">
          <button type="button" className="btn btn-ghost" onClick={() => loadSample('nfe-exemplo.xml')}>
            Amostra NF-e
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => loadSample('nfce-exemplo.xml')}>
            Amostra NFC-e
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => loadSample('nfse-exemplo.xml')}>
            Amostra NFS-e
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!notas.length}
            onClick={() => exportarJson(notas)}
          >
            Exportar JSON
          </button>
          <label className="btn btn-ghost file-btn">
            Importar JSON
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => e.target.files?.[0] && handleImportJson(e.target.files[0])}
            />
          </label>
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

      {(erro || ok) && (
        <p className={erro ? 'erro' : 'ok-msg'} role="status">
          {erro || ok}
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
              placeholder="1.500,00"
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
        <div className="lista-toolbar">
          <h3>Linhas humanas ({filtradas.length})</h3>
          <div className="lista-filters">
            <label className="check compact">
              <input
                type="checkbox"
                checked={somenteAno}
                onChange={(e) => setSomenteAno(e.target.checked)}
              />
              Só {ano}
            </label>
            <input
              type="search"
              className="search"
              placeholder="Buscar emitente, valor, tipo…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        {!filtradas.length && (
          <p className="empty">
            Nenhum lançamento neste filtro. Carregue uma amostra ou solte um XML real.
          </p>
        )}

        <ul>
          {filtradas.map((n) => (
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
                  Valor: {formatBRL(n.valor)}
                  {n.numero !== '—' && <> · Nº {n.numero}</>}
                </p>
                <div className="nota-actions">
                  <label className="check compact">
                    <input
                      type="checkbox"
                      checked={n.contaNoTeto}
                      onChange={(e) => onToggleTeto(n.id, e.target.checked)}
                    />
                    Conta no teto
                  </label>
                  {n.xmlBruto && (
                    <button
                      type="button"
                      className="btn btn-tiny"
                      onClick={() => {
                        try {
                          baixarXml(n)
                        } catch (err) {
                          onNotify?.({ text: err.message, tone: 'erro' })
                        }
                      }}
                    >
                      Baixar XML
                    </button>
                  )}
                  <button type="button" className="btn btn-tiny" onClick={() => onRemove(n.id)}>
                    Remover
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
