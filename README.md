# Fiscal Cofre

Mapa do teto e do XML. **Não somos a Receita.**

Sistema local para autônomo, MEI e nanoempreendedor no Brasil:

- **Decisor** — leitura de perfil (nano / MEI / ME / CNAE fora), com disclaimer
- **Cofre** — guarda XML de NF-e / NFC-e / NFS-e no navegador (localStorage)
- **Relógio** — soma do ano vs teto MEI (R$ 81.000), tolerância e breakdown mensal
- **Tradutor** — XML vira linha humana: data, quem pagou, valor, se conta no teto

Isto **não** é parecer jurídico, emissor de nota nem contabilidade.

## Rodar

```bash
npm install
npm run dev
```

Build / qualidade:

```bash
npm run build
npm run lint
npm test
```

## O que ficou robusto na V1

- Parser XML agnóstico a namespace (NF-e, NFC-e, NFS-e)
- Dedupe por chave/fingerprint
- Import/export JSON + download do XML original
- Lançamento manual (Pix)
- Toggle “conta no teto”
- Relógio com seletor de ano e gráfico mensal
- Decisor ligado à soma do cofre
- Amostras em `public/samples/`
- Testes da engine (`npm test`)

## Ainda não tem (de propósito)

Login, nuvem, pagamento, emissão de nota, certificado A1, lista oficial completa de CNAE, alerta por e-mail.

## Referência 2026

Constantes em `src/engine/constantes.js`. Confira sempre no [Portal do Empreendedor](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor).

Ver também `ROADMAP.md`.
