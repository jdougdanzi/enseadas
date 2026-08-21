/**
 * Datas da revista.
 *
 * REGRA: datas de edição e matéria são datas civis ("2026-08-21"), nunca instantes.
 * Se usássemos `new Date('2026-08-21')` o JS interpretaria como meia-noite UTC e,
 * ao formatar em America/Sao_Paulo (UTC-3), a data exibida voltaria um dia.
 * Por isso tudo aqui trabalha com os componentes ano/mês/dia explicitamente.
 */

const FUSO = 'America/Sao_Paulo';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const MESES_CURTOS = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
];

const DIAS_SEMANA = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];

export interface DataCivil {
  ano: number;
  mes: number; // 1–12
  dia: number;
}

/** Quebra "2026-08-21" em componentes. Lança se o formato estiver errado. */
export function parseDataCivil(iso: string): DataCivil {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Data inválida: "${iso}". Use o formato YYYY-MM-DD.`);
  return { ano: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
}

/** Índice do dia da semana (0=domingo) sem interferência de fuso. */
function diaDaSemana({ ano, mes, dia }: DataCivil): number {
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

/** "21 de agosto de 2026" */
export function dataPorExtenso(iso: string): string {
  const { ano, mes, dia } = parseDataCivil(iso);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

/** "Vitória, sexta-feira, 21 de agosto de 2026" — linha superior do masthead. */
export function dataMasthead(iso: string, cidade = 'Vitória'): string {
  const civil = parseDataCivil(iso);
  return `${cidade}, ${DIAS_SEMANA[diaDaSemana(civil)]}, ${dataPorExtenso(iso)}`;
}

/** "21 AGO 2026" — cabeçalho compacto das páginas internas. */
export function dataCurta(iso: string): string {
  const { ano, mes, dia } = parseDataCivil(iso);
  return `${String(dia).padStart(2, '0')} ${MESES_CURTOS[mes - 1]} ${ano}`;
}

/** "AGOSTO DE 2026" — rodapé e editorial. */
export function mesAno(iso: string): string {
  const { ano, mes } = parseDataCivil(iso);
  return `${MESES[mes - 1]} de ${ano}`.toUpperCase();
}

/**
 * Instante para `datetime`/`pubDate` (RSS, JSON-LD).
 * Fixamos meio-dia UTC: a data civil fica igual em qualquer fuso do Brasil.
 */
export function instante(iso: string): Date {
  const { ano, mes, dia } = parseDataCivil(iso);
  return new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
}

/** Número da edição com três dígitos: 1 → "001" */
export function numeroEdicao(n: number): string {
  return String(n).padStart(3, '0');
}

/** Hoje em America/Sao_Paulo, como data civil "YYYY-MM-DD". */
export function hojeISO(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return partes; // en-CA já entrega YYYY-MM-DD
}

/** Estimativa de tempo de leitura a 200 palavras por minuto (mínimo 1). */
export function tempoDeLeitura(texto: string): number {
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}
