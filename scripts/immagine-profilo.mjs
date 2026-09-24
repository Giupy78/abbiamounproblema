/**
 * Genera le proposte per l'immagine del profilo sui social.
 *
 * Si lancia con:  npm run immagine-profilo
 *
 * Il vincolo che decide tutto: nel feed di Facebook l'immagine del profilo
 * è larga una quarantina di pixel. A quella dimensione sopravvivono solo
 * forme grandi e molto contrastate — niente linee sottili, niente dettagli.
 * Per questo le tre proposte cambiano colore e contorno, ma tengono tutte
 * lo stesso segno grande al centro.
 *
 * Insieme ai tre file viene generata "anteprima-40px.png": le tre immagini
 * rimpicciolite davvero a 40 pixel e poi ingrandite senza sfocatura, per
 * vedere cosa resta leggibile prima di sceglierne una.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cartella = `${radice}/public/social`;

// Gli stessi colori di src/styles: nero caldo, crema, ocra, più il verde e
// il rosso della cartina in homepage.
const NERO = '#161513';
const CREMA = '#ece9e3';
const OCRA = '#a8721a';
const VERDE = '#3aa971';
const ROSSO = '#d9564b';

const LATO = 1024;
const SERIF = "'Times New Roman', Times, Georgia, 'Liberation Serif', serif";

/**
 * Il punto interrogativo, grande quanto basta a reggere il rimpicciolimento.
 *
 * La x non è 512 ma 500: il segno ha il gancio a destra e il punto in basso
 * a sinistra, quindi centrarlo sulla larghezza lo fa sembrare spostato. Si
 * centra a occhio, non con il righello.
 */
function segno(colore) {
	return `<text x="500" y="772" text-anchor="middle" font-family="${SERIF}" font-size="760" font-weight="700" fill="${colore}">?</text>`;
}

// L'anello tricolore: tre archi uguali sulla stessa circonferenza, ottenuti
// spezzando il tratteggio in tre parti da un terzo ciascuna.
const RAGGIO = 474;
const GIRO = 2 * Math.PI * RAGGIO;
const TERZO = GIRO / 3;

function anelloTricolore() {
	return [VERDE, CREMA, ROSSO]
		.map(
			(colore, i) =>
				`<circle cx="512" cy="512" r="${RAGGIO}" fill="none" stroke="${colore}" stroke-width="36" stroke-dasharray="${TERZO} ${GIRO - TERZO}" stroke-dashoffset="${-TERZO * i}" transform="rotate(-90 512 512)"/>`,
		)
		.join('');
}

const proposte = [
	{
		nome: 'profilo-1-scuro',
		descrizione: 'Fondo nero caldo, segno crema',
		svg: `<rect width="${LATO}" height="${LATO}" fill="${NERO}"/>${segno(CREMA)}`,
	},
	{
		nome: 'profilo-2-ocra',
		descrizione: "Fondo ocra, segno nero: e' quello che si stacca di piu' nel feed",
		svg: `<rect width="${LATO}" height="${LATO}" fill="${OCRA}"/>${segno(NERO)}`,
	},
	{
		nome: 'profilo-3-tricolore',
		descrizione: 'Fondo nero caldo con anello tricolore, come la cartina in homepage',
		svg: `<rect width="${LATO}" height="${LATO}" fill="${NERO}"/>${anelloTricolore()}${segno(CREMA)}`,
	},
];

await mkdir(cartella, { recursive: true });

for (const p of proposte) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LATO}" height="${LATO}" viewBox="0 0 ${LATO} ${LATO}">${p.svg}</svg>`;
	await sharp(Buffer.from(svg)).png().toFile(`${cartella}/${p.nome}.png`);
	console.log(`  ${p.nome}.png — ${p.descrizione}`);
}

// La prova del nove: rimpicciolire davvero a 40 pixel e riportare in grande
// senza sfocatura, così si vede quello che vede l'occhio nel feed.
const provini = await Promise.all(
	proposte.map((p) =>
		sharp(`${cartella}/${p.nome}.png`)
			.resize(40, 40)
			.resize(240, 240, { kernel: 'nearest' })
			.toBuffer(),
	),
);

await sharp({
	create: {
		width: 240 * 3 + 40 * 4,
		height: 240 + 80,
		channels: 3,
		background: '#f2efea',
	},
})
	.composite(provini.map((b, i) => ({ input: b, top: 40, left: 40 + i * 280 })))
	.png()
	.toFile(`${cartella}/anteprima-40px.png`);

console.log('  anteprima-40px.png — le tre a dimensione reale nel feed');
