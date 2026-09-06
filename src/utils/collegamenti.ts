import { getCollection } from 'astro:content';
import { CATEGORIE } from '../config';
import { MECCANISMI } from './dati';
import { categoriaInUrl } from './articoli';

/**
 * Controlla che nessun contenuto pubblicato rimandi a una pagina che sul
 * sito online non esiste.
 *
 * È il difetto che è già capitato tre volte: si pubblica un pezzo dal
 * pannello e ci si dimentica di quello a cui rimanda, che resta in bozza.
 * In locale non si vede niente, perché in sviluppo le bozze sono visibili;
 * online quei link portano a una pagina 404, e li trova il lettore prima
 * di noi.
 *
 * Guarda i collegamenti fra articoli, quelli verso le proposte e quelli
 * verso le pagine fisse: sono tutte cose che possono essere in bozza.
 * Vale solo in produzione, perché in sviluppo la bozza c'è davvero.
 */
let giaVerificato = false;

/** Pagine che esistono sempre, indipendentemente dai contenuti. */
const PAGINE_FISSE = new Set([
	'/',
	'/proposte',
	'/archivio',
	'/chi-sono',
	'/contatti',
	'/privacy',
]);

export async function verificaCollegamenti() {
	if (giaVerificato || !import.meta.env.PROD) return;
	giaVerificato = true;

	const articoli = (await getCollection('articoli')) as any[];
	const proposte = (await getCollection('proposte')) as any[];

	// Tutto ciò a cui un link può puntare senza rompersi.
	const valide = new Set<string>(PAGINE_FISSE);
	for (const categoria of CATEGORIE) valide.add(`/categoria/${categoriaInUrl(categoria)}`);
	if (!MECCANISMI.bozza) valide.add('/meccanismi');

	// E tutto ciò che esiste ma è ancora nascosto: serve a distinguere
	// "l'hai lasciato in bozza" da "questo indirizzo non esiste proprio",
	// che sono due errori con due rimedi diversi.
	const inBozza = new Set<string>();
	if (MECCANISMI.bozza) inBozza.add('/meccanismi');

	for (const articolo of articoli) {
		(articolo.data.bozza ? inBozza : valide).add(`/${articolo.id}`);
	}
	for (const proposta of proposte) {
		(proposta.data.bozza ? inBozza : valide).add(`/proposte/${proposta.id}`);
	}

	const rotti: string[] = [];
	const pubblicati = [
		...articoli.filter((a) => !a.data.bozza).map((a) => ({ dove: a.id, testo: a.body })),
		...proposte
			.filter((p) => !p.data.bozza)
			.map((p) => ({ dove: `proposte/${p.id}`, testo: p.body })),
	];

	for (const { dove, testo } of pubblicati) {
		const trovati: string[] = testo?.match(/\]\(\/[^)\s]*\)/g) ?? [];

		for (const grezzo of new Set(trovati)) {
			// Da "](/percorso#ancora)" a "/percorso".
			const meta = grezzo.slice(2, -1).split('#')[0]!.replace(/\/$/, '') || '/';
			if (valide.has(meta)) continue;

			rotti.push(
				inBozza.has(meta)
					? `  · "${dove}" rimanda a "${meta}", che è ancora in bozza`
					: `  · "${dove}" rimanda a "${meta}", che non esiste`,
			);
		}
	}

	if (rotti.length > 0) {
		throw new Error(
			`Ci sono ${rotti.length} collegamenti che online porterebbero a una pagina inesistente:\n\n` +
				`${rotti.join('\n')}\n\n` +
				`Se la pagina è in bozza, pubblicala: nel pannello aprila e spegni l'interruttore Bozza. ` +
				`Se invece il link è sbagliato, correggilo.\n` +
				`Finché non è a posto il sito online resta quello di prima, così nessuno trova un link rotto.`,
		);
	}
}
