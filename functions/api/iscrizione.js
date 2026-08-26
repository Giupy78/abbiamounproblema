/**
 * Registra un browser che vuole ricevere le notifiche.
 *
 * Riceve l'iscrizione creata dal browser e la conserva nell'archivio
 * ISCRIZIONI di Cloudflare. Non contiene nome, email o altro: e' un
 * indirizzo di consegna generato dal browser, che il lettore puo'
 * revocare in qualsiasi momento dalle impostazioni del sito.
 *
 * Serve un archivio KV chiamato ISCRIZIONI, collegato al progetto
 * Cloudflare Pages. Senza quello questa funzione risponde con un errore
 * chiaro invece di fallire in silenzio.
 */

/** Un identificativo stabile ricavato dall'indirizzo di consegna. */
async function chiave(endpoint) {
	const impronta = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
	return [...new Uint8Array(impronta)]
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
		.slice(0, 32);
}

export async function onRequestPost({ request, env }) {
	if (!env.ISCRIZIONI) {
		return Response.json(
			{ errore: "L'archivio delle iscrizioni non e' collegato al progetto." },
			{ status: 500 }
		);
	}

	let iscrizione;
	try {
		iscrizione = await request.json();
	} catch {
		return Response.json({ errore: 'Richiesta non leggibile.' }, { status: 400 });
	}

	// Controllo minimo di forma: deve avere l'indirizzo di consegna e le
	// due chiavi con cui il browser riconosce i messaggi come autentici.
	const valida =
		typeof iscrizione?.endpoint === 'string' &&
		iscrizione.endpoint.startsWith('https://') &&
		typeof iscrizione?.keys?.p256dh === 'string' &&
		typeof iscrizione?.keys?.auth === 'string';

	if (!valida) {
		return Response.json({ errore: 'Iscrizione incompleta.' }, { status: 400 });
	}

	await env.ISCRIZIONI.put(
		await chiave(iscrizione.endpoint),
		JSON.stringify({ ...iscrizione, iscrittoIl: new Date().toISOString() })
	);

	return Response.json({ esito: 'iscritto' }, { status: 201 });
}
