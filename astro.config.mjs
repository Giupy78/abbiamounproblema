// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	// Indirizzo definitivo del sito: serve per generare URL canonici,
	// sitemap.xml e feed RSS con indirizzi assoluti corretti.
	site: 'https://abbiamounproblema.it',

	// Cloudflare Pages serve le pagine senza barra finale e reindirizza
	// /articolo/ -> /articolo. Teniamo Astro allineato a quel comportamento,
	// altrimenti i link canonici non coincidono con gli URL reali.
	trailingSlash: 'never',

	integrations: [
		mdx(),
		sitemap({
			// La pagina 404 non deve finire nella sitemap.
			filter: (page) => !page.includes('/404'),
		}),
	],

	markdown: {
		shikiConfig: { theme: 'github-light', wrap: true },
	},
});
