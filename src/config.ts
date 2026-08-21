/**
 * Configuração central da revista.
 * Único lugar para mexer em nome, contatos, analytics e verificação de busca.
 */

export const SITE = {
  nome: 'EnseadaS',
  tagline: 'Diário de Boas Notícias · Espírito Santo',
  taglineCurta: 'Diário de Boas Notícias · ES',
  descricao:
    'Revista eletrônica semanal com as boas notícias do Espírito Santo: cidades, cultura, sabores, mar & montanha, gente boa e agenda.',
  autorPadrao: 'Douglas Danzi',
  idioma: 'pt-BR',
  locale: 'pt_BR',
  cidadeSede: 'Vitória',
  emailRedacao: 'redacao@enseadas.com.br',
  emailCartas: 'cartas@enseadas.com.br',
} as const;

/**
 * ID de medição do Google Analytics 4 (formato G-XXXXXXXXXX).
 * Vazio = nenhum script de analytics é injetado.
 * O gtag só entra em builds de produção — nunca no `astro dev`.
 */
export const GA_MEASUREMENT_ID = '';

/**
 * Conteúdo da meta tag `google-site-verification` do Google Search Console.
 * Vazio = a meta tag não é renderizada.
 */
export const SEARCH_CONSOLE_TOKEN = '';

/** Expediente exibido na página de editorial e no /expediente. */
export const EXPEDIENTE = [
  { funcao: 'Direção editorial', nome: 'Douglas Danzi' },
  { funcao: 'Edição e reportagem', nome: 'Douglas Danzi' },
  { funcao: 'Produção', nome: 'Redação EnseadaS, com apoio de inteligência artificial' },
  { funcao: 'Contato', nome: SITE.emailRedacao },
] as const;
