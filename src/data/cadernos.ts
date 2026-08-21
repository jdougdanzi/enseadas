/**
 * Os seis cadernos fixos da revista, conforme o Manual da Marca (seção 04).
 * A ordem deste array é a ordem da navegação e das capas de caderno.
 */

export interface Caderno {
  /** Número editorial exibido em Playfair (Nº1, Nº2…) */
  numero: number;
  /** Slug da rota: /caderno/<slug>/ */
  slug: string;
  /** Nome em caixa-alta, como aparece na navegação e na abertura */
  nome: string;
  /** Linha de apoio em itálico na capa do caderno */
  tagline: string;
  /** Descrição usada em SEO e na página de arquivo */
  descricao: string;
}

export const CADERNOS = [
  {
    numero: 1,
    slug: 'cidades',
    nome: 'CIDADES',
    tagline: 'a vida que acontece nos 78 municípios',
    descricao:
      'Iniciativas, obras do bem e vida urbana dos 78 municípios capixabas.',
  },
  {
    numero: 2,
    slug: 'cultura',
    nome: 'CULTURA',
    tagline: 'o patrimônio vivo do Espírito Santo',
    descricao:
      'Congo, festas, música, arte e o patrimônio vivo do Espírito Santo.',
  },
  {
    numero: 3,
    slug: 'sabores',
    nome: 'SABORES',
    tagline: 'a cozinha que conta o Espírito Santo',
    descricao:
      'Moqueca, torta capixaba, panela de barro e quem cozinha a tradição.',
  },
  {
    numero: 4,
    slug: 'mar-e-montanha',
    nome: 'MAR & MONTANHA',
    tagline: 'das enseadas às pedras',
    descricao:
      'Das enseadas de Guarapari às pedras de Pedra Azul: turismo e natureza.',
  },
  {
    numero: 5,
    slug: 'gente-boa',
    nome: 'GENTE BOA',
    tagline: 'quem faz a diferença por aqui',
    descricao:
      'Perfis de capixabas que fazem a diferença nas suas comunidades.',
  },
  {
    numero: 6,
    slug: 'agenda',
    nome: 'AGENDA',
    tagline: 'o que vem de bom pela frente',
    descricao:
      'O que vem de bom: eventos, feiras, shows e programação do fim de semana.',
  },
] as const satisfies readonly Caderno[];

/** Um item concreto de CADERNOS — preserva o slug literal para o TypeScript. */
export type CadernoDefinido = (typeof CADERNOS)[number];

export type CadernoSlug = CadernoDefinido['slug'];

/** Slugs para uso em enums de schema (zod exige tupla não-vazia). */
export const CADERNO_SLUGS = CADERNOS.map((c) => c.slug) as [
  CadernoSlug,
  ...CadernoSlug[],
];

export function getCaderno(slug: string): Caderno | undefined {
  return CADERNOS.find((c) => c.slug === slug);
}

/** Nome de exibição do caderno, ou string vazia se não existir. */
export function nomeCaderno(slug: string | undefined): string {
  if (!slug) return '';
  return getCaderno(slug)?.nome ?? '';
}
