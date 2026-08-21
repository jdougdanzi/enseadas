/**
 * Montagem de URLs respeitando o `base` do GitHub Pages (/enseadas).
 *
 * REGRA: nenhum link, imagem ou canonical deve ser escrito à mão no template.
 * Use `href()` para links internos e `abs()` para canonical, OG e RSS.
 */

import { SITE } from '../config';

/** Base configurada em astro.config.mjs, sempre terminando em "/" — ex.: "/enseadas/" */
const BASE: string = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

/** Origem pública do site — ex.: "https://jdougdanzi.github.io" */
const ORIGEM: string = (import.meta.env.SITE ?? 'https://jdougdanzi.github.io').replace(
  /\/$/,
  '',
);

/**
 * Caminho interno com o base aplicado e barra final (trailingSlash: 'always').
 * href('/materia/foo') → "/enseadas/materia/foo/"
 * href('/')            → "/enseadas/"
 */
export function href(caminho: string): string {
  const limpo = caminho.replace(/^\/+/, '');
  if (limpo === '') return BASE;

  // Arquivos (feed.xml, sitemap-index.xml, og-padrao.png) não levam barra final.
  const ehArquivo = /\.[a-z0-9]{2,5}$/i.test(limpo);
  const comBarra = ehArquivo || limpo.endsWith('/') ? limpo : `${limpo}/`;
  return `${BASE}${comBarra}`;
}

/**
 * URL absoluta e pública — obrigatória em canonical, og:image, RSS e JSON-LD.
 * abs('/materia/foo') → "https://jdougdanzi.github.io/enseadas/materia/foo/"
 */
export function abs(caminho: string): string {
  return `${ORIGEM}${href(caminho)}`;
}

/** Absolutiza um caminho já processado pelo Astro (ex.: src de imagem otimizada). */
export function absAsset(caminhoJaComBase: string): string {
  if (/^https?:\/\//i.test(caminhoJaComBase)) return caminhoJaComBase;
  return `${ORIGEM}${caminhoJaComBase.startsWith('/') ? '' : '/'}${caminhoJaComBase}`;
}

/* ---------- Rotas da revista (fonte única de verdade) ---------- */

export const rotas = {
  capa: () => href('/'),
  materia: (slug: string) => href(`/materia/${slug}`),
  caderno: (slug: string) => href(`/caderno/${slug}`),
  edicao: (numero: number) => href(`/edicao/${String(numero).padStart(3, '0')}`),
  editorial: (numero: number) => href(`/editorial/${String(numero).padStart(3, '0')}`),
  assunto: (slug: string) => href(`/assunto/${slug}`),
  assuntos: () => href('/assuntos'),
  arquivo: () => href('/arquivo'),
  expediente: () => href('/expediente'),
  contato: () => href('/contato'),
  salvos: () => href('/salvos'),
  privacidade: () => href('/privacidade'),
  feed: () => href('/feed.xml'),
} as const;

/** Link de compartilhamento no WhatsApp com título e URL absoluta. */
export function linkWhatsApp(titulo: string, caminho: string): string {
  const texto = `${titulo} — ${SITE.nome}\n${abs(caminho)}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
