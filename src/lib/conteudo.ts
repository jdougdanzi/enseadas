/**
 * Regras de visibilidade e consultas de conteúdo.
 *
 * ESTE É O ÚNICO LUGAR que decide o que vai ao ar. Nenhuma página deve filtrar
 * status por conta própria — assim um rascunho nunca vaza para produção.
 *
 * Produção: só edição `publicada` + matéria `aprovada` + não-exemplo.
 * Desenvolvimento: mostra tudo, com selo de rascunho na tela.
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { CADERNOS, type CadernoSlug } from '../data/cadernos';
import { tempoDeLeitura } from './datas';

export type Materia = CollectionEntry<'materias'>;
export type Edicao = CollectionEntry<'edicoes'>;

/** Em `astro dev` mostramos rascunhos; em `astro build` (produção), não. */
export const MODO_REDACAO: boolean = import.meta.env.DEV;

/* ---------------- Edições ---------------- */

/** Edições que o site pode exibir, da mais nova para a mais antiga. */
export async function getEdicoes(): Promise<Edicao[]> {
  const todas = await getCollection('edicoes');
  return todas
    .filter((e) => {
      if (MODO_REDACAO) return true;
      return e.data.status === 'publicada';
    })
    .sort((a, b) => b.data.numero - a.data.numero);
}

/** Apenas as edições que já foram publicadas de fato (usado no arquivo e no RSS). */
export async function getEdicoesPublicadas(): Promise<Edicao[]> {
  const todas = await getCollection('edicoes');
  return todas
    .filter((e) => e.data.status === 'publicada')
    .sort((a, b) => b.data.numero - a.data.numero);
}

/** A edição que abre o site. `undefined` quando ainda não há nada — a home mostra "em breve". */
export async function edicaoCorrente(): Promise<Edicao | undefined> {
  const edicoes = await getEdicoes();
  if (!MODO_REDACAO) return edicoes[0];

  // Na redação, a edição em preparo (aberta/fechada) é a que interessa ver primeiro.
  const emPreparo = edicoes
    .filter((e) => e.data.status === 'aberta' || e.data.status === 'fechada')
    .sort((a, b) => b.data.numero - a.data.numero)[0];
  return emPreparo ?? edicoes[0];
}

export async function getEdicao(numero: number): Promise<Edicao | undefined> {
  const edicoes = await getEdicoes();
  return edicoes.find((e) => e.data.numero === numero);
}

/* ---------------- Matérias ---------------- */

/** Números das edições cujo conteúdo pode aparecer no site. */
async function edicoesLiberadas(): Promise<Set<number>> {
  const edicoes = await getEdicoes();
  return new Set(edicoes.map((e) => e.data.numero));
}

/**
 * Todas as matérias visíveis no contexto atual, da mais nova para a mais antiga.
 * Empate de data é desempatado pela edição e pelo id, para o build ser determinístico.
 */
export async function getMaterias(): Promise<Materia[]> {
  const liberadas = await edicoesLiberadas();
  const todas = await getCollection('materias');

  return todas
    .filter((m) => {
      if (!liberadas.has(m.data.edicao)) return false;
      if (MODO_REDACAO) return true;
      return m.data.status === 'aprovada' && !m.data.exemplo;
    })
    .sort(ordemEditorial);
}

function ordemEditorial(a: Materia, b: Materia): number {
  if (a.data.data !== b.data.data) return a.data.data < b.data.data ? 1 : -1;
  if (a.data.edicao !== b.data.edicao) return b.data.edicao - a.data.edicao;
  return a.id.localeCompare(b.id);
}

/** Matérias comuns (sem editoriais) — o que aparece em cadernos e listagens. */
export async function getReportagens(): Promise<Materia[]> {
  return (await getMaterias()).filter((m) => m.data.tipo === 'materia');
}

export async function getMateriasDaEdicao(numero: number): Promise<Materia[]> {
  return (await getMaterias()).filter((m) => m.data.edicao === numero);
}

export async function getMateriasDoCaderno(slug: CadernoSlug): Promise<Materia[]> {
  return (await getReportagens()).filter((m) => m.data.caderno === slug);
}

