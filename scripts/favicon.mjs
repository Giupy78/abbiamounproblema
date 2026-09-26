/**
 * Genera la favicon del sito e le icone per i telefoni.
 *
 * Si lancia con:  npm run favicon
 *
 * Il disegno è quello scelto per i social — anello tricolore e punto
 * interrogativo — ma **non è lo stesso file rimpicciolito**, e la differenza
 * è tutto il lavoro: a 16 pixel l'anello sottile diventa una sbavatura
 * colorata e il segno si chiude. Qui l'anello è quasi tre volte più spesso
 * e il segno più grande, così a dimensione di scheda del browser si
 * riconoscono ancora tre colori e un punto interrogativo.
 *
 * Perché PNG e non SVG: in un SVG il punto interrogativo sarebbe testo, e il
 * carattere lo sceglierebbe il browser di chi legge — su un telefono senza
 * quel carattere il segno cambierebbe forma. Qui il carattere viene fissato
 * adesso, una volta per tutte.
 */
import sharp from 'sharp';
import { writeFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pubblica = `${radice}/public`;

const NERO = '#161513';
const CREMA = '#ece9e3';
const VERDE = '#3aa971';
const ROSSO = '#d9564b';
const SERIF = "'Times New Roman', Times, Georgia, 'Liberation Serif', serif";

const LATO = 512;

/**
 * Il disegno, con due varianti.
 *
 * "grande" tiene le proporzioni dell'immagine social ed è quella per le
 * icone dei telefoni, che si vedono a 180 pixel e oltre.
 * "piccola" ingrossa l'anello e allarga il segno: serve sotto i 64 pixel.
 */
function disegno(variante) {
	// Tre varianti, non due: sotto i 20 pixel il segno e l'anello si
	// contendono gli stessi pixel, e vince chi ha più spazio. Qui l'anello
	// si assottiglia e il punto interrogativo cresce, perché a quella
	// dimensione è il segno a dire di cosa si tratta: i tre colori si
	// riconoscono anche se il filo è più fine.
	const misure = {
		grande: { raggio: 237, spessore: 18, corpo: 380, base: 386 },
		piccola: { raggio: 218, spessore: 58, corpo: 430, base: 396 },
		minima: { raggio: 228, spessore: 44, corpo: 500, base: 414 },
	};

	const { raggio, spessore, corpo, base } = misure[variante] ?? misure.grande;

	const giro = 2 * Math.PI * raggio;
	const terzo = giro / 3;

	// Rosso, crema, verde e non il contrario: gli archi partono dalle ore
	// dodici e proseguono in senso orario, quindi il primo colore finisce a
	// destra. Così chi guarda vede verde a sinistra e rosso a destra.
	const anello = [ROSSO, CREMA, VERDE]
		.map(
			(colore, i) =>
				`<circle cx="256" cy="256" r="${raggio}" fill="none" stroke="${colore}" stroke-width="${spessore}" stroke-dasharray="${terzo} ${giro - terzo}" stroke-dashoffset="${-terzo * i}" transform="rotate(-90 256 256)"/>`,
		)
		.join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${LATO}" height="${LATO}" viewBox="0 0 512 512">
		<rect width="512" height="512" fill="${NERO}"/>
		${anello}
		<text x="250" y="${base}" text-anchor="middle" font-family="${SERIF}" font-size="${corpo}" font-weight="700" fill="${CREMA}">?</text>
	</svg>`;
}

const grande = Buffer.from(disegno('grande'));
const piccola = Buffer.from(disegno('piccola'));
const minima = Buffer.from(disegno('minima'));

/** Le icone dei telefoni e della schermata iniziale: si vedono grandi. */
const daGrande = [
	['apple-touch-icon.png', 180],
	['icona-192.png', 192],
	['icona-512.png', 512],
];

for (const [nome, lato] of daGrande) {
	await sharp(grande).resize(lato, lato).png().toFile(`${pubblica}/${nome}`);
	console.log(`  ${nome} (${lato}px)`);
}

/** La favicon vera e propria: qui comanda la variante ingrossata. */
const misure = [16, 32, 48];
const rasterizzate = {};

for (const lato of misure) {
	const buffer = await sharp(lato <= 16 ? minima : piccola)
		.resize(lato, lato)
		.png()
		.toBuffer();
	rasterizzate[lato] = buffer;
	if (lato !== 48) {
		await writeFile(`${pubblica}/favicon-${lato}.png`, buffer);
		console.log(`  favicon-${lato}.png`);
	}
}

/**
 * Il file .ico, che alcuni programmi cercano ancora per conto proprio
 * all'indirizzo /favicon.ico. È un contenitore semplice: un'intestazione,
 * una riga per ogni misura e poi i PNG uno dietro l'altro.
 */
function costruisciIco(immagini) {
	const intestazione = Buffer.alloc(6);
	intestazione.writeUInt16LE(0, 0); // riservato
	intestazione.writeUInt16LE(1, 2); // 1 = icona
	intestazione.writeUInt16LE(immagini.length, 4);

	let scorrimento = 6 + immagini.length * 16;
	const righe = [];

	for (const { lato, dati } of immagini) {
		const riga = Buffer.alloc(16);
		riga.writeUInt8(lato >= 256 ? 0 : lato, 0);
		riga.writeUInt8(lato >= 256 ? 0 : lato, 1);
		riga.writeUInt8(0, 2); // colori in tavolozza: nessuna
		riga.writeUInt8(0, 3); // riservato
		riga.writeUInt16LE(1, 4); // piani
		riga.writeUInt16LE(32, 6); // bit per pixel
		riga.writeUInt32LE(dati.length, 8);
		riga.writeUInt32LE(scorrimento, 12);
		scorrimento += dati.length;
		righe.push(riga);
	}

	return Buffer.concat([intestazione, ...righe, ...immagini.map((i) => i.dati)]);
}

await writeFile(
	`${pubblica}/favicon.ico`,
	costruisciIco(misure.map((lato) => ({ lato, dati: rasterizzate[lato] }))),
);
console.log('  favicon.ico (16, 32, 48)');

// Il vecchio favicon.svg era il logo di Astro, arrivato con il modello del
// progetto: va tolto, altrimenti resta il riferimento a un altro sito.
await rm(`${pubblica}/favicon.svg`, { force: true });

/** La prova: la favicon a 16 e 32 pixel, ingrandita senza sfocatura. */
const provini = await Promise.all(
	[16, 32].map((lato) =>
		sharp(rasterizzate[lato]).resize(224, 224, { kernel: 'nearest' }).toBuffer(),
	),
);

await sharp({
	create: { width: 224 * 2 + 60, height: 224 + 40, channels: 3, background: '#f2efea' },
})
	.composite(provini.map((b, i) => ({ input: b, top: 20, left: 20 + i * 244 })))
	.png()
	.toFile(`${pubblica}/social/anteprima-favicon.png`);

console.log('  social/anteprima-favicon.png — a 16 e 32 pixel, ingrandita');
