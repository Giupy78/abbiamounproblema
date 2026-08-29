import { getCollection } from 'astro:content';

/**
 * Restituisce gli articoli pubblicabili, dal più recente al più vecchio.
 *
 * Esclude sempre le bozze. In sviluppo (npm run dev) le bozze restano
 * visibili, così puoi rileggerle prima di pubblicarle; nella versione
 * online non compaiono mai.
 */
export async function articoliPubblicati() {
	const tutti = await getCollection('articoli', ({ data }: { data: { bozza: boolean } }) => {
		return import.meta.env.PROD ? data.bozza === false : true;
	});

	return tutti.sort(
		(a: ArticoloBase, b: ArticoloBase) =>
			b.data.dataPubblicazione.valueOf() - a.data.dataPubblicazione.valueOf(),
	);
}

/**
 * L'articolo che apre la homepage.
 *
 * Di norma è il più recente: pubblicare un pezzo basta a portarlo in cima,
 * senza doversi ricordare di nessun interruttore. "In evidenza" serve solo
 * all'eccezione — trattenere in apertura un pezzo più vecchio — e per questo
 * può essere acceso su un articolo soltanto: due articoli in evidenza sono
 * due intenzioni in conflitto, e la compilazione si ferma invece di
 * sceglierne uno per conto proprio.
 */
export function articoloInPrimoPiano<T extends Evidenziabile>(articoli: T[]): T | undefined {
	const evidenziati = articoli.filter((a) => a.data.inEvidenza);

	if (evidenziati.length > 1) {
		const elenco = evidenziati.map((a) => `  · ${a.id}`).join('\n');
		throw new Error(
			`Ci sono ${evidenziati.length} articoli con "In evidenza" acceso, ma la homepage ne apre uno solo:\n\n${elenco}\n\n` +
				`Spegni l'interruttore su tutti tranne quello che vuoi in cima. Se lo spegni su tutti, ` +
				`in apertura va da sola la pubblicazione più recente: è quasi sempre quello che serve.`,
		);
	}

	return evidenziati[0] ?? articoli[0];
}

type Evidenziabile = { id: string; data: { inEvidenza?: boolean } };

/**
 * Le proposte pubblicabili, dalla più recente.
 * Come per gli articoli, le bozze restano visibili solo in locale.
 */
export async function propostePubblicate() {
	const tutte = await getCollection('proposte', ({ data }: { data: { bozza: boolean } }) => {
		return import.meta.env.PROD ? data.bozza === false : true;
	});

	return tutte.sort(
		(a: ArticoloBase, b: ArticoloBase) =>
			b.data.dataPubblicazione.valueOf() - a.data.dataPubblicazione.valueOf(),
	);
}

type ArticoloBase = { data: { dataPubblicazione: Date } };

/** Formatta una data in italiano esteso: "11 agosto 2026". */
export function dataEstesa(data: Date): string {
	return data.toLocaleDateString('it-IT', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

/** Formatta una data nel formato che leggono i motori di ricerca: "2026-08-11". */
export function dataMacchina(data: Date): string {
	return data.toISOString().split('T')[0]!;
}

/**
 * Stima i minuti di lettura a 200 parole al minuto, la media per l'italiano.
 * Serve a dare al lettore un'idea dell'impegno richiesto prima di iniziare.
 */
export function minutiLettura(testo: string): number {
	const parole = testo.trim().split(/\s+/).length;
	return Math.max(1, Math.round(parole / 200));
}

/** Trasforma "Società" in "societa", per usarlo negli indirizzi delle pagine. */
export function categoriaInUrl(categoria: string): string {
	return categoria
		.toLowerCase()
		.normalize('NFD')
		// Toglie gli accenti: dopo normalize() sono caratteri separati
		// nell'intervallo Unicode U+0300–U+036F.
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