export async function getMateriaPorId(id: string): Promise<Materia | undefined> {
  return (await getMaterias()).find((m) => m.id === id);
}

/** Editorial de uma edição, buscado pela referência da edição ou pelo tipo. */
export async function getEditorialDaEdicao(numero: number): Promise<Materia | undefined> {
  const edicao = await getEdicao(numero);
  const materias = await getMaterias();

  if (edicao?.data.editorial) {
    const porReferencia = materias.find((m) => m.id === edicao.data.editorial!.id);
    if (porReferencia) return porReferencia;
  }
  return materias.find((m) => m.data.edicao === numero && m.data.tipo === 'editorial');
}

/* ---------------- Composição da capa ---------------- */

export interface CapaMontada {
  edicao: Edicao;
  manchete?: Materia;
  laterais: Materia[];
  linhaInferior: Materia[];
}

/**
 * Resolve as referências da capa em matérias visíveis.
 * Se a edição ainda não tem capa definida (comum durante a semana), monta uma
 * prévia automática pela ordem editorial, para a redação enxergar o resultado.
 */
export async function montarCapa(edicao: Edicao): Promise<CapaMontada> {
  const daEdicao = await getMateriasDaEdicao(edicao.data.numero);
  const reportagens = daEdicao.filter((m) => m.data.tipo === 'materia');
  const porId = new Map(daEdicao.map((m) => [m.id, m]));
  const capa = edicao.data.capa;

  if (!capa) {
    return {
      edicao,
      manchete: reportagens[0],
      laterais: reportagens.slice(1, 4),
      linhaInferior: reportagens.slice(4, 7),
    };
  }

  const usadas = new Set<string>();
  const pegar = (ref: { id: string } | undefined): Materia | undefined => {
    if (!ref) return undefined;
    const m = porId.get(ref.id);
    if (!m || usadas.has(m.id)) return undefined;
    usadas.add(m.id);
    return m;
  };

  const manchete = pegar(capa.manchete);
  const laterais = capa.laterais.map(pegar).filter((m): m is Materia => Boolean(m));
  const linhaInferior = capa.linhaInferior
    .map(pegar)
    .filter((m): m is Materia => Boolean(m));

  return { edicao, manchete, laterais, linhaInferior };
}

/* ---------------- Relacionadas ---------------- */

/** Até `limite` matérias para o "Leia também": mesmo caderno primeiro, depois tags em comum. */
export async function getRelacionadas(materia: Materia, limite = 3): Promise<Materia[]> {
  const candidatas = (await getReportagens()).filter((m) => m.id !== materia.id);
  const tags = new Set(materia.data.tags);

  const pontuar = (m: Materia): number => {
    let p = 0;
    if (m.data.caderno === materia.data.caderno) p += 3;
    p += m.data.tags.filter((t) => tags.has(t)).length;
    if (m.data.edicao === materia.data.edicao) p += 1;
    return p;
  };

  return candidatas
    .map((m) => ({ m, p: pontuar(m) }))
    .sort((a, b) => b.p - a.p || ordemEditorial(a.m, b.m))
    .slice(0, limite)
    .map(({ m }) => m);
}

/* ---------------- Auxiliares de exibição ---------------- */

/** Tempo de leitura declarado no frontmatter ou calculado a partir do texto. */
export function leituraMin(materia: Materia): number {
  return materia.data.leituraMin ?? tempoDeLeitura(materia.body ?? '');
}

/** true quando a matéria ainda não foi aprovada (usado pelo selo de rascunho em dev). */
export function ehRascunho(materia: Materia): boolean {
  return materia.data.status !== 'aprovada' || materia.data.exemplo;
}

/** Kicker no padrão da marca: "CIDADES · VILA VELHA". */
export function kicker(materia: Materia): string {
  const caderno = CADERNOS.find((c) => c.slug === materia.data.caderno);
  const partes = [caderno?.nome, materia.data.cidade?.toUpperCase()].filter(Boolean);
  return partes.join(' · ') || 'OPINIÃO · EDITORIAL';
}
