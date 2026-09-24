/**
 * Pubblica su Facebook un articolo appena uscito, con il testo per intero.
 *
 * Due modi di usarlo:
 *
 *   npm run facebook -- --slug=nome-articolo          mostra il testo, non invia
 *   npm run facebook -- --slug=nome-articolo --invia  pubblica davvero
 *
 * Senza --invia non parte niente: stampa solo quello che manderebbe. È la
 * modalità giusta per guardare come viene prima di mandarlo a qualcuno.
 *
 * L'automatismo lo usa con due commit al posto dello slug, per trovare da
 * solo gli articoli passati da bozza a pubblicato:
 *
 *   node scripts/pubblica-su-facebook.mjs <commit-prima> <commit-dopo> --invia
 *
 * Servono due variabili d'ambiente, che NON stanno in questo progetto:
 *   FACEBOOK_PAGINA   l'identificativo numerico della pagina
 *   FACEBOOK_TOKEN    il token della pagina
 * Si impostano come segreti su GitHub. Il token non deve mai finire in un
 * file del progetto: chi ha quel token può scrivere sulla pagina.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cartella = `${radice}/src/contenuti/articoli`;
const SITO = 'https://abbiamounproblema.it';
const VERSIONE = process.env.FACEBOOK_VERSIONE ?? 'v26.0';

const argomenti = process.argv.slice(2);
const invia = argomenti.includes('--invia');
const slugChiesto = argomenti.find((a) => a.startsWith('--slug='))?.slice(7);
const commit = argomenti.filter((a) => !a.startsWith('--'));

/* ------------------------------------------------------------------ *
 * Da markdown a testo leggibile
 * ------------------------------------------------------------------ */

/**
 * Su Facebook non esistono grassetto, titoli né tabelle: tutto arriva come
 * testo semplice. Convertire senza pensarci produce righe piene di asterischi
 * e tabelle che diventano un muro di barre verticali, quindi ogni elemento
 * va tradotto in qualcosa che regga da solo.
 */
function inTestoSemplice(markdown) {
	const righe = markdown.split('\n');
	const fuori = [];
	let dentroTabella = false;

	for (const riga of righe) {
		const pulita = riga.trimEnd();

		// Riga separatrice di una tabella: |---|---|
		if (/^\s*\|[\s|:-]+\|\s*$/.test(pulita)) {
			dentroTabella = true;
			continue;
		}

		// Riga di tabella: due colonne diventano "voce: valore", di più si
		// uniscono con un separatore che a schermo si legge.
		if (/^\s*\|.*\|\s*$/.test(pulita)) {
			const celle = pulita
				.trim()
				.slice(1, -1)
				.split('|')
				.map((c) => ripulisciInLinea(c.trim()));
			fuori.push(celle.length === 2 ? `${celle[0]}: ${celle[1]}` : celle.join(' · '));
			continue;
		}
		dentroTabella = false;

		// Riga orizzontale
		if (/^\s*---+\s*$/.test(pulita)) {
			fuori.push('');
			continue;
		}

		// Citazione
		if (/^\s*>\s?/.test(pulita)) {
			const testo = ripulisciInLinea(pulita.replace(/^\s*>\s?/, ''));
			fuori.push(testo ? `«${testo}»` : '');
			continue;
		}

		// Titoli: restano come riga a sé, senza i cancelletti
		if (/^\s*#{1,6}\s+/.test(pulita)) {
			fuori.push('');
			fuori.push(ripulisciInLinea(pulita.replace(/^\s*#{1,6}\s+/, '')));
			continue;
		}

		// Elenchi puntati e numerati
		const punto = pulita.match(/^\s*[-*]\s+(.*)$/);
		if (punto) {
			fuori.push(`• ${ripulisciInLinea(punto[1])}`);
			continue;
		}
		const numero = pulita.match(/^\s*(\d+)[.)]\s+(.*)$/);
		if (numero) {
			fuori.push(`${numero[1]}. ${ripulisciInLinea(numero[2])}`);
			continue;
		}

		fuori.push(ripulisciInLinea(pulita));
	}

	return fuori
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * Grassetti, corsivi e link dentro una riga.
 *
 * Sui link serve una distinzione, altrimenti il testo perde senso. I
 * rimandi interni ad altre pagine del sito diventano testo semplice: chi
 * legge il post arriva comunque al sito dal link in fondo. I link esterni
 * invece portano una fonte, e una frase come «lo dice il giudizio di
 * parificazione» senza indicare dove diventa un'affermazione qualsiasi:
 * per quelli resta il nome del sito fra parentesi, che dice da dove viene
 * il dato senza riempire il post di indirizzi lunghissimi.
 */
function ripulisciInLinea(testo) {
	return testo
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]+)\]\(([^)]*)\)/g, (_, etichetta, indirizzo) => {
			if (!/^https?:\/\//.test(indirizzo)) return etichetta;
			try {
				const dominio = new URL(indirizzo).hostname.replace(/^www\./, '');
				if (dominio.endsWith('abbiamounproblema.it')) return etichetta;
				return `${etichetta} (${dominio})`;
			} catch {
				return etichetta;
			}
		})
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\s+$/, '');
}

