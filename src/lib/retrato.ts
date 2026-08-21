/**
 * Retrato do editor, exibido no editorial.
 *
 * O arquivo é opcional: procuramos por `src/assets/retratos/editor.*` e, se
 * não existir, o site simplesmente não mostra retrato — sem quebrar o build.
 * Por isso a busca é por glob, e não por um import direto.
 *
 * Para colocar o seu: salve a foto como `src/assets/retratos/editor.jpg`
 * (ou .png/.webp). Quadrada, pelo menos 400×400, enquadrada no rosto.
 * O site aplica o preto e branco sozinho — pode mandar colorida.
 */

const encontrados = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/retratos/editor.{jpg,jpeg,png,webp}',
  { eager: true },
);

export const retratoEditor: ImageMetadata | null =
  Object.values(encontrados)[0]?.default ?? null;
