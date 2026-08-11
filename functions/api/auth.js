/**
 * Primo passo dell'accesso al pannello di scrittura.
 *
 * Quando premi "Login with GitHub" su /admin, il pannello apre questo
 * indirizzo, che si limita a rimbalzarti sulla pagina di autorizzazione
 * di GitHub. Nessuna password passa mai di qui.
 *
 * Questo file gira su Cloudflare, non nel browser: il codice segreto
 * dell'applicazione resta sul server e non e mai visibile a chi naviga.
 */
export async function onRequest({ request, env }) {
	if (!env.GITHUB_CLIENT_ID) {
		return new Response(
			"Manca la variabile GITHUB_CLIENT_ID nelle impostazioni del progetto Cloudflare Pages.",
			{ status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
		);
	}

	const url = new URL(request.url);

	// Valore casuale usato per verificare, al ritorno da GitHub, che la
	// richiesta sia davvero quella partita da qui e non un tentativo altrui.
	const statoCasuale = crypto.randomUUID();

	const destinazione = new URL('https://github.com/login/oauth/authorize');
	destinazione.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
	destinazione.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
	// Permesso minimo: scrivere solo sui repository pubblici.
	// Se un giorno rendi privato il repository, qui va messo "repo".
	destinazione.searchParams.set('scope', env.GITHUB_SCOPE || 'public_repo');
	destinazione.searchParams.set('state', statoCasuale);

	return new Response(null, {
		status: 302,
		headers: {
			Location: destinazione.toString(),
			'Set-Cookie': `cms_stato=${statoCasuale}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
			'Cache-Control': 'no-store',
		},
	});
}
