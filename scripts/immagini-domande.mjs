/**
 * Genera le immagini per Facebook delle domande ai lettori, in
 * public/social/domande/<nome-della-domanda>.jpg.
 *
 * Si lancia con:  npm run immagini-domande
 *
 * Rilancialo ogni volta che aggiungi o cambi una domanda in
 * src/contenuti/domande, o una foto in src/dati/persone.json.
 *
 * Quadrato 1080×1080: è il formato che Facebook mostra intero nel feed,
 * senza ritagliarlo. I crediti delle foto stanno dentro l'immagine,
 * perché le licenze libere chiedono di citare l'autore anche quando
 * l'immagine gira da sola, staccata dalla pagina del sito.
 */
import sharp from 'sharp';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LATO = 1080;

// Gli stessi colori del tema scuro del sito e dell'immagine di condivisione.
const FONDO = '#161513';
const TESTO = '#ece9e3';
const TENUE = '#a29c92';
const ACCENTO = '#d9a441';
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = 'Arial, Helvetica, sans-serif';

const { persone } = JSON.parse(await readFile(`${radice}/src/dati/persone.json`, 'utf8'));

/** Il testo dentro un SVG: le tre lettere che romperebbero il file. */
const sicuro = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Divide la domanda in righe da al massimo `limite` caratteri, a parole intere. */
function righe(testo, limite) {
	const parole = testo.split(' ');
	const fatte = [''];
	for (const parola of parole) {
		const ultima = fatte[fatte.length - 1];
		if (ultima && (ultima + ' ' + parola).length > limite) fatte.push(parola);
		else fatte[fatte.length - 1] = ultima ? `${ultima} ${parola}` : parola;
	}
	return fatte;
}

/** La foto ridimensionata, con gli angoli arrotondati. */
async function foto(percorso, larghezza, altezza) {
	const maschera = Buffer.from(
		`<svg width="${larghezza}" height="${altezza}"><rect width="${larghezza}" height="${altezza}" rx="18" ry="18"/></svg>`,
	);
	return sharp(`${radice}/public${percorso}`)
		.resize(larghezza, altezza, { fit: 'cover', position: 'top' })
		.composite([{ input: maschera, blend: 'dest-in' }])
		.png()
		.toBuffer();
}

async function immagine(domanda) {
	const chi = domanda.persone.map((chiave) => {
		const p = persone[chiave];
		if (!p) throw new Error(`"${chiave}" non è in src/dati/persone.json`);
		return p;
	});

	// La domanda: una o due righe, centrate nella fascia alta.
	const linee = righe(domanda.domanda, 24);
	if (linee.length > 2) throw new Error(`"${domanda.domanda}" non sta in due righe: accorciala.`);
	const primaRiga = linee.length === 1 ? 160 : 108;
	const avvertenza = linee.length === 1 ? 222 : 228;
	const cima = avvertenza + 30;
	const testoDomanda = linee
		.map(
			(l, i) =>
				`<text x="540" y="${primaRiga + i * 72}" text-anchor="middle" font-family="${SERIF}" font-size="64" font-weight="700" fill="${ACCENTO}">${sicuro(l)}</text>`,
		)
		.join('');

	const strati = [];
	let didascalie = '';

	if (chi.length === 1) {
		strati.push({ input: await foto(chi[0].foto, 450, 600), left: 315, top: cima });
		didascalie = `
			<text x="540" y="${cima + 656}" text-anchor="middle" font-family="${SERIF}" font-size="46" font-weight="700" fill="${TESTO}">${sicuro(chi[0].nome)}</text>
			<text x="540" y="${cima + 698}" text-anchor="middle" font-family="${SANS}" font-size="25" fill="${TENUE}">${sicuro(chi[0].ruolo)}</text>`;
	} else {
		const posizioni = [90, 570];
		for (const [i, p] of chi.entries()) {
			strati.push({ input: await foto(p.foto, 420, 560), left: posizioni[i], top: cima });
			const centro = posizioni[i] + 210;
			didascalie += `
				<text x="${centro}" y="${cima + 616}" text-anchor="middle" font-family="${SERIF}" font-size="40" font-weight="700" fill="${TESTO}">${sicuro(p.nome)}</text>
				<text x="${centro}" y="${cima + 654}" text-anchor="middle" font-family="${SANS}" font-size="22" fill="${TENUE}">${sicuro(p.ruolo)}</text>`;
		}
	}

	const crediti =
		'Foto: ' + chi.map((p) => `${p.crediti.autore}, ${p.crediti.licenza}`).join(' · ') + ' · Wikimedia Commons';

	const sopra = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${LATO}" height="${LATO}">
		<rect x="0" y="0" width="360" height="10" fill="#3aa971"/>
		<rect x="360" y="0" width="360" height="10" fill="#e8e4dc"/>
		<rect x="720" y="0" width="360" height="10" fill="#d9564b"/>
		${testoDomanda}
		<text x="540" y="${avvertenza}" text-anchor="middle" font-family="${SANS}" font-size="22" fill="${TENUE}">Non è un sondaggio: è una domanda ai lettori</text>
		${didascalie}
		<text x="60" y="1026" font-family="${SANS}" font-size="24" letter-spacing="3" fill="${ACCENTO}">ABBIAMOUNPROBLEMA.IT</text>
		<text x="1020" y="1026" text-anchor="end" font-family="${SERIF}" font-size="30" font-weight="700" fill="${TESTO}">Rispondi nei commenti</text>
		<text x="540" y="1062" text-anchor="middle" font-family="${SANS}" font-size="16" fill="${TENUE}">${sicuro(crediti)}</text>
	</svg>`);

	return sharp({ create: { width: LATO, height: LATO, channels: 3, background: FONDO } })
		.composite([...strati, { input: sopra, left: 0, top: 0 }])
		.jpeg({ quality: 88, mozjpeg: true })
		.toBuffer();
}

const cartella = `${radice}/src/contenuti/domande`;
const uscita = `${radice}/public/social/domande`;
await mkdir(uscita, { recursive: true });

const file = (await readdir(cartella)).filter((f) => f.endsWith('.json'));
for (const nome of file) {
	const domanda = JSON.parse(await readFile(`${cartella}/${nome}`, 'utf8'));
	const jpg = await immagine(domanda);
	const destinazione = `${uscita}/${nome.replace(/\.json$/, '.jpg')}`;
	await writeFile(destinazione, jpg);
	console.log(`Creata ${destinazione.replace(radice + '/', '')} (${Math.round(jpg.length / 1024)} KB)`);
}
