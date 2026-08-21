#!/usr/bin/env node
/**
 * Confere se uma edição pode ser fechada ou publicada.
 *
 * Uso:
 *   node scripts/validar-edicao.mjs 1          # valida a edição 001
 *   node scripts/validar-edicao.mjs 1 --publicar  # exige tudo pronto para ir ao ar
 *
 * Sai com código 1 se houver erro — assim a skill /publicar não segue adiante.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_MATERIAS = join(RAIZ, 'src/content/materias');
const DIR_EDICOES = join(RAIZ, 'src/content/edicoes');

const CADERNOS_VALIDOS = [
  'cidades', 'cultura', 'sabores', 'mar-e-montanha', 'gente-boa', 'agenda',
];

const erros = [];
const avisos = [];

function erro(msg) { erros.push(msg); }
function aviso(msg) { avisos.push(msg); }

function converter(valor) {
  const v = valor.replace(/^['"]|['"]$/g, '');
  if (/^-?\d+$/.test(v)) return Number(v);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

/** Extrai frontmatter e corpo de um markdown. */
function separarFrontmatter(conteudo) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(conteudo);
  if (!m) return null;
  return { frontmatter: m[1], corpo: m[2] };
}

/** Campos simples do frontmatter, com listas de referências. */
function lerMateria(frontmatter) {
  const dados = { tags: [], fontes: [], foto: null };
  const linhas = frontmatter.split('\n');
  let bloco = null;

  for (const linhaBruta of linhas) {
    if (!linhaBruta.trim()) continue;
    const indent = linhaBruta.length - linhaBruta.trimStart().length;
    const linha = linhaBruta.trim();

    if (indent === 0) {
      bloco = null;
      const sep = linha.indexOf(':');
      if (sep === -1) continue;
      const chave = linha.slice(0, sep).trim();
      const resto = linha.slice(sep + 1).trim();

      if (chave === 'foto') { bloco = 'foto'; dados.foto = {}; continue; }
      if (chave === 'fontes') {
        if (resto === '[]' || resto === '') { bloco = 'fontes'; continue; }
        bloco = 'fontes';
        continue;
      }
      if (chave === 'tags') {
        if (resto.startsWith('[')) {
          dados.tags = resto.slice(1, -1).split(',').map((t) => t.trim()).filter(Boolean);
        }
        continue;
      }
      dados[chave] = converter(resto);
      continue;
    }

    if (bloco === 'foto' && dados.foto) {
      const sep = linha.indexOf(':');
      if (sep > 0) dados.foto[linha.slice(0, sep).trim()] = converter(linha.slice(sep + 1).trim());
    }

    if (bloco === 'fontes') {
      if (linha.startsWith('- ')) {
        dados.fontes.push({});
        const conteudo = linha.slice(2).trim();
        const sep = conteudo.indexOf(':');
        if (sep > 0) {
          dados.fontes[dados.fontes.length - 1][conteudo.slice(0, sep).trim()] =
            converter(conteudo.slice(sep + 1).trim());
        }
      } else if (dados.fontes.length > 0) {
        const sep = linha.indexOf(':');
        if (sep > 0) {
          dados.fontes[dados.fontes.length - 1][linha.slice(0, sep).trim()] =
            converter(linha.slice(sep + 1).trim());
        }
      }
    }
  }
  return dados;
}

