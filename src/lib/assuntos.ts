/**
 * Assuntos (tags) como navegação: cada tag vira uma rota /assunto/<slug>/.
 *
 * O slug é derivado do rótulo, então a redação continua escrevendo tags em
 * português com acento no frontmatter — sem precisar pensar em URL.
 */

import { getReportagens, type Materia } from './conteudo';

/** "Mata Atlântica" → "mata-atlantica" */
export function slugAssunto(rotulo: string): string {
  return rotulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface Assunto {
  slug: string;
  /** Grafia exibida — a primeira encontrada na ordem editorial. */
  rotulo: string;
  materias: Materia[];
}

/**
 * Todos os assuntos visíveis, do mais usado para o menos.
 * Tags que diferem só por acento ou caixa caem no mesmo assunto.
 */
export async function getAssuntos(): Promise<Assunto[]> {
  const materias = await getReportagens();
  const mapa = new Map<string, Assunto>();

  for (const materia of materias) {
    for (const tag of materia.data.tags) {
      const slug = slugAssunto(tag);
      if (!slug) continue;

      const existente = mapa.get(slug);
      if (existente) {
        if (!existente.materias.some((m) => m.id === materia.id)) {
          existente.materias.push(materia);
        }
      } else {
        mapa.set(slug, { slug, rotulo: tag, materias: [materia] });
      }
    }
  }

  return [...mapa.values()].sort(
    (a, b) => b.materias.length - a.materias.length || a.rotulo.localeCompare(b.rotulo, 'pt-BR'),
  );
}

export async function getAssunto(slug: string): Promise<Assunto | undefined> {
  return (await getAssuntos()).find((a) => a.slug === slug);
}
