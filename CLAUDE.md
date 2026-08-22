# EnseadaS — manual da redação

Revista eletrônica **semanal** de boas notícias do Espírito Santo. Fecha toda **sexta-feira**,
em edições numeradas (Nº 001, 002…). Editor responsável: **Douglas Danzi**.

Site: <https://jdougdanzi.github.io/enseadas/> · Repositório: `jdougdanzi/enseadas`

---

## O ciclo da semana

```
/nova-edicao   abre a edição da semana (próxima sexta)
/pauta         pesquisa boas notícias reais do ES e propõe a pauta
/materia       apura e escreve um rascunho (uma chamada por matéria)
/revisar       prévia no navegador; Douglas aprova uma a uma
/fechar-edicao define manchete, ordem da capa e escreve o editorial
/publicar      valida, faz commit, sobe para o GitHub Pages
```

Cada passo é uma skill em `.claude/skills/`. Rodar fora de ordem é permitido, mas
`/publicar` só funciona com a edição fechada e validada.

## Comandos

```bash
npm run dev                          # prévia em http://localhost:4321/enseadas/
npm run build                        # build de produção (falha se houver conteúdo inválido)
npm run validar 1                    # confere a edição 001
npm run validar 1 -- --publicar      # confere se pode ir ao ar
npm run foto "termo de busca"        # procura foto livre no Wikimedia Commons
npm run proxima-sexta -- --status    # panorama das edições
npm run publicar-site -- "Edição 001" # envia o dist/ para o ar (só dentro do /publicar)
npm run imagens                      # regera og-padrao.png e apple-touch-icon.png
npm run links                        # confere links quebrados no dist/ (roda no /publicar)
npm run links -- --externos          # confere também as URLs das fontes
```

## Busca interna

A busca (`/busca/`) usa o Pagefind: o índice nasce no `npm run build` (etapa `pagefind --site
dist`) a partir das matérias e editoriais — só o que tem `data-pagefind-body`. Por isso **em
`npm run dev` a busca não funciona** (a página avisa); para testá-la localmente:
`npm run build && npm run preview`. Nada disso precisa de servidor: o índice são arquivos
estáticos em `dist/pagefind/`, servidos pelo GitHub Pages.

## Como o site vai ao ar

Duas branches, dois papéis:

- **`main`** guarda o código e o conteúdo (as matérias em markdown).
- **`gh-pages`** guarda **só o site construído**. É de onde o GitHub Pages serve.

O `/publicar` faz `git push` do fonte para `main` e roda `scripts/publicar-site.mjs`, que
copia o `dist/` recém-construído para `gh-pages`. Nunca edite `gh-pages` à mão.

`public/.nojekyll` é obrigatório: sem ele o GitHub ignora a pasta `_astro/` e o site vai ao ar
sem estilo nenhum.

> Se um dia o token do `gh` ganhar o escopo `workflow` (`gh auth refresh -s workflow`), dá
> para migrar a publicação para o GitHub Actions. Hoje ela é local e direta, o que tem a
> vantagem de publicar exatamente o `dist/` que acabou de ser validado.

---

## Regras duras

Estas não se negociam. Se uma delas conflitar com um pedido, pare e diga ao Douglas.

1. **Nada é inventado.** Nenhum fato, nome, número, declaração ou evento entra numa
   matéria sem constar de uma fonte real, com URL, registrada em `fontes[]`. Não existe
   "personagem ilustrativo" nem citação recriada. Se a informação não foi encontrada, ela
   não entra — e a matéria pode simplesmente não existir.
2. **Toda matéria cita as fontes** no frontmatter. O build e o validador barram quem não cita.
3. **Foto só com licença livre** (domínio público, CC0, CC BY, CC BY-SA). Nunca NC nem ND.
   E a atribuição não é opcional:
   - **Descreva a foto** no `alt` — o que se vê na imagem, para quem não a enxerga.
     Não repita o título da matéria; descreva a cena.
   - **Legenda** diz o que aquela cena tem a ver com a matéria.
   - **Crédito + licença + link da origem** aparecem sob a foto em **todo lugar onde ela é
     exibida** — abertura da matéria, capa, cartões, capa de caderno. CC BY e CC BY-SA exigem
     atribuição junto da obra; crédito só na página da matéria não cumpre a licença. O
     componente `FotoMateria` já faz isso: nunca há opção de exibir foto sem crédito.
   - Foto que **não retrata o fato** não entra. Paisagem bonita da cidade não ilustra um
     evento específico, e imagem de outro estado jamais ilustra matéria capixaba. Sem foto
     adequada, entra o placeholder da marca — que é honesto.
