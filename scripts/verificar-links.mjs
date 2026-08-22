#!/usr/bin/env node
/**
 * Confere se todo link e recurso interno do `dist/` existe de fato.
 *
 * Nasceu de um bug real: o `href()` deixava `manifest.webmanifest` com barra
 * final e o arquivo virava 404 em todas as páginas — e passou por três revisões
 * porque cada conferência era improvisada na hora. Agora é passo do /publicar.
 *
 * Uso:
 *   node scripts/verificar-links.mjs            # confere o dist/
 *   node scripts/verificar-links.mjs --externos # também testa as URLs externas
 *
 * Sai com código 1 se houver link quebrado — assim a publicação não segue.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');

/** Base do site — lida do astro.config.mjs para não duplicar a configuração. */
async function lerBase() {
  const config = await readFile(join(RAIZ, 'astro.config.mjs'), 'utf8');
  const m = /base:\s*['"]([^'"]+)['"]/.exec(config);
  const base = m ? m[1] : '/';
  return base.endsWith('/') ? base : `${base}/`;
}

async function listarArquivos(dir) {
  const saida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) saida.push(...(await listarArquivos(caminho)));
    else saida.push(caminho);
  }
  return saida;
}

const main = async () => {
  const base = await lerBase();
  const prefixo = base.replace(/\/$/, '');
  const config = await readFile(join(RAIZ, 'astro.config.mjs'), 'utf8');
  const ORIGEM = (/site:\s*['"]([^'"]+)['"]/.exec(config)?.[1] ?? '').replace(/\/$/, '');

  let arquivos;
  try {
    arquivos = await listarArquivos(DIST);
  } catch {
    console.error('dist/ não existe. Rode `npm run build` antes.');
    process.exit(1);
  }

  // Tudo o que o site serve, no formato em que o navegador pede.
  const servidos = new Set();
  for (const abs of arquivos) {
    const url = `${prefixo}/${relative(DIST, abs).split('/').join('/')}`;
    servidos.add(url);
    if (url.endsWith('/index.html')) servidos.add(url.slice(0, -'index.html'.length));
  }

  const paginas = arquivos.filter((a) => a.endsWith('.html'));
  const quebrados = new Map();
  const semPrefixo = new Map();
  const externos = new Set();
  let totalInternos = 0;

  for (const pagina of paginas) {
    const html = await readFile(pagina, 'utf8');
    const onde = relative(DIST, pagina);

    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = m[1];
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // URLs do próprio site (canonical, OG) já foram cobertas pela
        // checagem interna; conferi-las de novo pela rede só traria ruído.
        if (!url.startsWith(ORIGEM)) externos.add(url);
        continue;
      }
      if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('data:')) continue;

      totalInternos += 1;
      if (!url.startsWith(prefixo + '/')) {
        // Link interno sem o /enseadas: quebra assim que vai ao ar.
        if (!semPrefixo.has(url)) semPrefixo.set(url, []);
        semPrefixo.get(url).push(onde);
        continue;
      }
      if (!servidos.has(url)) {
        if (!quebrados.has(url)) quebrados.set(url, []);
        quebrados.get(url).push(onde);
      }
    }
  }

  console.log(`Páginas: ${paginas.length} · links internos: ${totalInternos} · externos: ${externos.size}`);

  let falhou = false;

  if (semPrefixo.size > 0) {
    falhou = true;
    console.log(`\n✗ ${semPrefixo.size} link(s) sem o prefixo ${prefixo}:`);
    for (const [url, onde] of semPrefixo) {
      console.log(`   ${url}  — em ${onde.length} página(s), ex.: ${onde[0]}`);
    }
  }

  if (quebrados.size > 0) {
    falhou = true;
    console.log(`\n✗ ${quebrados.size} destino(s) inexistente(s):`);
    for (const [url, onde] of quebrados) {
      console.log(`   ${url}  — em ${onde.length} página(s), ex.: ${onde[0]}`);
    }
  }

  if (process.argv.includes('--externos')) {
    console.log(`\nConferindo ${externos.size} links externos…`);
    const cabecalhos = {
      // Sem um agente de navegador, vários veículos capixabas devolvem 403.
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    };
    for (const url of [...externos].sort()) {
      // Duas tentativas: uma falha de rede passageira não pode barrar a
      // publicação de uma edição inteira.
      let ultimoErro = null;
      let ok = false;
      for (const tentativa of [1, 2]) {
        try {
          const r = await fetch(url, {
            headers: cabecalhos,
            redirect: 'follow',
            signal: AbortSignal.timeout(20000),
          });
          if (r.ok) {
            ok = true;
            break;
          }
          ultimoErro = `HTTP ${r.status}`;
        } catch (erro) {
          ultimoErro = erro.message;
        }
        if (tentativa === 1) await new Promise((r) => setTimeout(r, 1500));
      }
      if (!ok) {
        falhou = true;
        console.log(`   ✗ ${ultimoErro}  ${url}`);
      }
    }
  }

  if (falhou) {
    console.log('\nCorrija antes de publicar.');
    process.exit(1);
  }

  console.log('\n✓ Nenhum link quebrado.');
};

main();
