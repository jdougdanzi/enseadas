/**
 * Dados estruturados (schema.org) — como o Google entende a revista.
 *
 * NewsArticle nas matérias, WebSite + Organization na capa,
 * BreadcrumbList na trilha Capa › Caderno › Matéria.
 */

import { SITE } from '../config';
import { abs } from './url';
import { instante } from './datas';

const ID_ORG = abs('/#organizacao');
const ID_SITE = abs('/#site');

export function organizacao(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': ID_ORG,
    name: SITE.nome,
    alternateName: `${SITE.nome} — ${SITE.tagline}`,
    url: abs('/'),
    description: SITE.descricao,
    inLanguage: SITE.idioma,
    email: SITE.emailRedacao,
    logo: {
      '@type': 'ImageObject',
      url: abs('/og-padrao.png'),
      width: 1200,
      height: 630,
    },
    areaServed: {
      '@type': 'State',
      name: 'Espírito Santo',
      containedInPlace: { '@type': 'Country', name: 'Brasil' },
    },
    founder: { '@type': 'Person', name: SITE.autorPadrao },
  };
}

export function website(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ID_SITE,
    name: SITE.nome,
    url: abs('/'),
    description: SITE.descricao,
    inLanguage: SITE.idioma,
    publisher: { '@id': ID_ORG },
  };
}

export interface DadosArtigo {
  titulo: string;
  descricao: string;
  caminho: string;
  data: string;
  autor: string;
  secao?: string;
  tags?: string[];
  imagem?: string;
  tipo?: 'NewsArticle' | 'OpinionNewsArticle';
  palavras?: number;
}

export function artigo(dados: DadosArtigo): Record<string, unknown> {
  const url = abs(dados.caminho);
  const publicado = instante(dados.data).toISOString();

  return {
    '@context': 'https://schema.org',
    '@type': dados.tipo ?? 'NewsArticle',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: dados.titulo.slice(0, 110),
    description: dados.descricao,
    url,
    datePublished: publicado,
    dateModified: publicado,
    inLanguage: SITE.idioma,
    author: { '@type': 'Person', name: dados.autor },
    publisher: { '@id': ID_ORG },
    isPartOf: { '@id': ID_SITE },
    ...(dados.secao ? { articleSection: dados.secao } : {}),
    ...(dados.tags?.length ? { keywords: dados.tags.join(', ') } : {}),
    ...(dados.imagem ? { image: [dados.imagem] } : {}),
    ...(dados.palavras ? { wordCount: dados.palavras } : {}),
  };
}

export function trilha(itens: { nome: string; caminho: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.nome,
      item: abs(item.caminho),
    })),
  };
}

export function colecao(
  nome: string,
  descricao: string,
  caminho: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: nome,
    description: descricao,
    url: abs(caminho),
    inLanguage: SITE.idioma,
    isPartOf: { '@id': ID_SITE },
    publisher: { '@id': ID_ORG },
  };
}
