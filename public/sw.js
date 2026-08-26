/**
 * Service worker: riceve le notifiche dei nuovi articoli.
 *
 * Gira in sottofondo nel browser di chi ha accettato, anche a sito chiuso.
 * Non ha accesso alla pagina né ai dati di chi naviga: sa solo mostrare
 * un avviso quando il sito ne manda uno.
 *
 * Le notifiche arrivano SENZA contenuto: il server dice soltanto "c'e'
 * qualcosa di nuovo", e il titolo dell'articolo lo va a leggere qui il
 * browser dal feed RSS. E' una scelta voluta: significa che il servizio
 * di consegna non vede mai cosa stiamo pubblicando, e ci evita di dover
 * cifrare il contenuto ad ogni invio.
 */

const SITO = 'Abbiamo un problema';

/** Legge dal feed l'articolo piu' recente. */
async function ultimoArticolo() {
	const risposta = await fetch('/rss.xml', { cache: 'no-store' });
	const testo = await risposta.text();

	// Il feed e' XML e nel service worker non c'e' un parser: bastano
	// due espressioni per il primo <item>, che e' sempre il piu' recente.
	const primo = testo.split('<item>')[1] || '';
	const titolo = (primo.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1];
	const link = (primo.match(/<link>([\s\S]*?)<\/link>/) || [])[1];

	return {
		titolo: (titolo || 'Nuovo articolo').trim(),
		link: (link || '/').trim(),
	};
}

self.addEventListener('push', (evento) => {
	evento.waitUntil(
		(async () => {
			let dati = { titolo: 'Nuovo articolo', link: '/' };
			try {
				dati = await ultimoArticolo();
			} catch {
				// Se il feed non risponde si avvisa lo stesso, con il titolo generico:
				// meglio una notifica scarna che una notifica persa.
			}

			await self.registration.showNotification(SITO, {
				body: dati.titolo,
				icon: '/favicon.svg',
				badge: '/favicon.svg',
				// Un solo avviso alla volta: se ne arrivano due, il secondo
				// sostituisce il primo invece di accumularsi.
				tag: 'nuovo-articolo',
				renotify: true,
				data: { link: dati.link },
			});
		})()
	);
});

self.addEventListener('notificationclick', (evento) => {
	evento.notification.close();
	const destinazione = evento.notification.data?.link || '/';

	evento.waitUntil(
		(async () => {
			const finestre = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true,
			});

			// Se il sito e' gia' aperto si riusa quella scheda invece di
			// aprirne una nuova ogni volta.
			for (const finestra of finestre) {
				if (finestra.url.includes(self.location.origin) && 'focus' in finestra) {
					await finestra.focus();
					return finestra.navigate ? finestra.navigate(destinazione) : undefined;
				}
			}

			await self.clients.openWindow(destinazione);
		})()
	);
});
