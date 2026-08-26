/**
 * Reindirizza il dominio di servizio verso quello vero.
 *
 * Cloudflare assegna a ogni progetto un indirizzo <progetto>.pages.dev che
 * serve una copia identica del sito. Per un motore di ricerca sono due siti
 * uguali, e le visite del crawler — su un dominio giovane poche e preziose —
 * finiscono in parte su quello sbagliato.
 *
 * Il file _redirects non puo' farlo: la documentazione di Cloudflare dice
 * esplicitamente che i reindirizzamenti a livello di dominio non sono
 * supportati li dentro. Serve una funzione, che gira prima di ogni richiesta.
 *
 * ATTENZIONE: questo file intercetta OGNI richiesta al sito, comprese
 * /api/auth e /api/callback che fanno funzionare il pannello di scrittura.
 * Per questo tocca solo l'unico caso che deve toccare e per tutto il resto
 * si fa da parte immediatamente con next().
 */

/** L'indirizzo di produzione assegnato da Cloudflare. */
const DOMINIO_DI_SERVIZIO = 'abbiamounproblema.pages.dev';

/** Il dominio vero, quello che deve comparire nei motori di ricerca. */
const DOMINIO_VERO = 'abbiamounproblema.it';

export async function onRequest(context) {
	const url = new URL(context.request.url);

	// Solo l'indirizzo di produzione. Le anteprime di Cloudflare
	// (<codice>.abbiamounproblema.pages.dev) restano raggiungibili, cosi'
	// si puo' ancora controllare una modifica prima che vada online.
	if (url.hostname !== DOMINIO_DI_SERVIZIO) {
		return context.next();
	}

	url.hostname = DOMINIO_VERO;

	// 301: lo spostamento e' definitivo, l'autorita' va al dominio di arrivo.
	return Response.redirect(url.toString(), 301);
}
