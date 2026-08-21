// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// EnseadaS — revista eletrônica semanal do Espírito Santo.
// Site publicado no GitHub Pages como project site: <site><base>/
export default defineConfig({
  site: 'https://jdougdanzi.github.io',
  base: '/enseadas',
  trailingSlash: 'always',
  integrations: [sitemap()],
  // A barra do Astro atrapalha a conferência visual das páginas em dev.
  devToolbar: { enabled: false },
  image: {
    // Fotos do Wikimedia chegam grandes; limitamos a largura útil da revista.
    responsiveStyles: true,
  },
  markdown: {
    smartypants: true,
  },
});