4. **`git push` só com o "sim" explícito do Douglas**, dentro do `/publicar`.
5. **Aprovação é uma a uma.** Só mude `status: aprovada` quando Douglas aprovar aquela matéria.
   Nunca aprove em lote por conta própria.
6. **Conteúdo `exemplo: true` nunca é aprovado nem publicado.** É material de demonstração
   (edição 000, arquivos `ex-*.md`) vindo dos mockups da marca — texto fictício.
7. **A marca não se redesenha.** Cores, fontes, logo e grade estão no Manual da Marca
   (`Revista Enseadas logo concepts/`, fora do Git). Mudanças de identidade só com o Douglas.

---

## Manual de redação

**Tom.** Jornalístico. Positivo sem ser ingênuo: a boa notícia é apurada com o mesmo rigor de
qualquer outra. Não faça publieditorial de prefeitura nem release de assessoria — se a única
fonte é o órgão que se autoelogia, ou a pauta cai, ou se busca contraponto real.

**Estrutura da matéria** (350–600 palavras):
- **Título** ≤ 9 palavras, sem clickbait, sem ponto final. Diz o que aconteceu.
- **Linha-fina** complementa o título com o dado concreto — nunca o repete.
- **Kicker** é sempre `CADERNO · CIDADE` (montado automaticamente pelos campos).
- **Lide direto**: o que aconteceu, onde, quando, com quem. Sem rodeio poético de abertura.
- **Citação** só quando textual na fonte. Em bloco de citação markdown, com a atribuição no
  último parágrafo do bloco:
  ```markdown
  > "A praia é o quintal de todo mundo."
  >
  > Carla Nunes · moradora e organizadora
  ```
- **Fecho** com o que vem a seguir (próxima etapa, como participar, quando acontece).
- Subtítulos (`##`) só se o texto passar de 450 palavras.

**Português.** pt-BR, norma culta, sem jargão de assessoria ("visa a", "no sentido de",
"enquanto enquanto lugar de"). Números por extenso até dez. Nomes de lugares capixabas
conferidos. Evite adjetivos avaliativos ("incrível", "maravilhoso") — o fato convence sozinho.

**Pessoas (LGPD e cuidado editorial).** Só cite pessoas que já aparecem publicamente nas
fontes, e apenas com informação não sensível. Nada de endereço, dado de saúde, situação
financeira, orientação sexual ou religião de pessoa privada. Criança só com o contexto já
público e sem identificação individual desnecessária. Na dúvida, pergunte ao Douglas.

**Cadernos** — escolha o que responde "de que trata a história", não "onde aconteceu":

| Nº | Caderno | O que entra |
|---|---|---|
| 1 | `cidades` | iniciativas urbanas, obras do bem, vida de bairro nos 78 municípios |
| 2 | `cultura` | congo, festas, música, arte, patrimônio |
| 3 | `sabores` | moqueca, torta capixaba, panela de barro, cafés, quem cozinha |
| 4 | `mar-e-montanha` | turismo, natureza, trilhas, praias, montanhas |
| 5 | `gente-boa` | perfis de pessoas que fazem diferença na comunidade |
| 6 | `agenda` | eventos, feiras, shows, programação com data marcada |

---

## Como o conteúdo é organizado

**Matéria** = um arquivo em `src/content/materias/<slug>.md`. O nome do arquivo vira a URL
(`/materia/<slug>/`). Use slug curto e descritivo, sem acento: `mutirao-restinga-vila-velha`.