/* ------------------------------------------------------------------ *
 * Lettura degli articoli
 * ------------------------------------------------------------------ */

function leggiArticolo(slug) {
	const nome = readdirSync(cartella).find((f) => f.replace(/\.mdx?$/, '') === slug);
	if (!nome) return null;

	const contenuto = readFileSync(`${cartella}/${nome}`, 'utf8');
	const fine = contenuto.indexOf('\n---', 4);
	if (!contenuto.startsWith('---') || fine === -1) return null;

	const intestazione = contenuto.slice(4, fine);
	const corpo = contenuto.slice(fine + 4);

	const campo = (nome) => {
		const trovato = intestazione.match(new RegExp(`^${nome}:\\s*(.*)$`, 'm'));
		return trovato ? trovato[1].trim().replace(/^["']|["']$/g, '') : '';
	};

	return {
		slug,
		titolo: campo('titolo'),
		bozza: campo('bozza') === 'true',
		corpo,
	};
}

/** Il post: titolo, articolo per intero, link in fondo. */
function componiPost(articolo) {
	const url = `${SITO}/${articolo.slug}`;
	return `${articolo.titolo}\n\n${inTestoSemplice(articolo.corpo)}\n\nL'articolo con tutte le fonti e i link: ${url}`;
}

/* ------------------------------------------------------------------ *
 * Quali articoli pubblicare
 * ------------------------------------------------------------------ */

function daPubblicare() {
	if (slugChiesto) {
		const articolo = leggiArticolo(slugChiesto);
		if (!articolo) {
			console.error(`Non trovo un articolo con nome "${slugChiesto}".`);
			process.exit(1);
		}
		if (articolo.bozza) {
			console.error(`"${slugChiesto}" è ancora in bozza: non lo pubblico.`);
			process.exit(1);
		}
		return [articolo];
	}

	if (commit.length < 1) {
		console.error('Serve --slug=<nome-articolo> oppure due commit da confrontare.');
		process.exit(1);
	}

	const [prima, dopo = 'HEAD'] = commit;
	let modificati = [];
	try {
		modificati = execFileSync(
			'git',
			['diff', '--name-only', `${prima}..${dopo}`, '--', 'src/contenuti/articoli'],
			{ encoding: 'utf8' },
		)
			.split('\n')
			.map((r) => r.trim())
			.filter((r) => r.endsWith('.md') || r.endsWith('.mdx'));
	} catch {
		console.log('Non riesco a confrontare i due commit: non pubblico niente.');
		return [];
	}

	const usciti = [];
	for (const file of modificati) {
		const slug = file.split('/').pop().replace(/\.mdx?$/, '');
		const adesso = leggiArticolo(slug);
		if (!adesso || adesso.bozza) continue;

		// Era in bozza prima di questo push? Solo in quel caso è "uscito adesso".
		let eraBozza = true;
		try {
			const vecchio = execFileSync('git', ['show', `${prima}:${file}`], {
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'ignore'],
			});
			eraBozza = /^bozza:\s*true\s*$/m.test(vecchio);
		} catch {
			// File nuovo: lo consideriamo appena uscito.
			eraBozza = true;
		}
		if (eraBozza) usciti.push(adesso);
	}
	return usciti;
}

/* ------------------------------------------------------------------ *
 * Invio
 * ------------------------------------------------------------------ */

async function mandaAFacebook(messaggio) {
	const pagina = process.env.FACEBOOK_PAGINA;
	const token = process.env.FACEBOOK_TOKEN;

	if (!pagina || !token) {
		throw new Error(
			'Mancano FACEBOOK_PAGINA o FACEBOOK_TOKEN: senza quelli non posso pubblicare.',
		);
	}

	const risposta = await fetch(`https://graph.facebook.com/${VERSIONE}/${pagina}/feed`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ message: messaggio, access_token: token }),
	});

	const esito = await risposta.json().catch(() => ({}));
	if (!risposta.ok) {
		throw new Error(
			`Facebook ha risposto ${risposta.status}: ${esito?.error?.message ?? 'errore senza messaggio'}`,
		);
	}
	return esito.id;
}

/* ------------------------------------------------------------------ */

const articoli = daPubblicare();

if (articoli.length === 0) {
	console.log('Nessun articolo da pubblicare.');
	process.exit(0);
}

for (const articolo of articoli) {
	const messaggio = componiPost(articolo);

	if (!invia) {
		console.log('─'.repeat(70));
		console.log(`ANTEPRIMA — ${articolo.slug} (${messaggio.length} caratteri)`);
		console.log('─'.repeat(70));
		console.log(messaggio);
		console.log('─'.repeat(70));
		console.log('Non ho inviato niente. Aggiungi --invia per pubblicare davvero.\n');
		continue;
	}

	try {
		const id = await mandaAFacebook(messaggio);
		console.log(`Pubblicato: ${articolo.slug} (post ${id})`);
	} catch (errore) {
		console.error(`Non pubblicato: ${articolo.slug} — ${errore.message}`);
		process.exitCode = 1;
	}
}
