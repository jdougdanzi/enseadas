---
name: fechar-edicao
description: Fecha a edição da semana — define manchete e ordem da capa, escreve o editorial e valida tudo antes da publicação. Use quando o Douglas disser "fechar a edição", "vamos fechar", "monta a capa" ou "escreve o editorial".
---

# Fechar a edição

Transformar um punhado de matérias aprovadas numa edição: capa montada, editorial escrito,
validação verde. Depois disso só falta `/publicar`.

## 1. Conferir o mínimo

```bash
npm run validar <numero>
```

Para fechar são necessários: **uma manchete + pelo menos duas chamadas laterais aprovadas +
o editorial**. Faltando, diga exatamente o que falta e pare.

## 2. Montar a capa

Proponha ao Douglas, com uma linha de justificativa cada:

- **Manchete**: a matéria de maior alcance e melhor apuração da semana. Não é a mais bonita:
  é a que mais importa para o capixaba.
- **Laterais** (2 a 4): variedade de caderno e de geografia em relação à manchete.
- **Linha inferior** (até 3): as demais, com foto.

Ele decide. Escreva a decisão em `src/content/edicoes/NNN.yaml`:

```yaml
capa:
  manchete: <slug>
  laterais: [<slug>, <slug>]
  linhaInferior: [<slug>, <slug>, <slug>]
editorial: editorial-NNN
```

As referências são o nome do arquivo sem `.md`. Cada matéria aparece **uma vez só** na capa;
as que sobram continuam visíveis na capa do caderno e no "Leia também".

## 3. Escrever o editorial

Arquivo `src/content/materias/editorial-NNN.md` com `tipo: editorial`, sem `caderno` nem
`cidade`, `status: rascunho`.

O editorial da semana comenta **o que a própria edição mostra** — o fio que liga as matérias.
250 a 400 palavras, primeira pessoa do plural, assinado pelo "Conselho Editorial" (o
componente já assina). Opinião é permitida; fato inventado, não. Se citar algo da edição,
tem que estar nas matérias.

Mostre ao Douglas e ajuste até ele aprovar. Aprovado → `status: aprovada`.

## 4. Validar e fechar

```bash
npm run validar <numero>
npm run build
```

Os dois verdes → mude `status: fechada` no YAML da edição e confirme com o Douglas.
Mostre a capa montada na prévia (`http://localhost:4321/enseadas/`) antes de declarar fechada.

## Pode fazer direto

Rodar validador e build, propor manchete e ordem, redigir o editorial, corrigir erros técnicos.

## Exige o OK do Douglas

Manchete e ordem da capa; o texto do editorial; aprovar o editorial; mudar a edição para
`fechada`.

## Nunca

Fechar com rascunho na capa; fechar sem editorial; escolher a manchete sozinho; ignorar erro
do validador.