```yaml
---
titulo: Mutirão replanta a restinga e devolve a praia à cidade
linhaFina: Trezentos voluntários, quatro mil mudas e um sábado que virou notícia boa.
tipo: materia            # ou "editorial"
caderno: cidades         # obrigatório em matéria
cidade: Vila Velha       # obrigatório em matéria
tags: [Meio ambiente, Voluntariado]
data: '2026-08-21'       # sempre string YYYY-MM-DD, nunca sem aspas
edicao: 1
status: rascunho         # vira "aprovada" só com o OK do Douglas
foto:                    # opcional — mas se houver, todos os campos são obrigatórios
  src: ../../assets/fotos/mutirao-restinga.jpg
  alt: 'Voluntários plantam mudas na areia da praia'
  legenda: 'Voluntários plantam mudas de restinga na Praia da Costa.'
  credito: 'Fulano de Tal/Wikimedia Commons'
  licenca: 'CC BY-SA 4.0'
  fonteUrl: 'https://commons.wikimedia.org/wiki/File:...'
fontes:
  - titulo: Mutirão planta 4 mil mudas em Vila Velha
    url: https://g1.globo.com/es/espirito-santo/...
    veiculo: G1 Espírito Santo
---
```

**Edição** = `src/content/edicoes/NNN.yaml`. A matéria diz a que edição pertence (`edicao:`);
a edição diz o papel de cada uma na capa:

```yaml
numero: 1
dataFechamento: '2026-08-21'
status: aberta                    # aberta → fechada → publicada
capa:
  manchete: mutirao-restinga-vila-velha
  laterais: [panela-de-barro-selo, professor-surfe-barra]
  linhaInferior: [orquestra-casaca, trilha-anchieta, biblioteca-cariacica]
editorial: editorial-001
```

**O que aparece no site:** em produção, só edição `publicada` + matéria `aprovada`.
No `npm run dev`, tudo aparece com selo de rascunho. Essa regra vive num lugar só:
[src/lib/conteudo.ts](src/lib/conteudo.ts) — não filtre status em página nenhuma.

---

## Estrutura do projeto

| Caminho | O que é |
|---|---|
| [src/config.ts](src/config.ts) | nome, contatos, ID do Google Analytics, token do Search Console |
| [src/content.config.ts](src/content.config.ts) | schema das matérias e edições (as travas de qualidade) |
| [src/data/cadernos.ts](src/data/cadernos.ts) | os seis cadernos fixos |
| [src/lib/conteudo.ts](src/lib/conteudo.ts) | o que é visível, montagem da capa, relacionadas |
| [src/lib/datas.ts](src/lib/datas.ts) | datas civis em pt-BR sem escorregão de fuso |
| [src/lib/url.ts](src/lib/url.ts) | links com o base path `/enseadas` — **use sempre `rotas`/`href`/`abs`** |
| [src/lib/seo.ts](src/lib/seo.ts) | JSON-LD (NewsArticle, Organization, breadcrumb) |
| [src/lib/assuntos.ts](src/lib/assuntos.ts) | tags viram rotas `/assunto/<slug>/` — escreva a tag em português com acento, o slug sai sozinho |
| [src/lib/retrato.ts](src/lib/retrato.ts) | retrato do editor no editorial (opcional; ver `src/assets/retratos/LEIA-ME.md`) |
| [src/styles/tokens.css](src/styles/tokens.css) | cores, fontes e medidas da marca |
| `src/components/`, `src/pages/` | componentes e rotas |
| `scripts/` | busca de foto, validador, calendário |

**Trocar a foto de uma matéria por uma sua:**
salve o arquivo em `src/assets/fotos/<slug-da-materia>.jpg` (substituindo o que estiver lá) e
ajuste o bloco `foto:` no markdown — `credito` com o seu nome, `licenca: 'Arquivo pessoal'` ou
`'© Douglas Danzi'`, e `fonteUrl` apontando para onde a foto está publicada (ou remova o campo
`fonteUrl` do bloco e do schema, se a foto for inédita). Reescreva `alt` e `legenda`.

**Armadilhas conhecidas:**
- Nunca escreva `href="/materia/x"` à mão: some o `/enseadas` e o link quebra no ar.
  Use `rotas.materia(slug)`.
- Datas são **string** `'2026-08-21'`. Usar `Date` cru faz 21/08 virar 20/08 no fuso de Brasília.
- Foto nova vai em `src/assets/fotos/` (otimizada no build), não em `public/`.

