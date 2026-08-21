import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { CADERNO_SLUGS } from './data/cadernos';
import { SITE } from './config';

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Uma fonte real consultada na apuração. Toda matéria precisa de pelo menos uma. */
const fonte = z.object({
  titulo: z.string().min(3),
  url: z.url(),
  veiculo: z.string().optional(),
  acessoEm: z.string().regex(DATA_ISO).optional(),
});

/**
 * MATÉRIAS — um arquivo markdown por texto. O nome do arquivo vira o slug da URL.
 *
 * Regras duras aplicadas aqui (o build falha se forem violadas):
 *  - matéria comum precisa de caderno e de pelo menos uma fonte com URL;
 *  - foto só entra com crédito, licença e link da origem (Wikimedia Commons);
 *  - data é string civil YYYY-MM-DD, nunca z.date() (ver src/lib/datas.ts).
 */
const materias = defineCollection({
  loader: glob({ base: './src/content/materias', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z
      .object({
        titulo: z.string().min(5).max(120),
        linhaFina: z.string().min(10).max(260),
        tipo: z.enum(['materia', 'editorial']).default('materia'),
        caderno: z.enum(CADERNO_SLUGS).optional(),
        cidade: z.string().min(2).optional(),
        tags: z.array(z.string()).default([]),
        autor: z.string().default(SITE.autorPadrao),
        data: z.string().regex(DATA_ISO, 'Use o formato YYYY-MM-DD'),
        edicao: z.number().int().min(0),
        status: z.enum(['rascunho', 'aprovada']).default('rascunho'),
        /** Conteúdo de demonstração: visível só em dev, nunca publicável. */
        exemplo: z.boolean().default(false),
        foto: z
          .object({
            src: image(),
            alt: z.string().min(5),
            legenda: z.string().min(5),
            credito: z.string().min(2),
            licenca: z.string().min(2),
            /** Página de origem. Só falta em foto própria, feita pela redação. */
            fonteUrl: z.url().optional(),
          })
          .optional(),
        fontes: z.array(fonte).default([]),
        leituraMin: z.number().int().positive().optional(),
      })
      .superRefine((dados, ctx) => {
        if (dados.tipo === 'materia') {
          if (!dados.caderno) {
            ctx.addIssue({
              code: 'custom',
              path: ['caderno'],
              message: 'Matéria precisa de um caderno.',
            });
          }
          if (!dados.cidade) {
            ctx.addIssue({
              code: 'custom',
              path: ['cidade'],
              message: 'Matéria precisa de cidade (usada no kicker "CADERNO · CIDADE").',
            });
          }
          if (!dados.exemplo && dados.fontes.length === 0) {
            ctx.addIssue({
              code: 'custom',
              path: ['fontes'],
              message:
                'Nenhuma matéria vai ao ar sem fonte. Informe ao menos uma fonte real com URL.',
            });
          }
        }
        if (dados.exemplo && dados.status === 'aprovada') {
          ctx.addIssue({
            code: 'custom',
            path: ['status'],
            message: 'Conteúdo de exemplo nunca pode ser aprovado.',
          });
        }
      }),
});

/**
 * EDIÇÕES — um YAML por semana (001.yaml, 002.yaml…).
 * A matéria diz a que edição pertence (campo `edicao`);
 * a edição diz qual é o papel de cada matéria na capa.
 */
const edicoes = defineCollection({
  loader: glob({ base: './src/content/edicoes', pattern: '**/*.yaml' }),
  schema: z.object({
    numero: z.number().int().min(0),
    dataFechamento: z.string().regex(DATA_ISO, 'Use o formato YYYY-MM-DD'),
    status: z.enum(['aberta', 'fechada', 'publicada', 'exemplo']),
    capa: z
      .object({
        manchete: reference('materias'),
        laterais: z.array(reference('materias')).max(4).default([]),
        linhaInferior: z.array(reference('materias')).max(4).default([]),
      })
      .optional(),
    editorial: reference('materias').optional(),
    /** Caixa azul-papel da coluna lateral. Sem isto, entra o convite de compartilhamento. */
    destaqueLateral: z
      .object({
        titulo: z.string(),
        texto: z.string(),
      })
      .optional(),
  }),
});

/** Cartas de leitores exibidas na página de editorial. */
const cartas = defineCollection({
  loader: file('./src/content/cartas.json'),
  schema: z.object({
    id: z.string(),
    texto: z.string().min(10),
    assinatura: z.string().min(2),
    edicao: z.number().int().min(0),
  }),
});

export const collections = { materias, edicoes, cartas };
