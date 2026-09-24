// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { mappaLastmod } from './src/utils/lastmod';

// Letta una volta sola all'avvio, non per ognuno dei 75 URL della sitemap.
const LASTMOD = mappaLastmod();

// https://astro.build/config
export default defineConfig({
	// Indirizzo definitivo del sito: serve per generare URL canonici,
	// sitemap.xml e feed RSS con indirizzi assoluti corretti.
	site: 'https://abbiamounproblema.it',

	// URL senza barra finale: /caro-affitti e non /caro-affitti/
	trailingSlash: 'never',

	// Genera "caro-affitti.html" invece di "caro-affitti/index.html".
	//
	// Non è un dettaglio estetico: con le cartelle, Cloudflare Pages
	// reindirizza /caro-affitti a /caro-affitti/ con un 308, e i link
	// canonici (che non hanno la barra) punterebbero a un indirizzo che
	// rimanda altrove. Con i file singoli l'indirizzo servito coincide
	// esattamente con quello dichiarato ai motori di ricerca.
	build: { format: 'file' },

	integrations: [
		mdx(),
		sitemap({
			// Fuori dalla sitemap: la 404, le anteprime delle bozze e /social,
			// che è una pagina di servizio per chi scrive e non per chi legge
			// (è anche marcata noindex: lasciarla qui sarebbe contraddirsi).
			filter: (page) =>
				!page.includes('/404') &&
				!page.includes('/anteprima/') &&
				!page.endsWith('/social'),
			// La data vera di ogni pagina: vedi src/utils/lastmod.ts
			serialize(voce) {
				const quando = LASTMOD.get(new URL(voce.url).pathname);
				return quando ? { ...voce, lastmod: quando } : voce;
			},
		}),
	],

	markdown: {
		shikiConfig: { theme: 'github-light', wrap: true },
	},
});
