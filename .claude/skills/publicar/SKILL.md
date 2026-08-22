---
name: publicar
description: Publica a edição fechada no GitHub Pages — valida, faz commit, sobe e confere o site no ar. Use quando o Douglas disser "publicar", "põe no ar", "manda pro ar" ou "sobe a edição".
---

# Publicar a edição

Levar a edição fechada ao ar. **É a única skill que envia coisa para a internet** — por isso
o pedido de confirmação é obrigatório e literal.

## 1. Pré-checagem (antes de falar em publicar)

```bash
npm run validar <numero> -- --publicar
git status --short
```

- Validador vermelho → **pare** e relate. Não publique "quase pronto".
- Edição precisa estar `fechada`.
- Se houver mudança não relacionada no `git status`, mostre ao Douglas antes de seguir.

## 2. Marcar como publicada e construir

Mude `status: publicada` em `src/content/edicoes/NNN.yaml` e rode:

```bash
npm run build
npm run links                   # nenhum link pode estar quebrado
```

O build de produção é o que corta rascunhos e conteúdo de exemplo. Se falhar, reverta o
status para `fechada` e relate.

Confira no `dist/` que nenhum rascunho vazou:

```bash
grep -rl "Rascunho\|MODO REDAÇÃO" dist/ | head    # deve não retornar nada
```

## 3. Pedir autorização — com estas palavras

Mostre o resumo do que vai ao ar:

- Edição, data e quantidade de matérias
- Manchete
- Lista de títulos com caderno
- URL que ficará pública

E pergunte, textualmente:

> **Publicar a edição NNN? (sim / não)**

Só siga com um "sim" claro. "Acho que sim", silêncio ou mudança de assunto **não** são
autorização.

## 4. Publicar

Duas etapas: o **código-fonte** vai para a branch `main`, o **site construído** vai para a
branch `gh-pages`, de onde o GitHub Pages serve.

```bash
git add -A
git commit -m "Edição NNN (AAAA-MM-DD): <manchete>"
git push
node scripts/publicar-site.mjs "Edição NNN (AAAA-MM-DD)"
```

O `publicar-site.mjs` recusa publicar se o `dist/` estiver ausente, sem `index.html` ou sem
`.nojekyll` — não tente contornar essas recusas, elas evitam site quebrado no ar.

## 5. Conferir no ar

O GitHub leva de 30 segundos a 2 minutos. Acompanhe com:

```bash
gh api repos/jdougdanzi/enseadas/pages --jq .status   # "built" quando terminar
```

Depois:

1. `https://jdougdanzi.github.io/enseadas/` mostra a nova edição?
2. Uma matéria abre com foto e fontes?
3. `https://jdougdanzi.github.io/enseadas/feed.xml` traz as novas matérias?
4. Nenhuma URL quebrada por causa do base path?

Relate o resultado com a URL clicável. Deu errado? Corrija na origem, rode `npm run build` e
publique de novo — o `gh-pages` é sempre substituído pelo `dist/` atual. Se o problema for de
conteúdo, `git revert` no `main` e republique.

## 6. Depois

Lembre o Douglas de:
- Compartilhar o link (o botão de WhatsApp da capa já monta a mensagem).
- Na semana seguinte, olhar o Google Analytics: as matérias mais lidas ajudam a escolher a
  próxima pauta.
- Rodar `/nova-edicao` para abrir a semana seguinte.

## Pode fazer direto

Validar, construir, conferir o `dist/`, montar o resumo.

## Exige o OK do Douglas

`git push` — sempre, sem exceção. Também `git revert` e qualquer alteração no repositório
remoto.

## Nunca

Publicar sem o "sim"; publicar com validador vermelho; publicar edição não fechada; usar
`git push --force`.
