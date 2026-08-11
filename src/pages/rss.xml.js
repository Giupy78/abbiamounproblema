import rss from '@astrojs/rss';
import { SITO } from '../config';
import { articoliPubblicati } from '../utils/articoli';

/**
 * Feed RSS del sito.
 *
 * Serve a chi ti segue con un lettore di feed, ma soprattutto agli
 * aggregatori di notizie e a Google Discover, che usano il feed per
 * accorgersi in fretta dei nuovi articoli.
 */
export async function GET(context) {
	const articoli = await articoliPubblicati();

	return rss({
		title: SITO.nome,
		description: SITO.descrizione,
		site: context.site,
		items: articoli.map((articolo) => ({
			title: articolo.data.titolo,
			description: articolo.data.descrizione,
			pubDate: articolo.data.dataPubblicazione,
			link: `/${articolo.id}`,
			categories: [articolo.data.categoria, ...articolo.data.tag],
			author: SITO.autore.nome,
		})),
		customData: `<language>it-it</language><copyright>© ${new Date().getFullYear()} ${SITO.nome}</copyright>`,
	});
}
