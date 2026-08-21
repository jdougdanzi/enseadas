/**
 * RSS da revista — só matérias efetivamente publicadas, mesmo em dev.
 * Assim o feed nunca vaza rascunho para quem assina.
 */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config';
import { abs } from '../lib/url';
import { instante } from '../lib/datas';
import { nomeCaderno } from '../data/cadernos';

export const GET: APIRoute = async () => {
  const edicoes = await getCollection('edicoes');
  const publicadas = new Set(
    edicoes.filter((e) => e.data.status === 'publicada').map((e) => e.data.numero),
  );

  const materias = (await getCollection('materias'))
    .filter(
      (m) =>
        m.data.status === 'aprovada' &&
        !m.data.exemplo &&
        publicadas.has(m.data.edicao),
    )
    .sort((a, b) => (a.data.data < b.data.data ? 1 : -1))
    .slice(0, 50);

  return rss({
    title: `${SITE.nome} — ${SITE.tagline}`,
    description: SITE.descricao,
    site: abs('/'),
    trailingSlash: true,
    customData: `<language>pt-br</language><copyright>© ${new Date().getFullYear()} ${SITE.nome}</copyright>`,
    items: materias.map((m) => ({
      title: m.data.titulo,
      description: m.data.linhaFina,
      link: abs(
        m.data.tipo === 'editorial'
          ? `/editorial/${String(m.data.edicao).padStart(3, '0')}`
          : `/materia/${m.id}`,
      ),
      pubDate: instante(m.data.data),
      author: m.data.autor,
      categories: [nomeCaderno(m.data.caderno), ...m.data.tags].filter(Boolean),
    })),
  });
};
