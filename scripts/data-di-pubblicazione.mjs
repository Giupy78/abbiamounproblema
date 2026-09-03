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

/** Il contenuto di un file a un certo commit, o null se allora non c'era. */
function contenutoAl(commit, file) {
	try {
		return git('show', `${commit}:${file}`);
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
	const eraBozza = prima === null ? true : leggiBozza(prima) !== false;
	if (!eraBozza) continue;

	const dataAttuale = adesso.match(/^dataPubblicazione:\s*(\S+)\s*$/m);
	if (!dataAttuale) continue;
	if (dataAttuale[1] === data) continue;

	writeFileSync(file, adesso.replace(/^dataPubblicazione:.*$/m, `dataPubblicazione: ${data}`));
	sistemati.push(`${file}: ${dataAttuale[1]} → ${data}`);
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
