"""Aggiorna i dati della pagina /congiuntura dai comunicati ISTAT.

Uso:  python scripts/congiuntura.py

Lo lancia ogni giorno feriale il workflow .github/workflows/congiuntura.yml,
ma si può lanciare anche a mano. Scrive src/dati/congiuntura.json solo se
qualcosa è cambiato: se non ci sono comunicati nuovi, il file resta com'è e
non parte nessuna pubblicazione.

Come trova i comunicati: gli indirizzi dell'ISTAT seguono uno schema fisso
(per esempio prezzi-al-consumo-dati-provvisori-ottobre-2026), quindi lo
script prova i periodi più recenti e prende il primo che esiste. Il servizio
dati SDMX dell'ISTAT sarebbe la via naturale, ma a novembre 2026 non
rispondeva nemmeno in un minuto.

Come legge i numeri: dalla prima pagina del PDF del comunicato, con frasi che
l'ISTAT ripete identiche ogni mese. Se una frase cambia e un numero non si
trova, quella serie resta al dato precedente e il workflow segnala un
avviso: meglio un dato vecchio con la sua data che un dato sbagliato.
"""
import datetime as dt
import html
import io
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

from pypdf import PdfReader

sys.stdout.reconfigure(encoding='utf-8')

FILE = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'dati' / 'congiuntura.json'
BASE = 'https://www.istat.it/comunicato-stampa/'
AGENTE = {'User-Agent': 'Mozilla/5.0 (compatible; abbiamounproblema.it congiuntura)'}

MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
        'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
TRIMESTRI = ['i', 'ii', 'iii', 'iv']
TRIMESTRI_MESI = ['gennaio-marzo', 'aprile-giugno', 'luglio-settembre', 'ottobre-dicembre']

# Un numero come lo scrive l'ISTAT: +5,4 oppure -0,2 oppure 63,0. Nel testo
# estratto dal PDF a volte il segno resta staccato: «+ 31,4».
NUM = r'([+-]?\s?\d+,\d)'


def scarica(url):
	richiesta = urllib.request.Request(url, headers=AGENTE)
	with urllib.request.urlopen(richiesta, timeout=60) as risposta:
		return risposta.read()


def esiste(slug):
	"""La pagina del comunicato, se esiste; None se l'ISTAT risponde 404."""
	try:
		return scarica(BASE + slug + '/').decode('utf-8', 'ignore')
	except urllib.error.HTTPError as errore:
		if errore.code == 404:
			return None
		raise


def numero(testo):
	return float(testo.replace(' ', '').replace(',', '.'))


def mesi_indietro(oggi, quanti):
	"""(mese, anno) dal corrente all'indietro."""
	anno, mese = oggi.year, oggi.month
	for _ in range(quanti):
		yield MESI[mese - 1], anno
		mese -= 1
		if mese == 0:
			mese, anno = 12, anno - 1


def trimestri_indietro(oggi, quanti):
	"""(indice del trimestre 0-3, anno) dal corrente all'indietro."""
	anno, trimestre = oggi.year, (oggi.month - 1) // 3
	for _ in range(quanti):
		yield trimestre, anno
		trimestre -= 1
		if trimestre < 0:
			trimestre, anno = 3, anno - 1


def comunicato(slug, pagina):
	"""Titolo, data, indirizzo e testo della prima pagina del PDF."""
	titolo = re.search(r'<title>(.*?)(?: \| Istat|</title>)', pagina, re.S)
	titolo = re.sub(r'\s+[–-]\s+Istat$', '', html.unescape(titolo.group(1)).strip()) if titolo else slug
	data = re.search(r'>\s*(\d{1,2}) (' + '|'.join(m.capitalize() for m in MESI) + r') (\d{4})\s*<', pagina)
	if not data:
		raise ValueError('data del comunicato non trovata')
	data = dt.date(int(data.group(3)), MESI.index(data.group(2).lower()) + 1, int(data.group(1))).isoformat()
	pdf = re.search(r'href="(https://www\.istat\.it/wp-content/uploads/[^"]+\.pdf)"', pagina)
	if not pdf:
		raise ValueError('PDF del comunicato non trovato')
	testo = PdfReader(io.BytesIO(scarica(pdf.group(1)))).pages[0].extract_text()
	return {
		'titolo': titolo,
		'data': data,
		'url': BASE + slug + '/',
		'pdf': pdf.group(1),
	}, re.sub(r'\s+', ' ', testo)


