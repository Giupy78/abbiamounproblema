---
# ─────────────────────────────────────────────────────────────
# MODELLO DA COPIARE PER OGNI NUOVO ARTICOLO
#
# Duplica questo file, rinominalo e scrivi. Il nome del file diventa
# l'indirizzo della pagina: caro-affitti.md  ->  /caro-affitti
# Usa solo lettere minuscole, numeri e trattini. Niente spazi, niente accenti.
#
# Finché "bozza" resta true, l'articolo si vede solo sul tuo computer.
# ─────────────────────────────────────────────────────────────

# Da 15 a 70 caratteri. Oltre i 70 Google lo taglia nei risultati di ricerca.
titolo: "Modello di articolo: copia questo file per iniziare"

# Da 70 a 170 caratteri. È il testo grigio sotto il titolo su Google:
# non cambia la posizione, ma decide se la gente clicca. Scrivilo come
# una promessa concreta, non come un riassunto generico.
descrizione: "Il file da duplicare per scrivere un pezzo nuovo: tutti i campi dell'intestazione spiegati uno per uno, con i limiti da rispettare."

dataPubblicazione: 2026-08-11

# Da compilare solo quando modifichi un articolo GIÀ pubblicato.
# Google mostra questa data nei risultati e premia i contenuti aggiornati.
# dataAggiornamento: 2026-09-01

# Una sola, scelta tra quelle in src/config.ts. Se sbagli a scriverla
# la compilazione si ferma e ti dice dov'è l'errore.
categoria: "Società"

# Parole chiave del pezzo. Da 2 a 5, in minuscolo.
tag: ["esempio", "istruzioni"]

# Immagine di copertina. Mettila in questa stessa cartella e scrivi
# il nome qui sotto. Astro la converte in WebP e la ridimensiona da sola.
# Se metti l'immagine, immagineAlt diventa obbligatoria.
# immagine: "./nome-immagine.jpg"
# immagineAlt: "Descrizione di cosa si vede nella foto, per chi non la può vedere."

# true = visibile solo in locale. Mettilo a false quando vuoi pubblicare.
bozza: true

# true = l'articolo va in cima alla homepage. Tienilo su uno solo per volta.
inEvidenza: false
---

Il primo paragrafo è il più importante di tutto il pezzo. Chi legge decide qui se continuare, e Google spesso pesca proprio da qui l'anteprima nei risultati. Vai dritto al punto: qual è il problema, e perché riguarda chi sta leggendo.

Evita l'introduzione che introduce l'introduzione. Il lettore è già arrivato: non serve accompagnarlo all'ingresso.

## I sottotitoli servono a due cose

Spezzano il testo per chi legge dal telefono, e dicono a Google com'è organizzato il ragionamento. Usane uno ogni tre o quattro paragrafi.

Scrivili come frasi di senso compiuto ("Perché i numeri non tornano") e non come etichette vuote ("Analisi"). Un sottotitolo deve funzionare anche letto da solo, saltando il resto.

### Il livello successivo, se serve

I sottotitoli di terzo livello si usano solo dentro una sezione già aperta. Se un articolo ne ha bisogno spesso, di solito vuol dire che erano due articoli distinti.

## Come si scrive

Il **grassetto** serve a far risaltare un concetto ogni tanto. Se lo usi in ogni paragrafo non risalta più niente.

I collegamenti si scrivono così: [testo del link](https://esempio.it). Metti sempre il link alla fonte originale, non all'articolo di giornale che parlava della fonte.

> Le citazioni vanno in questo formato. Servono per riportare le parole esatte di qualcuno, non per evidenziare frasi tue.

Gli elenchi funzionano quando ci sono cose davvero separate da elencare:

- Un punto per ogni idea distinta
- Frasi brevi, non paragrafi camuffati
- Se ha più di sei voci, probabilmente è un paragrafo

## Prima di pubblicare

Rileggi con la checklist in `CHECKLIST-SEO.md`, poi metti `bozza: false` e pubblica.

Un ultimo consiglio: **collega almeno un altro tuo articolo** dentro il pezzo, quando c'è un aggancio vero. I collegamenti interni sono uno dei pochi fattori SEO che dipendono solo da te, e aiutano Google a capire quali sono i temi su cui il tuo sito ha qualcosa da dire.
