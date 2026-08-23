/**
 * Rende in HTML i testi scritti dal pannello.
 *
 * I campi lunghi delle Impostazioni sono in markdown: chi scrive dal
 * pannello usa il grassetto, il corsivo e i collegamenti come in un
 * articolo, senza dover conoscere l'HTML.
 *
 * Usa lo stesso motore markdown di Astro, quindi il risultato è identico
 * a quello degli articoli: nessuna differenza di resa fra le due strade.
 */
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

/** Il processore è costoso da creare: se ne tiene uno solo per tutta la compilazione. */
let processore: Awaited<ReturnType<typeof createMarkdownProcessor>> | null = null;

async function ottieniProcessore() {
	if (!processore) processore = await createMarkdownProcessor({});
	return processore;
}

/** Da markdown a HTML, per blocchi di testo con più paragrafi. */
export async function rendiMarkdown(testo: string): Promise<string> {
	if (!testo?.trim()) return '';
	const { render } = await ottieniProcessore();
	const { code } = await render(testo);
	return code;
}

/**
 * Come rendiMarkdown, ma toglie il <p> che avvolge un testo di una riga sola.
 * Serve quando il risultato va dentro un elemento che ha già la sua struttura,
 * come una voce di elenco o un titolo.
 */
export async function rendiMarkdownInLinea(testo: string): Promise<string> {
	const html = await rendiMarkdown(testo);
	const soloUnParagrafo = html.match(/^\s*<p>([\s\S]*)<\/p>\s*$/);
	return soloUnParagrafo && !soloUnParagrafo[1].includes('<p>') ? soloUnParagrafo[1] : html;
}
