// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

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
			// Fuori dalla sitemap: la 404 e le anteprime delle bozze.
			// '/meccanismi' e' ancora una bozza: togli l'esclusione quando la pubblichi.
			filter: (page) =>
				!page.includes('/404') &&
				!page.includes('/anteprima/') &&
				!page.includes('/meccanismi'),
		}),
	],

	markdown: {
		shikiConfig: { theme: 'github-light', wrap: true },
	},
});
