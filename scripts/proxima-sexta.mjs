#!/usr/bin/env node
/**
 * Datas do calendário editorial, sempre em America/Sao_Paulo.
 *
 * Uso:
 *   node scripts/proxima-sexta.mjs           # próxima sexta (hoje, se hoje for sexta)
 *   node scripts/proxima-sexta.mjs --seguinte # a sexta depois dessa
 *   node scripts/proxima-sexta.mjs --status   # panorama das edições existentes
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_EDICOES = join(RAIZ, 'src/content/edicoes');
const FUSO = 'America/Sao_Paulo';

/** Data civil de hoje no fuso de Brasília, no formato YYYY-MM-DD. */
function hoje() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Próxima sexta-feira a partir de uma data civil.
 * Trabalhamos com Date.UTC para o dia da semana não escorregar por causa do fuso.
 */
function proximaSexta(iso, pularUma = false) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const base = new Date(Date.UTC(ano, mes - 1, dia));
  const diasAteSexta = (5 - base.getUTCDay() + 7) % 7;
  base.setUTCDate(base.getUTCDate() + diasAteSexta + (pularUma ? 7 : 0));
  return base.toISOString().slice(0, 10);
}

async function lerEdicoes() {
  let arquivos = [];
  try {
    arquivos = (await readdir(DIR_EDICOES)).filter((f) => f.endsWith('.yaml'));
  } catch {
    return [];
  }

  const edicoes = [];
  for (const arquivo of arquivos) {
    const texto = await readFile(join(DIR_EDICOES, arquivo), 'utf8');
    const numero = Number(/^numero:\s*(\d+)/m.exec(texto)?.[1] ?? basename(arquivo, '.yaml'));
    const status = /^status:\s*['"]?(\w+)['"]?/m.exec(texto)?.[1] ?? '?';
    const data = /^dataFechamento:\s*['"]?([\d-]+)['"]?/m.exec(texto)?.[1] ?? '?';
    edicoes.push({ numero, status, data, arquivo });
  }
  return edicoes.sort((a, b) => a.numero - b.numero);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--status')) {
    const edicoes = await lerEdicoes();
    const reais = edicoes.filter((e) => e.status !== 'exemplo');

    console.log(`\nHoje: ${hoje()} (${FUSO})\n`);
    if (edicoes.length === 0) {
      console.log('Nenhuma edição criada ainda.');
    } else {
      console.log('Edições:');
      for (const e of edicoes) {
        console.log(`  ${String(e.numero).padStart(3, '0')} · ${e.data} · ${e.status}`);
      }
    }

    const aberta = reais.find((e) => e.status === 'aberta' || e.status === 'fechada');
    const ultimoNumero = reais.length > 0 ? Math.max(...reais.map((e) => e.numero)) : 0;

    console.log('');
    if (aberta) {
      console.log(
        `Em preparo: edição ${String(aberta.numero).padStart(3, '0')} (${aberta.status}), fecha em ${aberta.data}.`,
      );
    } else {
      console.log(
        `Próxima edição: ${String(ultimoNumero + 1).padStart(3, '0')}, fechamento em ${proximaSexta(hoje())}.`,
      );
    }
    console.log('');
    return;
  }

  console.log(proximaSexta(hoje(), args.includes('--seguinte')));
}

main().catch((erro) => {
  console.error(`Erro: ${erro.message}`);
  process.exit(1);
});
