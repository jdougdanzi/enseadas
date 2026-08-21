#!/usr/bin/env node
/**
 * Busca uma foto com licença livre no Wikimedia Commons e a prepara para a matéria.
 *
 * Uso:
 *   node scripts/wikimedia.mjs "paneleiras de Goiabeiras"            # só lista
 *   node scripts/wikimedia.mjs "Praia da Costa" --baixar=meu-slug    # baixa e imprime o frontmatter
 *   node scripts/wikimedia.mjs "Pedra Azul" --baixar=slug --indice=3 # escolhe outro resultado
 *
 * REGRA: só aceitamos licenças que permitem uso comercial e obras derivadas
 * (domínio público, CC0, CC BY, CC BY-SA). Qualquer NC ou ND é rejeitado.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'src/assets/fotos');
const API = 'https://commons.wikimedia.org/w/api.php';
const AGENTE = 'EnseadaS/1.0 (revista semanal do Espirito Santo; contato: redacao@enseadas.com.br)';
const LARGURA_MAX = 1600;

/** Licenças aceitas. Qualquer coisa fora desta lista é recusada. */
const PADROES_ACEITOS = [
  /^cc0/i,
  /^cc[- ]by(?![- ]?(nc|nd))/i,
  /^public domain/i,
  /^pd[- ]/i,
  /^pd$/i,
];
const PADROES_PROIBIDOS = [/\bnc\b/i, /\bnd\b/i, /noncommercial/i, /no ?deriv/i, /fair use/i];

function licencaLivre(licenca) {
  if (!licenca) return false;
  const texto = String(licenca).trim();
  if (PADROES_PROIBIDOS.some((r) => r.test(texto))) return false;
  return PADROES_ACEITOS.some((r) => r.test(texto));
}

/** extmetadata devolve HTML; queremos texto limpo para a legenda. */
function limparHtml(valor) {
  if (!valor) return '';
  return String(valor)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buscar(termo, limite = 12) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${termo} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(limite),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: String(LARGURA_MAX),
  }).toString();

  const resposta = await fetch(url, { headers: { 'User-Agent': AGENTE } });
  if (!resposta.ok) {
    throw new Error(`Wikimedia respondeu ${resposta.status} ${resposta.statusText}`);
  }
  const dados = await resposta.json();
  const paginas = dados?.query?.pages ?? {};

  return Object.values(paginas)
    .map((pagina) => {
      const info = pagina.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata ?? {};
      const licenca = limparHtml(meta.LicenseShortName?.value) || limparHtml(meta.License?.value);
      return {
        arquivo: pagina.title.replace(/^File:/, ''),
        paginaUrl: info.descriptionurl,
        thumb: info.thumburl ?? info.url,
        largura: info.thumbwidth ?? info.width,
        altura: info.thumbheight ?? info.height,
        mime: info.mime,
        licenca,
        autor: limparHtml(meta.Artist?.value) || 'Autor não identificado',
        descricao: limparHtml(meta.ImageDescription?.value),
        livre: licencaLivre(licenca),
      };
    })
    .filter(Boolean)
    .filter((f) => /^image\/(jpeg|png|webp)$/.test(f.mime ?? ''))
    .sort((a, b) => Number(b.livre) - Number(a.livre));
}

async function baixar(foto, slug) {
  const resposta = await fetch(foto.thumb, { headers: { 'User-Agent': AGENTE } });
  if (!resposta.ok) throw new Error(`Falha ao baixar: ${resposta.status}`);

  const extensao = foto.mime === 'image/png' ? 'png' : foto.mime === 'image/webp' ? 'webp' : 'jpg';
  const nome = `${slug}.${extensao}`;
  const caminho = join(DESTINO, nome);

  await mkdir(DESTINO, { recursive: true });
  await writeFile(caminho, Buffer.from(await resposta.arrayBuffer()));

  return { nome, caminho, extensao };
}

function escaparYaml(texto) {
  return String(texto).replace(/'/g, "''");
}

function imprimirLista(fotos, termo) {
  console.log(`\nResultados para "${termo}" no Wikimedia Commons:\n`);
  fotos.forEach((foto, i) => {
    const marca = foto.livre ? '✓ LIVRE  ' : '✗ RECUSADA';
    console.log(`${String(i + 1).padStart(2)}. ${marca} ${foto.licenca || 'licença desconhecida'}`);
    console.log(`    ${foto.arquivo}`);
    console.log(`    Autor: ${foto.autor}`);
    console.log(`    ${foto.largura}×${foto.altura} · ${foto.paginaUrl}`);
    if (foto.descricao) console.log(`    "${foto.descricao.slice(0, 110)}"`);
    console.log('');
  });

  const livres = fotos.filter((f) => f.livre).length;
  console.log(
    `${livres} de ${fotos.length} com licença aceitável (domínio público, CC0, CC BY ou CC BY-SA).`,
  );
  console.log('Para usar uma delas: --baixar=<slug-da-materia> --indice=<n>\n');
}

async function main() {
  const argumentos = process.argv.slice(2);
  const termo = argumentos.filter((a) => !a.startsWith('--')).join(' ').trim();
  const slug = argumentos.find((a) => a.startsWith('--baixar='))?.split('=')[1];
  const indice = Number(argumentos.find((a) => a.startsWith('--indice='))?.split('=')[1] ?? 1);

  if (!termo) {
    console.error('Uso: node scripts/wikimedia.mjs "termo de busca" [--baixar=slug] [--indice=n]');
    process.exit(1);
  }

  const fotos = await buscar(termo);
  if (fotos.length === 0) {
    console.log(`Nenhuma imagem encontrada para "${termo}". A matéria fica com o placeholder da marca.`);
    return;
  }

  if (!slug) {
    imprimirLista(fotos, termo);
    return;
  }

  const escolhida = fotos[indice - 1];
  if (!escolhida) {
    console.error(`Índice ${indice} não existe (há ${fotos.length} resultados).`);
    process.exit(1);
  }
  if (!escolhida.livre) {
    console.error(
      `RECUSADA: a licença "${escolhida.licenca}" não permite uso comercial ou obras derivadas.\n` +
        'Escolha outro índice ou deixe a matéria com o placeholder.',
    );
    process.exit(1);
  }

  const { nome } = await baixar(escolhida, slug);

  console.log(`\nFoto salva em src/assets/fotos/${nome}\n`);
  console.log('Cole no frontmatter da matéria (ajuste alt e legenda ao conteúdo real):\n');
  console.log('foto:');
  console.log(`  src: ../../assets/fotos/${nome}`);
  console.log(`  alt: '${escaparYaml(escolhida.descricao || escolhida.arquivo.replace(/\.[^.]+$/, ''))}'`);
  console.log(`  legenda: '${escaparYaml(escolhida.descricao || 'DESCREVA A CENA AQUI')}'`);
  console.log(`  credito: '${escaparYaml(escolhida.autor)}/Wikimedia Commons'`);
  console.log(`  licenca: '${escaparYaml(escolhida.licenca)}'`);
  console.log(`  fonteUrl: '${escolhida.paginaUrl}'`);
  console.log('');
}

main().catch((erro) => {
  console.error(`Erro: ${erro.message}`);
  process.exit(1);
});