---

## Pós-publicação (uma vez, com o Douglas)

1. **Google Search Console**: cadastrar `https://jdougdanzi.github.io/enseadas/` como
   propriedade de prefixo de URL, escolher verificação por meta tag e colar o conteúdo em
   `SEARCH_CONSOLE_TOKEN` ([src/config.ts](src/config.ts)). Depois enviar
   `https://jdougdanzi.github.io/enseadas/sitemap-index.xml`.
2. **Google Analytics 4**: criar propriedade em analytics.google.com, pegar o ID `G-XXXXXXXXXX`
   e colar em `GA_MEASUREMENT_ID`. O script só é injetado no build de produção; em dev nunca.
   Com o ID vazio, nenhum analytics é carregado e a página de privacidade se ajusta sozinha.
3. Ambos exigem login na conta Google do Douglas — quem faz é ele, não o Claude.

---

## Backend (API da revista)

A revista continua estática e gratuita no GitHub Pages. O backend serve **só o que
precisa de servidor**: contas de leitor, comentários, newsletter. Plano completo e
fases em [docs/backend-plano.md](docs/backend-plano.md).

> **O backend vive em outro repositório, privado:** `jdougdanzi/enseadas-backend`.
> Ele fica clonado em `backend/` aqui dentro (ignorado por este repositório), para
> operar as duas partes de um lugar só. **São dois `git push`**: um para a revista,
> outro, de dentro de `backend/`, para o backend.
>
> Se a pasta não existir num clone novo:
> `git clone https://github.com/jdougdanzi/enseadas-backend.git backend`

**Endereços (provisórios, até o enseadas.com.br):** site em `enseadas.bolgest.com`,
API em `api.enseadas.bolgest.com`. Mesmo domínio registrável — é o que faz a sessão
sobreviver no Safari do iPhone. Nenhum cookie leva `Domain`, então nada da revista
chega às outras aplicações do bolgest.com.

```bash
npm run api          # sobe a API em http://localhost:8000
npm run api:test     # testes (pytest) — funcionam sem .env
npm run api:check    # checagem do Django (acusa tabela de cache ausente)
```

**Primeira vez neste banco:** `manage.py migrate` **e** `manage.py createcachetable`.
A segunda não é opcional: o allauth consulta o cache no limite de tentativas de
todo login e cadastro, e sem a tabela o primeiro leitor recebe 500. O
`npm run api:check` acusa isso antes.

**Antes de tudo, o Postgres precisa estar de pé:**

```bash
LC_ALL=C /opt/homebrew/opt/postgresql@17/bin/pg_ctl -D /opt/homebrew/var/postgresql@17 -l /opt/homebrew/var/log/postgresql@17.log start
```

O `LC_ALL=C` não é opcional: sem ele o PostgreSQL 17 no macOS morre no arranque com
*"postmaster became multithreaded during startup"*. Use sempre o **17** — o 14 também
está instalado e não é o nosso.

| Onde | O quê |
|---|---|
| `backend/config/settings/` | `base` (comum), `dev` (Mac), `prod` (VPS), `test` |
| `backend/contas/` | leitor: login por e-mail, sem nome de usuário |
| `backend/redacao/` | o painel: admin do Django em **`/redacao/`** (o `/admin/` não existe) |
| `backend/templates/account/email/` | e-mails de conta, em português, com a voz da revista |
| `/api/saude` · `/api/csrf` | saúde (deploy) · cookie CSRF (site) |
| `/_allauth/browser/v1/…` | cadastro, login, verificação, nova senha — só JSON |

### Regras duras do backend

8. **Dados de leitor são sagrados.** Nunca liste, exporte ou cole e-mails de leitores em
   conversa, commit ou prévia sem finalidade explícita do Douglas. Exclusão de conta só
   pelos comandos previstos.
9. **`.env` nunca entra no git** (o repositório é público). Migração que apaga coluna ou
   tabela exige backup imediatamente antes e o "sim" do Douglas.
10. **Nunca `docker compose down -v`** no VPS: o `-v` apaga o volume do banco.
