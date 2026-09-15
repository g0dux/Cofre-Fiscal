# Fiscal Cofre

Mapa do teto e do XML. **Não somos a Receita.**

Sistema digital para autônomo, MEI e nanoempreendedor no Brasil.

- **Decisor** — leitura de perfil (nano / MEI / ME / CNAE fora), com disclaimer grosso
- **Cofre** — guarda XML de NF-e / NFC-e / NFS-e no navegador (localStorage)
- **Relógio** — soma do ano vs teto MEI (R$ 81.000) e faixa de tolerância
- **Tradutor** — XML vira linha humana: data, quem pagou, valor, se conta no teto

Isto **não** é parecer jurídico, emissor de nota nem contabilidade.

## Rodar

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Arquivos que importam

- `src/App.jsx`
- `src/engine/constantes.js`
- `src/engine/decisor.js`
- `src/engine/xml.js`
- `src/engine/cofre.js`

## V1 — o que tem / o que não tem

**Tem:** formulário de regime, upload XML local, Pix manual, soma do teto, export JSON, disclaimer.

**Não tem:** login, nuvem, pagamento, emissão de nota, certificado A1, lista oficial completa de CNAE, alerta por e-mail.

## Primeiro teste real

Jogue **um XML verdadeiro** no cofre. Se o parser falhar, ajuste `src/engine/xml.js` antes de pensar em login.

## Referência 2026

Constantes em `src/engine/constantes.js`. Atualize quando a norma mudar. Confira sempre no [Portal do Empreendedor](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor).

Ver também `ROADMAP.md` e o documento de produto na raiz da ideia.
