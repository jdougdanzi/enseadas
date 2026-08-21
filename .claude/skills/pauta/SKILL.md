---
name: pauta
description: Pesquisa boas notícias reais do Espírito Santo dos últimos dias e propõe a pauta da semana para o Douglas escolher. Use quando ele disser "pauta", "o que temos essa semana", "vamos começar a edição", "procura pauta" ou pedir sugestões de matéria para a revista EnseadaS.
---

# Pauta da semana

Levantar de 8 a 12 boas notícias **reais** do Espírito Santo e apresentá-las ao Douglas para
ele escolher quais viram matéria. Uma por caderno é o alvo; duas no mesmo caderno, tudo bem.

## Antes de buscar

1. `npm run proxima-sexta -- --status` para saber qual é a edição aberta.
   Se não houver edição aberta, avise e sugira `/nova-edicao` antes de continuar.
2. Leia o manual de redação em [CLAUDE.md](../../../CLAUDE.md) — tom, cadernos e o que não entra.
3. Veja as matérias já feitas nas 2 últimas edições (`src/content/materias/`) para não repetir
   pauta, cidade ou personagem.

## Como buscar

Uma busca por caderno, no mínimo, cobrindo os **últimos 7 a 10 dias**. Varie a geografia:
a Grande Vitória domina o noticiário, mas a revista é dos 78 municípios — force buscas no
interior, no norte e no sul do estado.

Termos que funcionam (combine com o nome de municípios e com "agosto de 2026"):

- `cidades`: "projeto comunitário", "mutirão", "reforma entregue", "praça revitalizada" + município
- `cultura`: "congo capixaba", "festival", "patrimônio", "banda de congo", "museu"
- `sabores`: "moqueca capixaba", "panela de barro Goiabeiras", "café conilon", "socol", "feira"
- `mar-e-montanha`: "trilha", "tartaruga Regência", "Pedra Azul", "turismo rural", "unidade de conservação"
- `gente-boa`: "professor voluntário", "projeto social", "premiado capixaba", "ONG"
- `agenda`: "programação fim de semana Vitória", "festival", "feira" + data

Fontes preferenciais: g1 ES, A Gazeta, Folha Vitória, Século Diário, ES Brasil, prefeituras,
governo do ES, universidades (Ufes, Ifes), Sebrae/ES, institutos e associações identificáveis.

Use `WebSearch` para achar e `WebFetch` para confirmar que a notícia existe e é do período.

## Filtro editorial

Descarte antes de propor:
- Sem fonte verificável, ou só em rede social sem veículo por trás.
- Mais velha que ~15 dias (a revista é semanal, não é arquivo).
- Notícia negativa com verniz positivo ("apesar da tragédia…").
- Release puro de assessoria sem fato novo — a menos que dê para apurar com segunda fonte.
- Pauta que só existe fora do Espírito Santo.

## Como apresentar

Tabela em markdown, numerada, ordenada por caderno:

| # | Caderno | Título provisório | Cidade | Do que se trata | Fonte |
|---|---|---|---|---|---|
| 1 | CIDADES | … | Vila Velha | uma linha | [G1 ES](url) |

Depois da tabela, escreva em duas linhas qual seria a **manchete** da edição e por quê.

Termine perguntando quais números ele quer transformar em matéria. **Não escreva nenhuma
matéria agora** — isso é o `/materia`.

## Pode fazer direto

Pesquisar na web, ler as fontes, montar e apresentar a tabela.

## Exige o OK do Douglas

A escolha das pautas. Nenhum arquivo é criado nesta skill.

## Nunca

Propor pauta sem URL real; inventar título de notícia que não existe; apresentar como
notícia da semana algo de meses atrás.
