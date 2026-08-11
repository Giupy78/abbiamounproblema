/**
 * Secondo passo dell'accesso al pannello di scrittura.
 *
 * GitHub, dopo che hai autorizzato, rimanda qui con un codice temporaneo.
 * Questo file lo scambia con un permesso di accesso e lo consegna al
 * pannello, che da quel momento puo salvare gli articoli sul repository.
 *
 * Lo scambio avviene qui su Cloudflare proprio perche richiede il codice
 * segreto dell'applicazione, che non deve mai arrivare al browser.
 */

/** Evita che testo proveniente dall'esterno possa iniettare codice nella pagina. */
function perHtml(testo) {
	return String(testo).replace(/[&<>"']/g, (c) => {
		return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
	});
}

function paginaEsito(messaggio) {
	// Il pannello aspetta questo scambio di messaggi dalla finestra di accesso.
	const html = `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><title>Accesso in corso…</title></head>
<body style="font-family: system-ui, sans-serif; padding: 2rem">
<p>Accesso completato. Puoi chiudere questa finestra.</p>
<script>
  (function () {
    var messaggio = ${JSON.stringify(messaggio)};
    function rispondi(evento) {
      window.opener.postMessage(messaggio, evento.origin);
      window.removeEventListener('message', rispondi, false);
    }
    window.addEventListener('message', rispondi, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body>
</html>`;

	return new Response(html, {
		headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
	});
}

function paginaErrore(spiegazione) {
	const html = `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><title>Accesso non riuscito</title></head>
<body style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 40rem">
<h1>Accesso non riuscito</h1>
<p>${perHtml(spiegazione)}</p>
<p>Chiudi questa finestra e riprova. Se l'errore si ripete, controlla che nelle
impostazioni del progetto su Cloudflare siano presenti le variabili
<code>GITHUB_CLIENT_ID</code> e <code>GITHUB_CLIENT_SECRET</code>, e che
l'indirizzo di ritorno configurato su GitHub coincida con quello di questo sito.</p>
</body>
</html>`;

	return new Response(html, {
		status: 400,
		headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
	});
}

export async function onRequest({ request, env }) {
	const url = new URL(request.url);
	const codice = url.searchParams.get('code');
	const stato = url.searchParams.get('state');

	if (url.searchParams.get('error')) {
		return paginaErrore(`GitHub ha rifiutato la richiesta: ${url.searchParams.get('error')}`);
	}

	if (!codice || !stato) {
		return paginaErrore('La risposta di GitHub e incompleta.');
	}

	const statoAtteso = (request.headers.get('Cookie') || '').match(/cms_stato=([^;]+)/)?.[1];
	if (!statoAtteso || stato !== statoAtteso) {
		return paginaErrore(
			'Controllo di sicurezza non superato: la richiesta non corrisponde a quella iniziata da questo sito.',
		);
	}

	if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
		return paginaErrore(
			'Mancano le variabili GITHUB_CLIENT_ID o GITHUB_CLIENT_SECRET nelle impostazioni del progetto.',
		);
	}

	let dati;
	try {
		const risposta = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({
				client_id: env.GITHUB_CLIENT_ID,
				client_secret: env.GITHUB_CLIENT_SECRET,
				code: codice,
				redirect_uri: `${url.origin}/api/callback`,
			}),
		});
		dati = await risposta.json();
	} catch {
		return paginaErrore('Non e stato possibile contattare GitHub.');
	}

	if (!dati || !dati.access_token) {
		return paginaErrore(
			`GitHub non ha rilasciato il permesso di accesso${dati?.error ? ` (${dati.error})` : ''}.`,
		);
	}

	const messaggio =
		'authorization:github:success:' +
		JSON.stringify({ token: dati.access_token, provider: 'github' });

	return paginaEsito(messaggio);
}
