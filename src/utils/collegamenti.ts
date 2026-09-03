import { getCollection } from 'astro:content';

/**
 * Controlla che nessun articolo pubblicato rimandi a una proposta che sul
 * sito online non esiste.
 *
 * È il difetto che è già capitato tre volte: si pubblica l'articolo dal
 * pannello e ci si dimentica delle proposte collegate, che restano in
 * bozza. In locale non si vede niente, perché in sviluppo le bozze sono
 * visibili; online quei link portano a una pagina 404, e li trova il
 * lettore prima di noi.
 *
 * Per questo il controllo vale solo in produzione: in sviluppo la bozza
 * c'è davvero e il link funziona.
 */
let giaVerificato = false;

export async function verificaCollegamenti() {
	if (giaVerificato || !import.meta.env.PROD) return;
	giaVerificato = true;

	const articoli = await getCollection(
		'articoli',
		({ data }: { data: { bozza: boolean } }) => data.bozza === false,
	);
	const proposte = await getCollection('proposte');

	const pubblicate = new Set(
		proposte.filter((p: any) => p.data.bozza === false).map((p: any) => p.id),
	);
	const inBozza = new Set(proposte.filter((p: any) => p.data.bozza).map((p: any) => p.id));

	const rotti: string[] = [];

	for (const articolo of articoli as any[]) {
		const collegamenti: string[] = articolo.body?.match(/\/proposte\/[a-z0-9-]+/g) ?? [];

		for (const collegamento of new Set(collegamenti)) {
			const slug = collegamento.replace('/proposte/', '');
			if (pubblicate.has(slug)) continue;

			rotti.push(
				inBozza.has(slug)
					? `  · "${articolo.id}" rimanda a "${slug}", che è ancora in bozza`
					: `  · "${articolo.id}" rimanda a "${slug}", che non esiste`,
			);
		}
	}

	if (rotti.length > 0) {
		throw new Error(
			`Ci sono ${rotti.length} collegamenti che online porterebbero a una pagina inesistente:\n\n` +
				`${rotti.join('\n')}\n\n` +
				`Se la proposta è in bozza, pubblicala: nel pannello aprila e spegni l'interruttore Bozza. ` +
				`Se invece il link è sbagliato, correggilo nell'articolo.\n` +
				`Finché non è a posto il sito online resta quello di prima, così nessuno trova un link rotto.`,
		);
	}
}
