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
		'Analisi e proposte sui problemi che riguardano tutti: economia, finanza personale, società, ambiente ed energia. Un problema alla volta, fino in fondo.',

	/** Sottotitolo mostrato sotto il nome nell'intestazione. */
	slogan: 'Dal problema alla proposta',

	lingua: 'it-IT',

	/**
	 * Google valuta l'affidabilità dell'autore (criteri E-E-A-T): nome reale,
	 * biografia credibile e firma su ogni articolo pesano sul posizionamento
	 * di un sito di attualità. Non lasciare questi campi generici.
	 */
	autore: {
		nome: 'La redazione',

		/**
		 * Come dichiarare la firma ai motori di ricerca.
		 * 'Organization' per una firma redazionale, 'Person' se un giorno
		 * deciderai di firmare con nome e cognome.
		 */
		tipo: 'Organization',

		ruolo: 'Analisi e proposte, un problema alla volta',

		bio: 'Scriviamo di economia, società e istituzioni con un metodo fisso: prima il problema, con i dati alla mano, poi una proposta concreta. Qui contano le idee e il modo in cui reggono alla verifica, non chi le firma.',

		/**
		 * Casella inoltrata da Cloudflare Email Routing verso la posta
		 * di servizio del sito. Lascia la stringa vuota per nascondere
		 * il recapito e mostrare al suo posto un messaggio di attesa.
		 */
		email: 'redazione@abbiamounproblema.it',
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
	'Istituzioni',
] as const;

export type Categoria = (typeof CATEGORIE)[number];

/**
 * Ambiti delle proposte, nella sezione /proposte.
 *
 * Sono più specifici delle categorie degli articoli: un articolo parla di
 * economia, una proposta interviene sul fisco o sulla giustizia. Aggiungine
 * pure, ricordandoti di allinearli in public/admin/config.yml.
 */
export const AMBITI = [
	'Burocrazia',
	'Fisco',
	'Giustizia',
	'Lavoro',
	'Sanità',
	'Scuola',
	'Energia',
	'Trasporti',
	'Istituzioni',
	'Ambiente',
	'Conti pubblici',
	'Credito e risparmio',
	'Welfare',
] as const;

/**
 * A che punto è una proposta.
 *
 * "Già applicata altrove" è lo stato più prezioso: una misura che in un
 * altro Paese funziona da anni è molto più difficile da liquidare come
 * utopia. Usalo solo quando puoi linkare la norma straniera.
 */
export const STATI_PROPOSTA = [
	'Proposta',
	'In discussione',
	'Già applicata altrove',
	'Realizzata',
] as const;

export const DIFFICOLTA = ['Bassa', 'Media', 'Alta'] as const;

/**
 * Illustrazioni disponibili per l'apertura degli articoli.
 * Sono disegnate in src/components/Illustrazione.astro: per aggiungerne
 * una, disegnala lì e poi scrivi qui il suo nome.
 */
export const ILLUSTRAZIONI = [
	'metodo',
	'imbuto',
	'pila',
	'palazzina',
	'calendario',
	'bilancia',
	'catena',
	'crepa',
	'sportelli',
	'risparmi',
	'bolletta',
	'generazioni',
	'pensione',
] as const;

/** Voci del menu principale. */
export const MENU = [
	{ testo: 'Home', url: '/' },
	{ testo: 'Le proposte', url: '/proposte' },
	{ testo: 'Archivio', url: '/archivio' },
	{ testo: 'Chi siamo', url: '/chi-sono' },
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
	'proposte',
	'anteprima',
	'chi-sono',
	'contatti',
	'privacy',
	'404',
	'rss.xml',
	'sitemap-index.xml',
] as const;
