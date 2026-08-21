---
name: materia
description: Apura e escreve uma matéria da revista EnseadaS a partir de uma pauta escolhida, cria o rascunho em markdown e busca foto com licença livre. Use quando o Douglas disser "escreve a matéria de…", "faz a número 3", "apura essa pauta" ou passar um link para virar matéria.
---

# Escrever uma matéria

Transformar uma pauta em rascunho publicável: apurado, com fontes registradas e foto legal.

## Passo a passo

### 1. Apurar antes de escrever

- `WebFetch` em **todas** as fontes da pauta. Leia de verdade: nome correto das pessoas e
  instituições, números, datas, município.
- Procure uma **segunda fonte independente**. Se só existir uma, e ela for a parte
  interessada (prefeitura, empresa, ONG do próprio projeto), diga isso ao Douglas antes de
  escrever — ele decide se a pauta segue.
- Anote o que **não** foi possível confirmar. Isso não entra no texto.

### 2. Escrever

Siga o manual de redação em [CLAUDE.md](../../../CLAUDE.md): 350–600 palavras, título até
9 palavras, linha-fina com o dado concreto, lide direto, citação só se textual na fonte,
fecho com o que vem a seguir.

Se faltar informação para um texto honesto de 350 palavras, escreva menos e avise — melhor
uma nota curta e certa do que meia página de enchimento.

### 3. Buscar foto

```bash
npm run foto "termo de busca"                      # lista com as licenças
npm run foto "termo" -- --baixar=<slug> --indice=N # baixa a escolhida
```

O script recusa sozinho NC e ND. Escolha uma foto que **retrate o assunto** — foto genérica
bonita da cidade não serve para ilustrar um fato específico. Sem foto adequada, omita o
campo `foto`: o placeholder da marca entra no lugar.

Ao preencher, **reescreva** `alt` e `legenda` com base no conteúdo real da matéria (o script
só sugere a partir da descrição do Commons). O `alt` descreve a imagem para quem não a vê;
a legenda diz o que a cena tem a ver com a matéria.

### 4. Criar o arquivo

`src/content/materias/<slug>.md` — slug curto, sem acento, descritivo
(`mutirao-restinga-vila-velha`). Frontmatter completo, `status: rascunho`, `edicao` = número
da edição aberta, `data` = data do fato ou do fechamento, entre aspas.

### 5. Conferir

```bash
npm run validar <numero-da-edicao>
```

Depois abra a prévia da matéria no navegador e mostre ao Douglas: título, linha-fina, corpo,
foto com crédito, e as fontes ao pé.

## Pode fazer direto

Pesquisar, ler fontes, escrever o rascunho, baixar foto com licença livre, criar o arquivo
como `rascunho`.

## Exige o OK do Douglas

Mudar `status` para `aprovada` — isso é do `/revisar`. Publicar qualquer coisa.

## Nunca

- Escrever fato, nome, número ou citação que não esteja numa das fontes.
- Preencher `fontes: []` numa matéria real.
- Usar foto sem licença livre, ou sem crédito e licença.
- Inventar "moradores relatam" ou "segundo especialistas" sem fonte nomeada.
- Publicar dado sensível de pessoa privada (ver LGPD no manual).
