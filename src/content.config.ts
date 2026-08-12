import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIE, AMBITI, STATI_PROPOSTA, DIFFICOLTA } from './config';

/**
 * Struttura di un articolo.
 *
 * Ogni campo qui sotto corrisponde a una riga dell'intestazione dei file
 * in src/contenuti/articoli/. I limiti di lunghezza non sono decorativi:
 * sono le soglie oltre le quali Google taglia il testo nei risultati di
 * ricerca. Se sfori, la compilazione si ferma e ti dice quale articolo
 * correggere — è il "semaforo" di Yoast, ma che blocca davvero.
 */
const articoli = defineCollection({
	loader: glob({
		pattern: '**/*.{md,mdx}',
		base: './src/contenuti/articoli',
	}),
	schema: ({ image }) =>
		z.object({
			/** Titolo dell'articolo. Compare come <h1> e come titolo su Google. */
			titolo: z
				.string()
				.min(15, 'Titolo troppo corto: sotto i 15 caratteri non dice abbastanza.')
				.max(70, 'Titolo troppo lungo: oltre i 70 caratteri Google lo taglia nei risultati.'),

			/**
			 * Titolo alternativo per i motori di ricerca, facoltativo.
			 *
			 * Serve quando il titolo in pagina è evocativo ma poco cercato:
			 * qui metti le parole che la gente digita davvero. Se lo lasci
			 * vuoto viene usato il titolo normale.
			 *
			 * Il limite è 38 caratteri perché il sito aggiunge in coda
			 * " | Abbiamo un problema": oltre quella soglia Google taglia.
			 */
			titoloSeo: z
				.string()
				.max(38, 'Con il nome del sito in coda supererebbe i 60 caratteri e Google lo taglierebbe.')
				.optional(),

			/**
			 * Il testo grigio sotto il titolo nei risultati di ricerca.
			 * Non influenza il posizionamento ma decide se la gente clicca.
			 */
			descrizione: z
				.string()
				.min(70, 'Descrizione troppo corta: stai sprecando spazio nei risultati di ricerca.')
				.max(170, 'Descrizione troppo lunga: oltre i 170 caratteri Google la taglia.'),

			dataPubblicazione: z.coerce.date(),

			/**
			 * Da valorizzare quando modifichi un articolo già pubblicato.
			 * Google mostra questa data nei risultati e premia i contenuti
			 * mantenuti aggiornati.
			 */
			dataAggiornamento: z.coerce.date().optional(),

			categoria: z.enum(CATEGORIE),

			tag: z.array(z.string()).default([]),

			/**
			 * Percorso dell'immagine di copertina, relativo al file dell'articolo.
			 * Astro la converte automaticamente in WebP e la ridimensiona.
			 */
			immagine: image().optional(),

			/** Descrizione dell'immagine per chi non la può vedere. Obbligatoria se c'è l'immagine. */
			immagineAlt: z.string().optional(),

			/** Se true l'articolo è visibile solo in locale, non viene pubblicato. */
			bozza: z.boolean().default(false),

			/** Se true l'articolo viene messo in evidenza in cima alla homepage. */
			inEvidenza: z.boolean().default(false),
		})
			.refine((dati) => !dati.immagine || (dati.immagineAlt && dati.immagineAlt.length > 0), {
				message:
					"Hai messo un'immagine ma non il campo immagineAlt. Serve per l'accessibilità e per la SEO delle immagini.",
				path: ['immagineAlt'],
			})
			.refine(
				(dati) => !dati.dataAggiornamento || dati.dataAggiornamento >= dati.dataPubblicazione,
				{
					message: 'La data di aggiornamento non può essere precedente alla pubblicazione.',
					path: ['dataAggiornamento'],
				},
			),
});

/**
 * Le proposte.
 *
 * Un articolo diagnostica un problema; una proposta dice cosa fare.
 * Vivono separate perché hanno vite diverse: un articolo invecchia,
 * una proposta resta valida finché il problema non è risolto, e va
 * aggiornata quando qualcosa si muove.
 */
const proposte = defineCollection({
	loader: glob({
		pattern: '**/*.{md,mdx}',
		base: './src/contenuti/proposte',
	}),
	schema: z.object({
		titolo: z
			.string()
			.min(15, 'Titolo troppo corto.')
			.max(70, 'Titolo troppo lungo: oltre i 70 caratteri Google lo taglia.'),

		titoloSeo: z
			.string()
			.max(38, 'Con il nome del sito in coda supererebbe i 60 caratteri.')
			.optional(),

		descrizione: z
			.string()
			.min(70, 'Descrizione troppo corta.')
			.max(170, 'Descrizione troppo lunga: oltre i 170 caratteri Google la taglia.'),

		/** Il guasto, in una frase. È la riga che il lettore legge per prima. */
		problema: z
			.string()
			.min(30, 'Il problema va spiegato in una frase compiuta.')
			.max(220, 'Tienilo in una frase: il resto va nel corpo della proposta.'),

		ambito: z.enum(AMBITI),
		stato: z.enum(STATI_PROPOSTA),
		difficolta: z.enum(DIFFICOLTA),

		origine: z
			.enum(['Analisi della redazione', 'Segnalazione di un lettore'])
			.default('Analisi della redazione'),

		/** Nome del file dell'articolo da cui nasce, senza estensione. */
		articoloCollegato: z.string().optional(),

		dataPubblicazione: z.coerce.date(),
		dataAggiornamento: z.coerce.date().optional(),

		bozza: z.boolean().default(false),
	}),
});

export const collections = { articoli, proposte };
