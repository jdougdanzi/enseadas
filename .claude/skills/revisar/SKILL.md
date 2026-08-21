---
name: revisar
description: Abre a prévia da edição no navegador e conduz a revisão das matérias uma a uma, aplicando ajustes e marcando como aprovada só com o OK explícito do Douglas. Use quando ele disser "vamos revisar", "revisão da edição", "me mostra as matérias" ou "quero aprovar".
---

# Revisar a edição

Conduzir a leitura dos rascunhos com o Douglas e registrar as aprovações. É o único lugar
onde `status` vira `aprovada`.

## Preparar

1. Suba a prévia (`preview_start` com a configuração `enseadas`, ou `npm run dev`).
   O site fica em `http://localhost:4321/enseadas/`.
2. `npm run validar <numero>` e resolva os erros técnicos **antes** de chamar o Douglas —
   ele revisa texto, não formulário mal preenchido.
3. Liste o que está na mesa: título, caderno, cidade e status de cada texto da edição.

## Revisar uma a uma

Para cada matéria, nesta ordem:

1. Abra `http://localhost:4321/enseadas/materia/<slug>/` no navegador e mostre.
2. Faça você mesmo a conferência antes de perguntar qualquer coisa:
   - Todo fato do texto está em alguma das `fontes`?
   - Nome de pessoa, instituição e município escritos certo?
   - Título ≤ 9 palavras, linha-fina não repete o título?
   - A citação é textual da fonte?
   - `alt` descreve a foto; legenda liga a foto à matéria; crédito e licença presentes?
   - Kicker `CADERNO · CIDADE` correto?
   Aponte o que encontrar. Não empurre para o Douglas o que você pode checar.
3. Pergunte se aprova, ajusta ou derruba.
4. **Aprovou** → mude `status: aprovada` naquele arquivo. **Só nesse.**
   **Pediu ajuste** → aplique, mostre de novo, e pergunte outra vez.
   **Derrubou** → mova para `redacao/pautas/` ou apague, conforme ele preferir.

Ao final, mostre o placar: quantas aprovadas, quantas pendentes, e o que falta para fechar
(manchete, laterais e editorial).

## Pode fazer direto

Subir a prévia, apontar problemas, aplicar ajustes de texto pedidos, corrigir erros técnicos
(campo faltando, licença mal preenchida, slug torto).

## Exige o OK do Douglas

**Cada** mudança para `aprovada`, individualmente. Apagar arquivo.

## Nunca

Aprovar em lote; aprovar porque "está bom o suficiente"; aprovar conteúdo `exemplo: true`;
mexer no texto além do que foi pedido, sem avisar.
