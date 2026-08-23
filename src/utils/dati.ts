/**
 * Dati modificabili dal pannello.
 *
 * I file in src/dati/ sono scritti da Decap quando salvi dal pannello.
 * Qui vengono controllati prima di essere usati: se una modifica li rompe,
 * la compilazione si ferma con un messaggio in italiano invece di produrre
 * un sito con il menu vuoto o una pagina a metà.
 *
 * È la stessa protezione che vale per gli articoli, applicata alle
 * impostazioni: meglio un errore adesso che una pagina rotta online.
 */
import { z } from 'astro/zod';
import menuJson from '../dati/menu.json';
import meccanismiJson from '../dati/meccanismi.json';

/** Un indirizzo interno valido: inizia con "/" e non finisce con "/" (tranne la home). */
const indirizzoInterno = z
	.string()
	.min(1, 'L\'indirizzo non può essere vuoto.')
	.refine((v) => v.startsWith('/'), 'L\'indirizzo deve cominciare con "/" (esempio: /archivio).')
	.refine(
		(v) => v === '/' || !v.endsWith('/'),
		'Togli la barra finale: scrivi /archivio, non /archivio/.'
	);

const schemaMenu = z.object({
	voci: z
		.array(
			z.object({
				testo: z
					.string()
					.min(1, 'Ogni voce di menu deve avere un testo.')
					.max(24, 'Voce di menu troppo lunga: oltre i 24 caratteri manda a capo la barra.'),
				url: indirizzoInterno,
			})
		)
		.min(1, 'Il menu non può restare vuoto: serve almeno una voce.')
		.max(8, 'Più di 8 voci non ci stanno sulla barra: accorpane qualcuna.'),
});

const schemaMeccanismi = z.object({
	bozza: z.boolean(),
	titolo: z.string().min(5, 'Il titolo della pagina è troppo corto.'),
	descrizione: z
		.string()
		.min(70, 'Descrizione troppo corta: sotto i 70 caratteri Google la ignora.')
		.max(170, 'Descrizione troppo lunga: oltre i 170 caratteri Google la taglia.'),
	apertura: z.string().min(1, 'Il testo di apertura non può essere vuoto.'),
	catena: z
		.array(z.string().min(1))
		.min(2, 'La catena ha senso con almeno due passaggi.')
		.max(4, 'Più di quattro passaggi non si leggono in un colpo d’occhio.'),
	dopoCatena: z.string(),
	stadi: z
		.array(
			z.object({
				ruolo: z.string().min(1, 'Ogni stadio deve avere un ruolo (es. "La causa").'),
				titolo: z.string().min(1, 'Ogni stadio deve avere un titolo.'),
				sintesi: z.string().min(1, 'Ogni stadio deve avere una spiegazione.'),
				/** Nomi dei file degli articoli, senza estensione. */
				articoli: z.array(z.string()),
			})
		)
		.min(1, 'Serve almeno uno stadio.'),
	sezioni: z.array(
		z.object({
			titolo: z.string().min(1, 'Ogni sezione deve avere un titolo.'),
			testo: z.string().min(1, 'Ogni sezione deve avere un testo.'),
		})
	),
	domandeTitolo: z.string().min(1),
	domandeIntro: z.string().min(1),
	domande: z.array(
		z.object({
			domanda: z.string().min(1, 'Scrivi la domanda.'),
			nota: z.string(),
		})
	),
	chiusura: z.string(),
});

/** Controlla un file di dati e ferma la compilazione con un messaggio leggibile. */
function verifica<T>(schema: z.ZodType<T>, dati: unknown, nomeFile: string): T {
	const esito = schema.safeParse(dati);
	if (!esito.success) {
		const problemi = esito.error.issues
			.map((p) => `  • ${p.path.join(' → ') || 'file'}: ${p.message}`)
			.join('\n');
		throw new Error(
			`\n\nC'è un errore in src/dati/${nomeFile}:\n${problemi}\n\n` +
				`Correggilo dal pannello (sezione Impostazioni) e ripubblica.\n`
		);
	}
	return esito.data;
}

export const MENU = verifica(schemaMenu, menuJson, 'menu.json').voci;
export const MECCANISMI = verifica(schemaMeccanismi, meccanismiJson, 'meccanismi.json');
