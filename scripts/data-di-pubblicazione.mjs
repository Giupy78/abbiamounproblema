/**
 * Rimette la data di pubblicazione al giorno in cui un pezzo esce davvero.
 *
 * Il problema che risolve: la data si scrive quando si comincia a scrivere,
 * l'articolo resta in bozza qualche giorno e poi si pubblica dal pannello
 * senza toccarla. Il risultato è un pezzo che risulta uscito prima di
 * esistere, e che in homepage finisce sotto articoli più vecchi di lui.
 *
 * Nessun promemoria ha funzionato, perché nel momento in cui si spegne
 * l'interruttore Bozza la data è tre campi più su e non la si guarda.
 * Quindi la mette a posto da sola questa azione, che gira su GitHub a ogni
 * pubblicazione: se in questo push un contenuto è passato da bozza a
 * pubblicato, la sua data diventa oggi.
 *
 * Uso: node scripts/data-di-pubblicazione.mjs <commit-prima> <commit-dopo>
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [, , commitPrima, commitDopo = 'HEAD'] = process.argv;

const git = (...argomenti) =>
	execFileSync('git', argomenti, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** La data di oggi in Italia, nel formato che usano i file: 2026-09-03. */
function oggi() {
	const parti = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Rome',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date());
	return parti;
}

/** Il valore del campo bozza in un testo con frontmatter. Null se assente. */
function leggiBozza(testo) {
	const riga = testo.match(/^bozza:\s*(true|false)\s*$/m);
	return riga ? riga[1] === 'true' : null;
}

/** La data di pubblicazione scritta nel frontmatter. Null se assente. */
function leggiData(testo) {
	const riga = testo.match(/^dataPubblicazione:\s*(\S+)\s*$/m);
	return riga ? riga[1] : null;
}

/** Il contenuto di un file a un certo commit, o null se allora non c'era. */
function contenutoAl(commit, file) {
	try {
		// stderr silenziato: per un file nuovo git protesta, ma qui il
		// fallimento è una risposta legittima, non un guasto.
		return execFileSync('git', ['show', `${commit}:${file}`], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
			maxBuffer: 64 * 1024 * 1024,
		});
	} catch {
		return null;
	}
}

const data = oggi();
const sistemati = [];

// I file di contenuto toccati da questo push. Se il commit di partenza non
// esiste (primo push su un ramo) non c'è niente da confrontare.
let modificati = [];
try {
	modificati = git('diff', '--name-only', `${commitPrima}..${commitDopo}`, '--', 'src/contenuti')
		.split('\n')
		.map((r) => r.trim())
		.filter((r) => r.endsWith('.md') || r.endsWith('.mdx'));
} catch {
	console.log('Non riesco a confrontare i due commit: non tocco niente.');
	process.exit(0);
}

for (const file of modificati) {
	let adesso;
	try {
		adesso = readFileSync(file, 'utf8');
	} catch {
		continue; // cancellato in questo push
	}

	// Interessa solo il passaggio da bozza a pubblicato. Un articolo già
	// pubblicato che viene corretto tiene la sua data: quella giusta è
	// il giorno in cui è uscito, non quello dell'ultima modifica.
	if (leggiBozza(adesso) !== false) continue;

	const prima = contenutoAl(commitPrima, file);

	// File nuovo: la data l'ha appena scritta chi lo ha creato, quindi è
	// quella che voleva. Non c'è niente da correggere.
	if (prima === null) continue;
	if (leggiBozza(prima) === false) continue;

	const dataPrima = leggiData(prima);
	const dataAdesso = leggiData(adesso);
	if (!dataAdesso) continue;

	// Se la data è stata cambiata in questo stesso push, è stata una
	// scelta: si può voler pubblicare un pezzo con la data del giorno in
	// cui esce l'articolo a cui è collegato, non con quella di oggi.
	// L'automazione serve a chi la data se l'è dimenticata, non a chi
	// l'ha appena decisa.
	if (dataPrima !== dataAdesso) continue;
	if (dataAdesso === data) continue;

	writeFileSync(file, adesso.replace(/^dataPubblicazione:.*$/m, `dataPubblicazione: ${data}`));
	sistemati.push(`${file}: ${dataAdesso} → ${data}`);
}

if (sistemati.length === 0) {
	console.log('Nessuna data da sistemare.');
	process.exit(0);
}

console.log(`Date rimesse al giorno di pubblicazione (${data}):`);
for (const riga of sistemati) console.log(`  ${riga}`);

// Lo legge il workflow per decidere se deve fare il commit. Fuori da
// GitHub la variabile non c'è: lo script serve anche a mano, in locale.
if (process.env.GITHUB_OUTPUT) {
	writeFileSync(process.env.GITHUB_OUTPUT, `sistemati=${sistemati.length}\n`, { flag: 'a' });
}