/** Lê o YAML da edição: escalares no topo + capa com listas de referências. */
function lerEdicao(texto) {
  const dados = { capa: null, editorial: null };
  const linhas = texto.split('\n');
  let secao = null;
  let listaAtual = null;

  for (const linhaBruta of linhas) {
    const semComentario = linhaBruta.replace(/(^|\s)#.*$/, '');
    if (!semComentario.trim()) continue;
    const indent = semComentario.length - semComentario.trimStart().length;
    const linha = semComentario.trim();

    if (linha.startsWith('- ')) {
      if (listaAtual) listaAtual.push(converter(linha.slice(2).trim()));
      continue;
    }

    const sep = linha.indexOf(':');
    if (sep === -1) continue;
    const chave = linha.slice(0, sep).trim();
    const resto = linha.slice(sep + 1).trim();

    if (indent === 0) {
      listaAtual = null;
      if (chave === 'capa') {
        secao = 'capa';
        dados.capa = { manchete: null, laterais: [], linhaInferior: [] };
        continue;
      }
      if (chave === 'destaqueLateral') { secao = 'destaque'; continue; }
      secao = null;
      dados[chave] = converter(resto);
      continue;
    }

    if (secao === 'capa' && dados.capa) {
      if (resto === '') {
        // Lista em bloco: os itens vêm nas linhas seguintes, com "- ".
        dados.capa[chave] = dados.capa[chave] ?? [];
        listaAtual = dados.capa[chave];
      } else if (resto.startsWith('[')) {
        // Lista em linha: [um, outro]
        dados.capa[chave] = resto
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((item) => converter(item.trim()))
          .filter((item) => item !== '');
        listaAtual = null;
      } else {
        dados.capa[chave] = converter(resto);
        listaAtual = null;
      }
    }
  }
  return dados;
}

async function main() {
  const args = process.argv.slice(2);
  const numero = Number(args.find((a) => !a.startsWith('--')));
  const paraPublicar = args.includes('--publicar');

  if (!Number.isInteger(numero)) {
    console.error('Uso: node scripts/validar-edicao.mjs <numero> [--publicar]');
    process.exit(1);
  }

  const nomeArquivo = `${String(numero).padStart(3, '0')}.yaml`;
  let textoEdicao;
  try {
    textoEdicao = await readFile(join(DIR_EDICOES, nomeArquivo), 'utf8');
  } catch {
    console.error(`Edição não encontrada: src/content/edicoes/${nomeArquivo}`);
    process.exit(1);
  }

  const edicao = lerEdicao(textoEdicao);

  // ---- Carrega as matérias ----
  const arquivos = (await readdir(DIR_MATERIAS)).filter((f) => f.endsWith('.md'));
  const materias = new Map();

  for (const arquivo of arquivos) {
    const conteudo = await readFile(join(DIR_MATERIAS, arquivo), 'utf8');
    const partes = separarFrontmatter(conteudo);
    if (!partes) {
      erro(`${arquivo}: frontmatter ausente ou malformado.`);
      continue;
    }
    const dados = lerMateria(partes.frontmatter);
    materias.set(basename(arquivo, '.md'), { ...dados, corpo: partes.corpo, arquivo });
  }

  const daEdicao = [...materias.entries()].filter(([, m]) => Number(m.edicao) === numero);
  const reportagens = daEdicao.filter(([, m]) => (m.tipo ?? 'materia') === 'materia');
  const aprovadas = daEdicao.filter(([, m]) => m.status === 'aprovada');

  // ---- Regras de conteúdo ----
  for (const [slug, m] of daEdicao) {
    const tipo = m.tipo ?? 'materia';
    const rotulo = `${slug}.md`;

    if (!m.titulo) erro(`${rotulo}: sem título.`);
    if (!m.linhaFina) erro(`${rotulo}: sem linha-fina.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(m.data ?? ''))) {
      erro(`${rotulo}: data "${m.data}" fora do formato YYYY-MM-DD.`);
    }

    if (tipo === 'materia') {
      if (!CADERNOS_VALIDOS.includes(String(m.caderno))) {
        erro(`${rotulo}: caderno "${m.caderno}" não existe.`);
      }
      if (!m.cidade) erro(`${rotulo}: sem cidade (usada no kicker).`);
      if (!m.exemplo && m.fontes.length === 0) {
        erro(`${rotulo}: nenhuma fonte informada. Matéria sem fonte não vai ao ar.`);
      }
      for (const fonte of m.fontes) {
        if (!/^https?:\/\//.test(String(fonte.url ?? ''))) {
          erro(`${rotulo}: fonte sem URL válida (${JSON.stringify(fonte)}).`);
        }
      }
    }

    if (m.foto) {
      for (const campo of ['src', 'alt', 'legenda', 'credito', 'licenca']) {
        if (!m.foto[campo]) erro(`${rotulo}: foto sem "${campo}".`);
      }
      if (/\bNC\b|\bND\b/i.test(String(m.foto.licenca ?? ''))) {
        erro(`${rotulo}: licença de foto "${m.foto.licenca}" não permite uso comercial/derivado.`);
      }
    }

    if (m.exemplo && m.status === 'aprovada') {
      erro(`${rotulo}: conteúdo de exemplo não pode ser aprovado.`);
    }

    const palavras = m.corpo.trim().split(/\s+/).filter(Boolean).length;
    if (tipo === 'materia' && !m.exemplo && palavras < 250) {
      aviso(`${rotulo}: texto curto (${palavras} palavras). O padrão da casa é 350–600.`);
    }
    if (palavras > 900) {
      aviso(`${rotulo}: texto longo (${palavras} palavras).`);
    }
  }

  // ---- Regras da capa ----
  const capa = edicao.capa;
  if (paraPublicar || edicao.status === 'fechada' || edicao.status === 'publicada') {
    if (!capa) {
      erro('A edição não tem capa definida (manchete e chamadas laterais).');
    } else {
      const refs = [
        ...(capa.manchete ? [['manchete', capa.manchete]] : []),
        ...(capa.laterais ?? []).map((r) => ['lateral', r]),
        ...(capa.linhaInferior ?? []).map((r) => ['linha inferior', r]),
      ];

      if (!capa.manchete) erro('A capa não tem manchete.');
      if ((capa.laterais ?? []).length < 2) {
        erro('A capa precisa de pelo menos duas chamadas laterais.');
      }

      const vistos = new Set();
      for (const [papel, ref] of refs) {
        const materia = materias.get(String(ref));
        if (!materia) {
          erro(`Capa (${papel}): a matéria "${ref}" não existe.`);
          continue;
        }
        if (Number(materia.edicao) !== numero) {
          erro(`Capa (${papel}): "${ref}" pertence à edição ${materia.edicao}, não à ${numero}.`);
        }
        if (materia.status !== 'aprovada') {
          erro(`Capa (${papel}): "${ref}" ainda é rascunho. Aprove antes de fechar.`);
        }
        if (vistos.has(String(ref))) {
          erro(`Capa: "${ref}" aparece duas vezes.`);
        }
        vistos.add(String(ref));
      }

      const foraDaCapa = aprovadas
        .filter(([slug, m]) => (m.tipo ?? 'materia') === 'materia' && !vistos.has(slug))
        .map(([slug]) => slug);
      if (foraDaCapa.length > 0) {
        aviso(`Aprovadas fora da capa (aparecem só no caderno): ${foraDaCapa.join(', ')}.`);
      }
    }

    if (!edicao.editorial) {
      erro('A edição não tem editorial.');
    } else {
      const editorial = materias.get(String(edicao.editorial));
      if (!editorial) erro(`Editorial "${edicao.editorial}" não existe.`);
      else {
        if (editorial.tipo !== 'editorial') erro(`"${edicao.editorial}" não é do tipo editorial.`);
        if (Number(editorial.edicao) !== numero) {
          erro(`Editorial pertence à edição ${editorial.edicao}, não à ${numero}.`);
        }
        if (editorial.status !== 'aprovada') erro('O editorial ainda é rascunho.');
      }
    }
  }

  if (paraPublicar) {
    if (edicao.status !== 'fechada' && edicao.status !== 'publicada') {
      erro(`Para publicar, a edição precisa estar "fechada" (está "${edicao.status}").`);
    }
    if (reportagens.length === 0) erro('A edição não tem nenhuma matéria.');
    const rascunhos = daEdicao.filter(([, m]) => m.status !== 'aprovada');
    if (rascunhos.length > 0) {
      aviso(
        `${rascunhos.length} texto(s) ainda em rascunho não irão ao ar: ` +
          rascunhos.map(([s]) => s).join(', '),
      );
    }
  }

  // ---- Relatório ----
  const rotulo = `Edição ${String(numero).padStart(3, '0')} (${edicao.status})`;
  console.log(`\n${rotulo} — ${daEdicao.length} texto(s), ${aprovadas.length} aprovado(s).\n`);

  if (avisos.length > 0) {
    console.log('Avisos:');
    avisos.forEach((a) => console.log(`  • ${a}`));
    console.log('');
  }

  if (erros.length > 0) {
    console.log('Erros que impedem seguir:');
    erros.forEach((e) => console.log(`  ✗ ${e}`));
    console.log('');
    process.exit(1);
  }

  console.log(paraPublicar ? '✓ Pronta para publicar.' : '✓ Sem erros.');
}

main().catch((erro) => {
  console.error(`Erro inesperado: ${erro.message}`);
  process.exit(1);
});
