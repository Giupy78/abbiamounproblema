/**
 * Manda a tutti gli iscritti l'avviso che c'e' un articolo nuovo.
 *
 * Va chiamata a mano dopo aver pubblicato, con la parola d'ordine del
 * sito. Non e' automatica di proposito: cosi' decidi tu quali articoli
 * meritano una notifica e quali no.
 *
 *   https://abbiamounproblema.it/api/invia-notifica?parola=LA_TUA_PAROLA
 *
 * L'avviso viaggia SENZA contenuto: dice solo "c'e' qualcosa di nuovo",
 * e il titolo lo legge il browser dal feed RSS. Significa che i servizi
 * di consegna (Google, Mozilla, Apple) non vedono mai cosa pubblichiamo,
 * e che non serve cifrare nulla ad ogni invio.
 *
 * Servono, impostate nel progetto Cloudflare Pages:
 *   ISCRIZIONI            l'archivio KV con gli iscritti
 *   CHIAVE_NOTIFICHE_PUB  la chiave pubblica (la stessa del sito)
 *   CHIAVE_NOTIFICHE_PRIV la chiave privata, che resta solo qui
 *   PAROLA_NOTIFICHE      la parola d'ordine per poter inviare
 *   EMAIL_NOTIFICHE       un recapito, richiesto dallo standard
 */

const encoder = new TextEncoder();

function inBase64Url(byte) {
	return btoa(String.fromCharCode(...new Uint8Array(byte)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

function daBase64Url(testo) {
	const completo = (testo + '='.repeat((4 - (testo.length % 4)) % 4))
		.replace(/-/g, '+')
		.replace(/_/g, '/');
	return Uint8Array.from([...atob(completo)].map((c) => c.charCodeAt(0)));
}

/**
 * Prepara la chiave per la firma.
 *
 * La chiave privata e' il solo numero "d"; le coordinate x e y si ricavano
 * da quella pubblica, che e' un punto non compresso di 65 byte: il primo
 * byte e' un marcatore, poi 32 byte di x e 32 di y.
 */
async function chiavePerFirmare(pubblica, privata) {
	const punto = daBase64Url(pubblica);

	return crypto.subtle.importKey(
		'jwk',
		{
			kty: 'EC',
			crv: 'P-256',
			x: inBase64Url(punto.slice(1, 33)),
			y: inBase64Url(punto.slice(33, 65)),
			d: privata,
			ext: true,
		},
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['sign']
	);
}

/** Costruisce il lasciapassare che dimostra al servizio di consegna chi siamo. */
async function lasciapassare(endpoint, env) {
	const chiave = await chiavePerFirmare(env.CHIAVE_NOTIFICHE_PUB, env.CHIAVE_NOTIFICHE_PRIV);

	const intestazione = inBase64Url(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
	const contenuto = inBase64Url(
		encoder.encode(
			JSON.stringify({
				aud: new URL(endpoint).origin,
				// Dodici ore: lo standard non ammette scadenze piu' lontane.
				exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
				sub: `mailto:${env.EMAIL_NOTIFICHE}`,
			})
		)
	);

	const daFirmare = `${intestazione}.${contenuto}`;
	const firma = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		chiave,
		encoder.encode(daFirmare)
	);

	return `${daFirmare}.${inBase64Url(firma)}`;
}

export async function onRequest({ request, env }) {
	const parolaAttesa = env.PAROLA_NOTIFICHE;
	const parolaRicevuta = new URL(request.url).searchParams.get('parola');

	if (!parolaAttesa || parolaRicevuta !== parolaAttesa) {
		return Response.json({ errore: 'Parola d ordine mancante o sbagliata.' }, { status: 401 });
	}

	const mancanti = [
		'ISCRIZIONI',
		'CHIAVE_NOTIFICHE_PUB',
		'CHIAVE_NOTIFICHE_PRIV',
		'EMAIL_NOTIFICHE',
	].filter((n) => !env[n]);

	if (mancanti.length > 0) {
		return Response.json(
			{ errore: `Manca la configurazione: ${mancanti.join(', ')}.` },
			{ status: 500 }
		);
	}

	let inviate = 0;
	let rimosse = 0;
	let fallite = 0;
	let cursore;

	do {
		const elenco = await env.ISCRIZIONI.list({ cursor: cursore });
		cursore = elenco.list_complete ? undefined : elenco.cursor;

		for (const voce of elenco.keys) {
			const grezza = await env.ISCRIZIONI.get(voce.name);
			if (!grezza) continue;

			const { endpoint } = JSON.parse(grezza);

			try {
				const risposta = await fetch(endpoint, {
					method: 'POST',
					headers: {
						TTL: '86400',
						Authorization: `vapid t=${await lasciapassare(endpoint, env)}, k=${env.CHIAVE_NOTIFICHE_PUB}`,
					},
				});

				if (risposta.ok) {
					inviate++;
				} else if (risposta.status === 404 || risposta.status === 410) {
					// Il browser ha revocato l'iscrizione o e' sparito:
					// si toglie dall'archivio invece di riprovarci per sempre.
					await env.ISCRIZIONI.delete(voce.name);
					rimosse++;
				} else {
					fallite++;
				}
			} catch {
				fallite++;
			}
		}
	} while (cursore);

	return Response.json({ inviate, rimosse, fallite });
}
