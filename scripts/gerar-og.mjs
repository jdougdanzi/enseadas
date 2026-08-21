#!/usr/bin/env node
/**
 * Gera as imagens fixas da marca:
 *   public/og-padrao.png       1200×630 — pré-visualização de compartilhamento
 *   public/apple-touch-icon.png 180×180 — ícone na tela de início do iPhone
 *
 * Rode de novo só se a marca mudar: o WhatsApp guarda a imagem em cache por
 * bastante tempo, então trocar o arquivo não atualiza pré-visualizações antigas.
 *
 *   node scripts/gerar-og.mjs
 */

import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(RAIZ, 'public/og-padrao.png');
const SAIDA_ICONE = join(RAIZ, 'public/apple-touch-icon.png');

const AZUL = '#2B4FC7';
const TINTA = '#14161A';
const PAPEL = '#FFFFFF';
const FIO = '#D9DBE3';

// Playfair Display não está instalada no sistema; a pilha cai em serifadas
// clássicas, que preservam o caráter tipográfico da marca.
const SERIF = 'Playfair Display, Didot, Georgia, Times New Roman, serif';
const SANS = 'Archivo, Helvetica Neue, Helvetica, Arial, sans-serif';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPEL}"/>

  <!-- fio triplo do masthead -->
  <rect x="80" y="96" width="1040" height="6" fill="${TINTA}"/>
  <rect x="80" y="106" width="1040" height="2" fill="${TINTA}"/>

  <!-- assinatura (bloco E + wordmark, centralizados na página) -->
  <rect x="351" y="232" width="118" height="118" fill="${AZUL}"/>
  <text x="410" y="330" font-family="${SERIF}" font-weight="900" font-size="88"
        fill="${PAPEL}" text-anchor="middle">E</text>
  <text x="497" y="316" font-family="${SERIF}" font-weight="700" font-size="76"
        fill="${AZUL}">Enseada<tspan font-size="93">S</tspan></text>

  <!-- linha de apoio, centralizada sob a assinatura -->
  <rect x="226" y="392" width="52" height="2" fill="${AZUL}"/>
  <text x="298" y="399" font-family="${SANS}" font-weight="600" font-size="20"
        letter-spacing="6" fill="${AZUL}">DIÁRIO DE BOAS NOTÍCIAS · ESPÍRITO SANTO</text>

  <!-- fio e chamada -->
  <rect x="80" y="466" width="1040" height="1" fill="${FIO}"/>
  <text x="600" y="516" font-family="${SERIF}" font-style="italic" font-size="30"
        fill="${TINTA}" text-anchor="middle">Toda sexta-feira, seis cadernos de coisas boas</text>

  <rect x="80" y="556" width="1040" height="2" fill="${TINTA}"/>
</svg>`;

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(SAIDA, png);
console.log(`og-padrao.png gerado (${(png.length / 1024).toFixed(0)} KB) em public/`);

// Monograma: o bloco E sozinho, como manda o manual (seção 01).
const svgIcone = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="${AZUL}"/>
  <text x="90" y="132" font-family="${SERIF}" font-weight="900" font-size="126"
        fill="${PAPEL}" text-anchor="middle">E</text>
</svg>`;

const icone = await sharp(Buffer.from(svgIcone)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(SAIDA_ICONE, icone);
console.log(`apple-touch-icon.png gerado (${(icone.length / 1024).toFixed(0)} KB) em public/`);

// Ícones do manifesto (Android/instalação). O desenho de sangria total já
// funciona como "maskable": o E fica dentro da zona segura central.
for (const lado of [192, 512]) {
  const svgManifesto = `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="${AZUL}"/>
  <text x="90" y="126" font-family="${SERIF}" font-weight="900" font-size="108"
        fill="${PAPEL}" text-anchor="middle">E</text>
</svg>`;
  const png = await sharp(Buffer.from(svgManifesto)).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(join(RAIZ, `public/icone-${lado}.png`), png);
  console.log(`icone-${lado}.png gerado (${(png.length / 1024).toFixed(0)} KB) em public/`);
}
