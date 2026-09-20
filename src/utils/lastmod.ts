/**
 * `lastmod` per la sitemap: la data vera di ogni pagina, non quella della build.
 *
 * Google usa `lastmod` finché lo trova attendibile, e se lo becca a mentire
 * smette di considerarlo per l'intero sito. Mettere la data di build su tutti
 * gli URL farebbe dichiarare a 75 pagine di cambiare a ogni deploy: è il modo
 * più rapido di buttare via il segnale proprio dove servirebbe.
 *
 * Qui lo schema dei contenuti ci dava già la risposta giusta:
 * `dataAggiornamento` quando l'articolo è stato rimesso mano, altrimenti
 * `dataPubblicazione`. È la stessa data che il sito mostra al lettore, quindi
 * non c'è modo che le due versioni si contraddicano.
 *
 * Le pagine ferme — chi-sono, contatti, privacy, meccanismi, tassi — restano
 * senza: cambiano solo quando tocchiamo il codice, e un `lastmod` assente non
 * costa niente mentre uno falso sì.
 *
 * I file si leggono da disco invece che con `getCollection`, perché questo
 * modulo gira dentro astro.config.mjs, prima che il content layer esista.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIE, categoriaInUrl } from '../config';

type Voce = {
	slug: string;
	data: string; // YYYY-MM-DD
	categoria: string;
};

/** Il blocco fra i due `---` in testa al file. */
function frontmatter(testo: string): string {
	if (!testo.startsWith('---')) return '';
	const fine = testo.indexOf('\n---', 3);
	return fine === -1 ? '' : testo.slice(3, fine);
}

function campo(fm: string, nome: string): string | undefined {
	return fm.match(new RegExp(`^${nome}:[ \t]*['"]?([^'"\n]+)`, 'm'))?.[1]?.trim();
}

function leggi(cartella: string): Voce[] {
	const dove = fileURLToPath(new URL(`../contenuti/${cartella}`, import.meta.url));
	if (!fs.existsSync(dove)) return [];

	return fs
		.readdirSync(dove)
		.filter((nome) => /\.mdx?$/.test(nome))
		.flatMap((nome) => {
			const fm = frontmatter(fs.readFileSync(path.join(dove, nome), 'utf8'));

			// Le bozze non vengono pubblicate, quindi non stanno in sitemap.
			if (/^bozza:[ \t]*true[ \t]*$/m.test(fm)) return [];

			// Se è stato aggiornato vale l'aggiornamento: è il senso del campo.
			const quando = campo(fm, 'dataAggiornamento') ?? campo(fm, 'dataPubblicazione');
			if (!quando || !/^\d{4}-\d{2}-\d{2}/.test(quando)) return [];

			return [
				{
					slug: nome.replace(/\.mdx?$/, ''),
					data: quando.slice(0, 10),
					categoria: campo(fm, 'categoria') ?? '',
				},
			];
		});
}

/**
 * Mappa via -> data. Le vie sono senza barra finale, come impone
 * `trailingSlash: 'never'` in astro.config.mjs.
 */
export function mappaLastmod(): Map<string, string> {
	const articoli = leggi('articoli');
	const proposte = leggi('proposte');
	const mappa = new Map<string, string>();

	const piuRecente = (lista: Voce[]) =>
		lista.reduce((max, v) => (v.data > max ? v.data : max), '');

	const segna = (via: string, lista: Voce[]) => {
		const quando = piuRecente(lista);
		if (quando) mappa.set(via, quando);
	};

	// La home mette in fila le ultime cose uscite, da tutte e due le raccolte.
	segna('/', [...articoli, ...proposte]);
	segna('/archivio', articoli);
	segna('/proposte', proposte);

	for (const articolo of articoli) {
		mappa.set(`/${articolo.slug}`, articolo.data);
	}

	for (const proposta of proposte) {
		mappa.set(`/proposte/${proposta.slug}`, proposta.data);
	}

	// Le pagine categoria esistono anche vuote: quelle senza articoli non
	// ricevono data, perché non c'è niente di cui dichiarare l'età.
	for (const categoria of CATEGORIE) {
		segna(
			`/categoria/${categoriaInUrl(categoria)}`,
			articoli.filter((a) => a.categoria === categoria),
		);
	}

	return mappa;
}
