/**
 * Configurazione centrale del sito.
 *
 * È l'unico file da modificare per cambiare nome, descrizione, dati
 * dell'autore e link social: tutto il resto del sito legge da qui.
 *
 * >>> DA COMPILARE: sostituisci i valori segnati con "DA COMPILARE". <<<
 */

export const SITO = {
	nome: 'Abbiamo un problema',
	dominio: 'https://abbiamounproblema.it',

	/** Usata nella homepage e come meta description di default. 140-160 caratteri. */
	descrizione:
		'Analisi e opinioni sui temi che riguardano tutti: economia, società, ambiente, tecnologia. Un problema alla volta, spiegato per intero.',

	/** Sottotitolo mostrato sotto il nome nell'intestazione. */
	slogan: 'I problemi di tutti, spiegati per intero',

	lingua: 'it-IT',

	/**
	 * Google valuta l'affidabilità dell'autore (criteri E-E-A-T): nome reale,
	 * biografia credibile e firma su ogni articolo pesano sul posizionamento
	 * di un sito di attualità. Non lasciare questi campi generici.
	 */
	autore: {
		nome: 'DA COMPILARE — Nome Cognome',
		ruolo: 'DA COMPILARE — es. "Autore e curatore del sito"',
		bio: 'DA COMPILARE — due o tre righe che spiegano chi scrive e perché si occupa di questi temi.',
		email: 'DA COMPILARE — es. redazione@abbiamounproblema.it',
	},

	/** Lascia la stringa vuota per nascondere il link. */
	social: {
		x: '',
		facebook: '',
		linkedin: '',
		instagram: '',
	},

	/**
	 * Immagine mostrata quando un link del sito viene condiviso su
	 * WhatsApp, Facebook, X o LinkedIn. Deve essere 1200x630 pixel.
	 */
	immagineCondivisione: '/og-default.png',

	/**
	 * Sostegno dei lettori.
	 *
	 * Finché "url" resta vuoto, il link non compare da nessuna parte:
	 * niente riquadri vuoti sul sito. Appena incolli il tuo indirizzo
	 * (es. https://ko-fi.com/tuonome) compare nel piè di pagina e in
	 * fondo a ogni articolo.
	 *
	 * A differenza della pubblicità, questo non installa cookie e non
	 * richiede alcun banner di consenso.
	 */
	donazioni: {
		url: '',
		piattaforma: 'Ko-fi',
		invito: 'Questo sito è gratuito e senza contenuti a pagamento. Se quello che leggi ti è utile, puoi contribuire a tenerlo in piedi.',
		testoPulsante: 'Sostieni il sito',
	},
} as const;

/**
 * Categorie del sito.
 *
 * Sono un elenco chiuso: se in un articolo scrivi una categoria che non è
 * qui dentro, la compilazione si ferma con un errore. È voluto — evita che
 * "Società" e "Societa" diventino due categorie diverse e frammentino il sito
 * agli occhi di Google.
 *
 * Per aggiungerne una, scrivila qui e sarà subito attiva ovunque.
 */
export const CATEGORIE = [
	'Economia',
	'Finanza personale',
	'Società',
	'Ambiente ed Energia',
] as const;

export type Categoria = (typeof CATEGORIE)[number];

/** Voci del menu principale. */
export const MENU = [
	{ testo: 'Home', url: '/' },
	{ testo: 'Archivio', url: '/archivio' },
	{ testo: 'Chi sono', url: '/chi-sono' },
	{ testo: 'Contatti', url: '/contatti' },
] as const;

/**
 * Indirizzi già occupati dalle pagine fisse del sito.
 * Un articolo NON può usare uno di questi come nome del file, altrimenti
 * si sovrappone a una pagina esistente.
 */
export const SLUG_RISERVATI = [
	'archivio',
	'categoria',
	'chi-sono',
	'contatti',
	'privacy',
	'404',
	'rss.xml',
	'sitemap-index.xml',
] as const;
