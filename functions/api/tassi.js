/**
 * I tassi, presi dal portale dati della BCE e tenuti freschi.
 *
 * Il sito è statico: se i numeri stessero nelle pagine si fermerebbero al
 * giorno dell'ultima pubblicazione. Questa funzione invece li chiede alla
 * BCE quando servono e li tiene in cache sei ore, così la pagina mostra
 * sempre l'ultimo dato disponibile senza dover ricostruire il sito.
 *
 * Perché la BCE e non le fonti che pubblicano l'Euribor giornaliero:
 * l'Euribor è un dato di proprietà dell'EMMI e ridistribuirlo su un sito
 * pubblico richiede un abbonamento. Le medie mensili pubblicate dalla BCE
 * sono invece dati statistici riutilizzabili, e l'€STR — il tasso che la
 * BCE calcola da sé — è giornaliero e libero.
 */

const PORTALE = 'https://data-api.ecb.europa.eu/service/data';

const SERIE = {
	ester: { flusso: 'EST', chiave: 'B.EU000A2X2A25.WT', quante: 260 },
	bce: { flusso: 'FM', chiave: 'D.U2.EUR.4F.KR.DFR.LEV', quante: 520 },
	decennale: { flusso: 'YC', chiave: 'B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y', quante: 260 },
	euribor1m: { flusso: 'FM', chiave: 'M.U2.EUR.RT.MM.EURIBOR1MD_.HSTA', quante: 36 },
	euribor3m: { flusso: 'FM', chiave: 'M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA', quante: 36 },
	euribor6m: { flusso: 'FM', chiave: 'M.U2.EUR.RT.MM.EURIBOR6MD_.HSTA', quante: 36 },
	euribor12m: { flusso: 'FM', chiave: 'M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA', quante: 36 },
};

/** Divide una riga CSV rispettando le virgolette: i titoli contengono virgole. */
function dividiRiga(riga) {
	const campi = [];
	let corrente = '';
	let dentroVirgolette = false;

	for (let i = 0; i < riga.length; i++) {
		const carattere = riga[i];
		if (carattere === '"') {
			if (dentroVirgolette && riga[i + 1] === '"') {
				corrente += '"';
				i++;
			} else {
				dentroVirgolette = !dentroVirgolette;
			}
		} else if (carattere === ',' && !dentroVirgolette) {
			campi.push(corrente);
			corrente = '';
		} else {
			corrente += carattere;
		}
	}
	campi.push(corrente);
	return campi;
}

/** Da CSV della BCE a coppie data/valore, dalla più vecchia alla più recente. */
function leggiOsservazioni(csv) {
	const righe = csv.trim().split('\n');
	if (righe.length < 2) return [];

	const intestazione = dividiRiga(righe[0]);
	const colonnaData = intestazione.indexOf('TIME_PERIOD');
	const colonnaValore = intestazione.indexOf('OBS_VALUE');
	if (colonnaData === -1 || colonnaValore === -1) return [];

	const osservazioni = [];
	for (const riga of righe.slice(1)) {
		const campi = dividiRiga(riga);
		const valore = Number.parseFloat(campi[colonnaValore]);
		if (!campi[colonnaData] || Number.isNaN(valore)) continue;
		osservazioni.push({ d: campi[colonnaData], v: Math.round(valore * 1000) / 1000 });
	}
	return osservazioni;
}

async function scarica({ flusso, chiave, quante }) {
	const indirizzo = `${PORTALE}/${flusso}/${chiave}?lastNObservations=${quante}&format=csvdata`;
	const risposta = await fetch(indirizzo, {
		headers: { Accept: 'text/csv' },
		cf: { cacheTtl: 3600, cacheEverything: true },
	});
	if (!risposta.ok) throw new Error(`${flusso} ha risposto ${risposta.status}`);
	return leggiOsservazioni(await risposta.text());
}

export async function onRequest(context) {
	const cache = caches.default;
	const chiaveCache = new Request(new URL(context.request.url).toString(), { method: 'GET' });

	const inCache = await cache.match(chiaveCache);
	if (inCache) return inCache;

	const nomi = Object.keys(SERIE);
	const risultati = await Promise.allSettled(nomi.map((nome) => scarica(SERIE[nome])));

	const serie = {};
	const mancanti = [];
	risultati.forEach((esito, i) => {
		if (esito.status === 'fulfilled' && esito.value.length > 0) {
			serie[nomi[i]] = esito.value;
		} else {
			mancanti.push(nomi[i]);
		}
	});

	// Se non è arrivato niente è meglio dirlo che servire una pagina vuota.
	if (Object.keys(serie).length === 0) {
		return new Response(
			JSON.stringify({ errore: 'Il portale dati della BCE non risponde.' }),
			{ status: 503, headers: { 'content-type': 'application/json; charset=utf-8' } },
		);
	}

	const corpo = JSON.stringify({
		aggiornato: new Date().toISOString(),
		fonte: 'BCE — ECB Data Portal',
		mancanti,
		serie,
	});

	const risposta = new Response(corpo, {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			// Sei ore: i dati BCE escono una volta al giorno, non serve di più.
			'cache-control': 'public, max-age=21600, s-maxage=21600',
		},
	});

	context.waitUntil(cache.put(chiaveCache, risposta.clone()));
	return risposta;
}