def cerca(testo, schema, obbligatorio=True):
	trovato = re.search(schema, testo, re.S)
	if not trovato and obbligatorio:
		raise ValueError(f'frase non trovata: {schema[:60]}')
	return trovato


def entro(valore, minimo, massimo, nome):
	if not minimo <= valore <= massimo:
		raise ValueError(f'{nome} fuori dai limiti plausibili: {valore}')
	return valore


def inflazione(oggi):
	"""Prezzi al consumo: il comunicato più recente, definitivo o provvisorio."""
	for mese, anno in mesi_indietro(oggi, 4):
		# Nello stesso mese il definitivo esce dopo il provvisorio e lo sostituisce.
		for slug, provvisorio in ((f'prezzi-al-consumo-{mese}-{anno}', False),
		                          (f'prezzi-al-consumo-dati-provvisori-{mese}-{anno}', True)):
			pagina = esiste(slug)
			if not pagina:
				continue
			fonte, t = comunicato(slug, pagina)
			if provvisorio:
				m = cerca(t, rf'variazione pari a {NUM}% su base mensile e a {NUM}% su base annua \(da {NUM}%')
			else:
				m = cerca(t, rf'variazione congiunturale pari a {NUM}% e una tendenziale (?:pari )?a {NUM}% \(da {NUM}%')
			fondo = cerca(t, rf'inflazione di fondo.{{0,200}}?\(da {NUM}% a {NUM}%\)', obbligatorio=False)
			ipca = cerca(t, rf'\(IPCA\).{{0,250}}?{NUM}% su base annua', obbligatorio=False)
			# Attenzione: la stessa pagina parla anche dell'inflazione «al netto dei soli
			# beni energetici». Qui serve la variazione dei prezzi dell'energia, che
			# l'ISTAT introduce sempre con «prezzi dei beni energetici».
			energia = cerca(t, rf'prezzi dei beni energetici \(da {NUM}% a {NUM}%\)', obbligatorio=False)
			return {
				'periodo': f'{mese} {anno}',
				'provvisorio': provvisorio,
				'mensile': entro(numero(m.group(1)), -5, 5, 'variazione mensile'),
				'annua': entro(numero(m.group(2)), -5, 25, 'inflazione annua'),
				'precedente': entro(numero(m.group(3)), -5, 25, 'inflazione del mese prima'),
				'fondo': numero(fondo.group(2)) if fondo else None,
				'ipca': numero(ipca.group(1)) if ipca else None,
				'energia': numero(energia.group(2)) if energia else None,
				'fonte': fonte,
			}
	raise ValueError('nessun comunicato sui prezzi negli ultimi quattro mesi')


def variazione(verbo, valore):
	return -valore if re.match(r'diminu|cal|sces|ridott|flession', verbo) else valore


def pil(oggi):
	"""Stima preliminare del PIL: l'ultimo trimestre pubblicato."""
	for trimestre, anno in trimestri_indietro(oggi, 4):
		slug = f'stima-preliminare-del-pil-{TRIMESTRI[trimestre]}-trimestre-{anno}'
		pagina = esiste(slug)
		if not pagina:
			continue
		fonte, t = comunicato(slug, pagina)
		frase = cerca(t, r'si stima che il prodotto interno lordo.{0,300}?in termini tendenziali').group(0)
		if re.search(r'rimasto invariato rispetto al trimestre precedente', frase):
			congiunturale = 0.0
		else:
			m = cerca(frase, r'(aumentato|cresciuto|diminuito|calato|sceso) dell[oa] (\d+,\d)% rispetto al trimestre precedente')
			congiunturale = variazione(m.group(1), numero(m.group(2)))
		m = cerca(frase, r'(crescita|aumento|diminuzione|calo|flessione|aumentato|cresciuto|diminuito|calato) dell[oa] (\d+,\d)% in termini tendenziali')
		tendenziale = variazione(m.group(1), numero(m.group(2)))
		acquisita = cerca(t, rf'variazione acquisita per il \d{{4}}.{{0,80}}?pari (?:allo |al |a )?{NUM}%', obbligatorio=False)
		return {
			'periodo': f'{TRIMESTRI[trimestre].upper()} trimestre {anno}',
			'congiunturale': entro(congiunturale, -10, 10, 'variazione sul trimestre'),
			'tendenziale': entro(tendenziale, -15, 15, "variazione sull'anno"),
			'acquisita': numero(acquisita.group(1)) if acquisita else None,
			'fonte': fonte,
		}
	raise ValueError('nessuna stima preliminare del PIL negli ultimi quattro trimestri')


