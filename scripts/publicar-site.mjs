#!/usr/bin/env node
/**
 * Envia o site já construído (dist/) para a branch `gh-pages`, de onde o
 * GitHub Pages serve https://jdougdanzi.github.io/enseadas/.
 *
 *   node scripts/publicar-site.mjs "Edição 001 (2026-08-21)"
 *
 * Como funciona: mantém uma cópia de trabalho da branch gh-pages em
 * .gh-pages/ (via git worktree), troca o conteúdo pelo dist/ recém-construído
 * e faz um commit normal. Sem force-push e sem apagar histórico.
 *
 * Não roda o build: quem chama já validou e construiu (ver a skill /publicar).
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const COPIA = join(RAIZ, '.gh-pages');
const BRANCH = 'gh-pages';

function git(args, opcoes = {}) {
  return execFileSync('git', args, {
    cwd: opcoes.cwd ?? RAIZ,
    encoding: 'utf8',
    stdio: opcoes.silencioso ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'inherit'],
  }).trim();
}

function existeBranchRemota() {
  try {
    return git(['ls-remote', '--heads', 'origin', BRANCH], { silencioso: true }).length > 0;
  } catch {
    return false;
  }
}

async function prepararCopia() {
  // Um worktree órfão na primeira vez; nas seguintes, só atualiza.
  if (existsSync(COPIA)) {
    git(['worktree', 'remove', '--force', COPIA], { silencioso: true });
  }

  if (existeBranchRemota()) {
    git(['fetch', 'origin', `${BRANCH}:${BRANCH}`, '--force'], { silencioso: true });
    git(['worktree', 'add', COPIA, BRANCH]);
  } else {
    git(['worktree', 'add', '--orphan', '-b', BRANCH, COPIA]);
  }
}

async function trocarConteudo() {
  // Apaga tudo menos o .git, e copia o dist recém-construído por cima.
  for (const item of await readdir(COPIA)) {
    if (item === '.git') continue;
    await rm(join(COPIA, item), { recursive: true, force: true });
  }
  await cp(DIST, COPIA, { recursive: true });
}

async function main() {
  const mensagem = process.argv.slice(2).join(' ').trim() || 'Atualização do site';

  if (!existsSync(DIST)) {
    console.error('dist/ não existe. Rode `npm run build` antes de publicar.');
    process.exit(1);
  }
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('dist/ existe mas não tem index.html. O build falhou?');
    process.exit(1);
  }
  if (!existsSync(join(DIST, '.nojekyll'))) {
    console.error(
      'dist/.nojekyll não existe. Sem esse arquivo o GitHub ignora a pasta _astro\n' +
        'e o site vai ao ar sem estilo. Confira se public/.nojekyll está no repositório.',
    );
    process.exit(1);
  }

  await mkdir(dirname(COPIA), { recursive: true });
  await prepararCopia();
  await trocarConteudo();

  const pendente = git(['status', '--porcelain'], { cwd: COPIA, silencioso: true });
  if (!pendente) {
    console.log('Nada mudou no site — nenhum commit necessário.');
    git(['worktree', 'remove', '--force', COPIA], { silencioso: true });
    return;
  }

  git(['add', '-A'], { cwd: COPIA });
  git(['commit', '-m', mensagem], { cwd: COPIA });
  git(['push', 'origin', BRANCH], { cwd: COPIA });
  git(['worktree', 'remove', '--force', COPIA], { silencioso: true });

  console.log('\nSite enviado para a branch gh-pages.');
  console.log('O GitHub leva de 30 segundos a 2 minutos para publicar.');
  console.log('https://jdougdanzi.github.io/enseadas/\n');
}

main().catch((erro) => {
  console.error(`Falha ao publicar: ${erro.message}`);
  process.exit(1);
});
