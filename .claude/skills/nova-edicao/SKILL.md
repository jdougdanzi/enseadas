---
name: nova-edicao
description: Abre a próxima edição semanal da revista EnseadaS, com a data da próxima sexta-feira. Use quando o Douglas disser "nova edição", "abre a próxima", "começar a edição da semana" ou depois de publicar uma edição.
---

# Abrir a próxima edição

Criar o arquivo da edição da semana para as matérias terem onde entrar.

## Passos

1. Panorama:
   ```bash
   npm run proxima-sexta -- --status
   ```

2. Confira que a edição anterior está `publicada`. Se ainda estiver `aberta` ou `fechada`,
   avise o Douglas: normalmente é sinal de que a semana anterior não foi ao ar. Duas edições
   abertas ao mesmo tempo bagunçam a home (a prévia mostra a mais recente em preparo).

3. Calcule o número (última + 1) e a data:
   ```bash
   npm run proxima-sexta            # hoje, se hoje for sexta
   npm run proxima-sexta -- --seguinte
   ```
   Se hoje for a sexta que acabou de ser publicada, use `--seguinte`.

4. Confirme com o Douglas: *"Abrir a edição NNN, fechamento em DD/MM?"*

5. Com o OK, crie `src/content/edicoes/NNN.yaml`:
   ```yaml
   numero: N
   dataFechamento: 'AAAA-MM-DD'
   status: aberta
   ```
   Sem `capa` nem `editorial` — isso é do `/fechar-edicao`. Enquanto a capa não existir, a
   prévia monta uma automática pela ordem das matérias, só para a redação ver o resultado.

6. Sugira seguir para `/pauta`.

## Pode fazer direto

Consultar o status e calcular número e data.

## Exige o OK do Douglas

Criar o arquivo da edição.

## Nunca

Abrir uma edição enquanto outra está aberta sem avisar; inventar data que não seja sexta-feira.
