import { existsSync } from 'node:fs';
import { getCollection } from 'astro:content';
import { SERIE_DOMANDE, SITO, type SerieDomande } from '../config';
import registro from '../dati/persone.json';

/**
 * Le domande ai lettori, pronte per la pagina /domande.
 *
 * Qui si uniscono i file delle domande e l'elenco delle persone, e si
 * costruisce il testo da incollare su Facebook. Se una domanda nomina una
 * persona che non è nell'elenco, la compilazione si ferma e dice quale:
 * meglio un errore chiaro che una scheda senza foto e senza crediti.
 */

interface Crediti {
	autore: string;
	licenza: string;
	licenzaUrl: string | null;
	fonte: string;
}

export interface Persona {
	chiave: string;
	nome: string;
	ruolo: string;
	foto: string;
	crediti: Crediti;
}

const PERSONE = registro.persone as Record<string, Omit<Persona, 'chiave'>>;

function persona(chiave: string, domanda: string): Persona {
	const trovata = PERSONE[chiave];
	if (!trovata) {
		throw new Error(
			`La domanda "${domanda}" nomina "${chiave}", che non è in src/dati/persone.json. Aggiungi la persona con foto e crediti, oppure correggi il nome nel file della domanda.`,
		);
	}
	return { chiave, ...trovata };
}

/** Il testo del post: domanda, chi è, come rispondere, criterio, avvertenza. */
function testoFacebook(domanda: string, serie: SerieDomande, persone: Persona[]): string {
	const chi =
		persone.length === 2
			? `${persone[0].nome} o ${persone[1].nome}?`
			: `${persone[0].nome}, ${persone[0].ruolo.charAt(0).toLowerCase()}${persone[0].ruolo.slice(1)}.`;
	const comeRispondere =
		persone.length === 2
			? 'Rispondi nei commenti con un nome, e spiega perché.'
			: 'Rispondi nei commenti: sì o no, e perché.';
	const indirizzo = `${SITO.dominio.replace(/^https?:\/\//, '')}/domande`;

	return [
		domanda,
		chi,
		comeRispondere,
		SERIE_DOMANDE[serie].criterio,
		'Non è un sondaggio: chi risponde non è un campione rappresentativo.',
		indirizzo,
	].join('\n\n');
}

export async function domandePubblicate() {
	const tutte = await getCollection('domande', ({ data }) => import.meta.env.DEV || !data.bozza);

	return tutte
		.map((voce) => {
			const serie = voce.data.serie as SerieDomande;
			const persone = voce.data.persone.map((chiave) => persona(chiave, voce.data.domanda));
			return {
				id: voce.id,
				domanda: voce.data.domanda,
				serie,
				ordine: voce.data.ordine,
				persone,
				// Se l'immagine per Facebook non è ancora stata generata, niente pulsante.
				immagine: existsSync(`public/social/domande/${voce.id}.jpg`) ? `/social/domande/${voce.id}.jpg` : null,
				testo: testoFacebook(voce.data.domanda, serie, persone),
			};
		})
		.sort((a, b) => a.ordine - b.ordine);
}