def lavoro(oggi):
	"""Occupati e disoccupati, dati provvisori mensili."""
	for mese, anno in mesi_indietro(oggi, 4):
		slug = f'occupati-e-disoccupati-dati-provvisori-{mese}-{anno}'
		pagina = esiste(slug)
		if not pagina:
			continue
		fonte, t = comunicato(slug, pagina)
		occupazione = cerca(t, r'tasso di occupazione[^%]{0,60}?(\d+,\d)%')
		disoccupazione = cerca(t, r'tasso di disoccupazione[^%]{0,60}?(\d+,\d)%')
		giovanile = cerca(t, r'giovanile[^%]{0,40}?(\d+,\d)%', obbligatorio=False)
		inattivita = cerca(t, r'tasso di inattivit[^%]{0,60}?(\d+,\d)%', obbligatorio=False)
		occupati = cerca(t, r'numero di occupati, pari a (\d+ milioni \d+mila)', obbligatorio=False)
		return {
			'periodo': f'{mese} {anno}',
			'occupazione': entro(numero(occupazione.group(1)), 40, 80, 'tasso di occupazione'),
			'disoccupazione': entro(numero(disoccupazione.group(1)), 1, 25, 'tasso di disoccupazione'),
			'giovanile': numero(giovanile.group(1)) if giovanile else None,
			'inattivita': numero(inattivita.group(1)) if inattivita else None,
			'occupati': occupati.group(1) if occupati else None,
			'fonte': fonte,
		}
	raise ValueError('nessun comunicato su occupati e disoccupati negli ultimi quattro mesi')


def retribuzioni(oggi):
	"""Retribuzioni contrattuali, comunicato trimestrale."""
	for trimestre, anno in trimestri_indietro(oggi, 5):
		slug = f'retribuzioni-contrattuali-{TRIMESTRI_MESI[trimestre]}-{anno}'
		pagina = esiste(slug)
		if not pagina:
			continue
		fonte, t = comunicato(slug, pagina)
		m = cerca(t, rf'retribuzioni contrattuali orarie, a (\w+ \d{{4}}),.{{0,160}}?(aumenta|cresce|diminuisce|cala) del (\d+,\d)% rispetto a')
		settori = cerca(t, r'tendenziale è stato del (\d+,\d)% nel settore privato.{0,160}?e del (\d+,\d)% per la pubblica amministrazione', obbligatorio=False)
		return {
			'periodo': m.group(1),
			'annua': entro(variazione(m.group(2), numero(m.group(3))), -10, 20, 'retribuzioni'),
			'privato': numero(settori.group(1)) if settori else None,
			'pubblico': numero(settori.group(2)) if settori else None,
			'fonte': fonte,
		}
	raise ValueError('nessun comunicato sulle retribuzioni contrattuali negli ultimi cinque trimestri')


def main():
	oggi = dt.date.today()
	precedenti = json.loads(FILE.read_text(encoding='utf-8')) if FILE.exists() else {}
	dati = dict(precedenti)
	problemi = 0

	for nome, funzione in (('inflazione', inflazione), ('pil', pil),
	                       ('lavoro', lavoro), ('retribuzioni', retribuzioni)):
		try:
			dati[nome] = funzione(oggi)
			print(f'{nome}: {dati[nome]["periodo"]}, comunicato del {dati[nome]["fonte"]["data"]}')
		except Exception as errore:  # una serie che non si legge non deve fermare le altre
			problemi += 1
			print(f'::warning::{nome} non aggiornata, resta il dato precedente: {errore}')

	if dati == precedenti:
		print('Nessun dato nuovo.')
		return
	FILE.write_text(json.dumps(dati, ensure_ascii=False, indent='\t') + '\n', encoding='utf-8')
	print(f'Aggiornato {FILE.name}.' + (f' Serie non lette: {problemi}.' if problemi else ''))


if __name__ == '__main__':
	main()
