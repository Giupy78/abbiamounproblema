# Checklist SEO

Sostituisce il "semaforo" di Yoast. La differenza è che questa checklist spiega **perché**, mentre il semaforo dava solo un colore.

Rileggila prima di pubblicare. Dopo una decina di articoli non ti servirà più.

---

## Quello che il sito fa già da solo

Non devi preoccuparti di niente di tutto questo — è già configurato e funziona a ogni pubblicazione:

- Tag `title` e `meta description` su ogni pagina
- URL canonico, per non essere contato come contenuto duplicato
- Dati strutturati JSON-LD (`BlogPosting`) con autore e date
- Anteprime social per Facebook, WhatsApp, X, LinkedIn
- `sitemap.xml` e `robots.txt` rigenerati automaticamente
- Feed RSS
- Immagini convertite in WebP, con dimensioni dichiarate
- HTML semantico e pagine che si aprono in una frazione di secondo

Restano le cose che dipendono da come scrivi. Sono queste.

---

## Il titolo

- [ ] **Tra 15 e 70 caratteri.** Oltre, Google lo taglia. (Verificato in automatico)
- [ ] **La parola chiave sta nella prima metà.** Se il pezzo parla di liste d'attesa, "liste d'attesa" non deve stare in fondo al titolo.
- [ ] **Dice cosa ottiene chi legge**, non solo di cosa parla.
      *Debole:* "Riflessioni sulla sanità"
      *Meglio:* "Perché le liste d'attesa non si accorciano mai"
- [ ] **Non promette più di quanto il pezzo mantiene.** Un titolo gonfiato porta un clic e perde un lettore — e Google se ne accorge, perché la gente torna indietro.

## La descrizione

- [ ] **Tra 70 e 170 caratteri.** (Verificato in automatico)
- [ ] **È una promessa concreta**, non un riassunto generico. Non cambia la posizione nei risultati, ma decide chi clicca.
- [ ] **Contiene la parola chiave**, perché Google la evidenzia in grassetto nei risultati.
- [ ] **Non ripete parola per parola il titolo.** Sarebbe spazio sprecato: aggiungi un'informazione in più.

## La struttura del testo

- [ ] **Un solo `<h1>` per pagina** — è il titolo, e il sito lo genera già: nel testo dell'articolo **non usare mai `#`**, parti da `##`.
- [ ] **Un sottotitolo `##` ogni tre o quattro paragrafi.** Chi legge dal telefono ha bisogno di appigli visivi.
- [ ] **Sottotitoli che sono frasi**, non etichette. "Perché i conti non tornano" batte "Analisi".
- [ ] **I livelli in ordine:** `##` prima di `###`. Saltare un livello confonde i lettori di schermo e i motori di ricerca.
- [ ] **Il primo paragrafo dice già il punto.** Chi legge decide lì se continuare, e Google spesso pesca da lì l'anteprima.

## I collegamenti

- [ ] **Almeno un link a un altro tuo articolo**, quando c'è un aggancio vero. È uno dei pochi fattori SEO interamente sotto il tuo controllo: dice a Google quali sono i temi su cui il tuo sito ha qualcosa da dire.
- [ ] **Le fonti esterne linkate all'originale**, non alla notizia che parlava dell'originale.
- [ ] **Il testo del link descrive la destinazione.** Mai "clicca qui": scrivi `[il rapporto Istat sui salari](...)`.

## Le immagini

- [ ] **Il campo `immagineAlt` è compilato.** (Verificato in automatico: senza, la compilazione si ferma)
- [ ] **La descrizione dice cosa si vede**, non ripete il titolo dell'articolo.
- [ ] **Il nome del file è leggibile:** `liste-attesa-ospedale.jpg`, non `IMG_4471.jpg`.
- [ ] **Hai il diritto di usarla.** Vedi `COME-PUBBLICARE.md`.

## Il contenuto

- [ ] **Almeno 800 parole** per un pezzo di opinione. Non è una soglia magica: sotto quella lunghezza, di solito, un argomento non è stato davvero svolto.
- [ ] **Dice qualcosa che non trovi identico altrove.** È il fattore che pesa più di tutti gli altri messi insieme.
- [ ] **Niente parole chiave ripetute a forza.** Google lo riconosce e penalizza dal 2011. Scrivi in italiano normale.
- [ ] **Le fonti dei dati sono citate e verificabili.**
- [ ] **La data di aggiornamento è compilata** se hai modificato un pezzo già pubblicato.

---

## Dopo la pubblicazione, una volta sola

- [ ] Registra il sito su **[Google Search Console](https://search.google.com/search-console)** e invia `https://abbiamounproblema.it/sitemap-index.xml`. È gratuito, e ti fa vedere per quali ricerche le persone ti trovano davvero.
- [ ] Stessa cosa su **[Bing Webmaster Tools](https://www.bing.com/webmasters)** — Bing alimenta anche altri motori di ricerca.
- [ ] Attiva **Cloudflare Web Analytics** dal pannello Cloudflare: statistiche senza cookie, che ti evitano metà del banner privacy.
- [ ] Controlla l'anteprima social incollando un link in una chat con te stesso su WhatsApp.

---

## Le tre cose che contano davvero

Tutto quanto sopra è ordinaria manutenzione. Il posizionamento di un sito di opinione, alla fine, dipende da tre cose sole:

1. **Scrivere qualcosa che non c'è già.** Un'analisi originale batte cento articoli tecnicamente perfetti che ripetono la stessa cosa.
2. **Pubblicare con regolarità.** Un pezzo a settimana per un anno vale infinitamente più di venti pezzi in un mese e poi silenzio.
3. **Farsi citare da altri.** I link in entrata restano il segnale più forte che Google usa, e non si comprano: si ottengono scrivendo cose che vale la pena citare.

Il resto è contorno. Utile, necessario, ma contorno.
