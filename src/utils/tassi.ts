/**
 * I tassi presi dalla BCE al momento della compilazione.
 *
 * Serve a due cose: far vedere la pagina anche in sviluppo, dove le
 * funzioni di Cloudflare non girano, e mettere i numeri dentro l'HTML
 * così la pagina si legge anche senza JavaScript. Online poi il pezzo
 * vivo lo fa functions/api/tassi.js, che li rinfresca ogni sei ore.
 *
 * Le definizioni delle serie sono ripetute lì: la funzione viene
 * impacchettata da Cloudflare separatamente dal sito e non può importare
 * da qui. Se ne aggiungi una, va aggiunta in tutti e due i posti.
 */

const PORTALE = 'https://data-api.ecb.europa.eu/service/data';

export const SERIE = {
	ester: { flusso: 'EST', chiave: 'B.EU000A2X2A25.WT', quante: 260 },
	bce: { flusso: 'FM', chiave: 'D.U2.EUR.4F.KR.DFR.LEV', quante: 520 },
	decennale: { flusso: 'YC', chiave: 'B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y', quante: 260 },
	euribor1m: { flusso: 'FM', chiave: 'M.U2.EUR.RT.MM.EURIBOR1MD_.HSTA', quante: 36 },
	euribor3m: { flusso: 'FM', chiave: 'M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA', quante: 36 },
	euribor6m: { flusso: 'FM', chiave: 'M.U2.EUR.RT.MM.EURIBOR6MD_.HSTA', quante: 36 },
	euribor12m: { flusso: 'FM', chiave: 'M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA', quante: 36 },
} as const;

export type Osservazione = { d: string; v: number };
export type Tassi = {
	aggiornato: string;
	serie: Partial<Record<keyof typeof SERIE, Osservazione[]>>;
	mancanti: string[];
};

function dividiRiga(riga: string): string[] {
	const campi: string[] = [];
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

function leggiOsservazioni(csv: string): Osservazione[] {
	const righe = csv.trim().split('\n');
	if (righe.length < 2) return [];

	const intestazione = dividiRiga(righe[0]!);
	const colonnaData = intestazione.indexOf('TIME_PERIOD');
	const colonnaValore = intestazione.indexOf('OBS_VALUE');
	if (colonnaData === -1 || colonnaValore === -1) return [];

	const osservazioni: Osservazione[] = [];
	for (const riga of righe.slice(1)) {
		const campi = dividiRiga(riga);
		const valore = Number.parseFloat(campi[colonnaValore] ?? '');
		if (!campi[colonnaData] || Number.isNaN(valore)) continue;
		osservazioni.push({ d: campi[colonnaData]!, v: Math.round(valore * 1000) / 1000 });
	}
	return osservazioni;
}

/**
 * Chiede alla BCE tutte le serie. Se il portale non risponde la
 * compilazione non si ferma: la pagina esce senza numeri e li prende dal
 * browser. Un sito che non si pubblica perché un server esterno è giù
 * sarebbe un guaio peggiore del dato mancante.
 */
export async function leggiTassi(): Promise<Tassi> {
	const nomi = Object.keys(SERIE) as (keyof typeof SERIE)[];

	const risultati = await Promise.allSettled(
		nomi.map(async (nome) => {
			const { flusso, chiave, quante } = SERIE[nome];
			const risposta = await fetch(
				`${PORTALE}/${flusso}/${chiave}?lastNObservations=${quante}&format=csvdata`,
				{ headers: { Accept: 'text/csv' }, signal: AbortSignal.timeout(20_000) },
			);
			if (!risposta.ok) throw new Error(`${flusso} ha risposto ${risposta.status}`);
			return leggiOsservazioni(await risposta.text());
		}),
	);

	const serie: Tassi['serie'] = {};
	const mancanti: string[] = [];

	risultati.forEach((esito, i) => {
		if (esito.status === 'fulfilled' && esito.value.length > 0) {
			serie[nomi[i]!] = esito.value;
		} else {
			mancanti.push(nomi[i]!);
		}
	});

	return { aggiornato: new Date().toISOString(), serie, mancanti };
}

/** L'ultima osservazione di una serie. */
export function ultimo(osservazioni?: Osservazione[]): Osservazione | undefined {
	return osservazioni?.[osservazioni.length - 1];
}

/** Un tasso scritto all'italiana: 2,25%. */
export function percentuale(valore: number | undefined, decimali = 2): string {
	if (valore === undefined) return '—';
	return `${valore.toFixed(decimali).replace('.', ',')}%`;
}
