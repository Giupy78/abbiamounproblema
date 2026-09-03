# Come si pubblica un articolo

Ci sono due strade. Il **pannello** non richiede di toccare file né comandi; i **comandi** servono se preferisci lavorare dal computer.

---

## Il pannello di scrittura (la via semplice)

Indirizzo: **abbiamounproblema.it/admin**

Accedi con GitHub e ti trovi un editor visuale: scrivi, formatti con i pulsanti, trascini le immagini dentro la pagina, premi **Publish**. Circa un minuto dopo l'articolo è online.

Funziona da qualsiasi computer e anche dal telefono: non serve avere il progetto sul dispositivo che stai usando.

**Cosa fare al primo articolo:**

1. Apri `/admin` e premi *Login with GitHub*
2. **Articoli** → **New Articolo**
3. Compila i campi. Titolo e descrizione hanno dei limiti di lunghezza: il pannello ti avvisa se sfori
4. Tieni **Bozza** acceso finché non è pronto, poi spegnilo
5. **Publish**

> **Della data non ti devi più occupare.** `Data di pubblicazione` è il giorno in cui l'articolo diventa pubblico, non quello in cui hai cominciato a scriverlo — e se un pezzo resta in bozza qualche giorno quella scritta all'inizio diventa sbagliata. Adesso la corregge da sola: quando spegni **Bozza** e pubblichi, un'automazione su GitHub rimette la data di oggi e salva la correzione. La vedi comparire nel pannello dopo un minuto o due.
>
> Interviene solo se la data l'hai lasciata com'era, cioè solo quando te ne sei dimenticato. **Se la cambi tu mentre pubblichi, quella che hai scritto resta**: serve per i casi in cui una data diversa da oggi è voluta, per esempio una proposta che deve uscire con la data dell'articolo a cui è collegata.

> **Chi va in cima alla homepage si decide da solo.** In apertura c'è sempre l'articolo con la data di pubblicazione più recente: se la data è giusta, non devi fare nient'altro. L'interruttore *In evidenza* serve soltanto all'eccezione — tenere su un pezzo più vecchio — e vale **su un articolo per volta**: se lo accendi su due, la pubblicazione si ferma e ti dice quali sono, invece di scegliere per conto suo.

Un avvertimento che vale la pena ricordare: **non cambiare il titolo di un articolo già pubblicato** se questo modifica il suo indirizzo. I link esistenti, compresi quelli su Google, smetterebbero di funzionare.

### Se il pannello non ti fa entrare

Le cause sono quasi sempre queste tre:

- Le variabili `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` non sono impostate nel progetto Cloudflare Pages (*Settings → Environment variables*), oppure sono state aggiunte dopo l'ultima pubblicazione: in quel caso serve un nuovo deploy perché diventino attive
- L'indirizzo di ritorno configurato nell'applicazione GitHub non coincide con quello del sito da cui stai accedendo
- Stai usando `abbiamounproblema.pages.dev` mentre la configurazione punta al dominio vero, o viceversa

L'indirizzo di ritorno da impostare su GitHub è: `https://abbiamounproblema.it/api/callback`

---

## Prima volta: le cose da compilare

Apri **`src/config.ts`** e sostituisci tutti i valori segnati con `DA COMPILARE`:

- il tuo nome e cognome reali
- il ruolo (es. "Autore e curatore del sito")
- due o tre righe di biografia
- l'indirizzo email di contatto

Poi apri **`src/pages/chi-sono.astro`** e riscrivi con parole tue i due paragrafi segnati `DA COMPILARE`.

Non è formalità: Google valuta l'affidabilità di chi scrive, e un sito di attualità senza un autore riconoscibile viene posizionato peggio. È il punto in cui un sito di opinione si gioca la credibilità, con i lettori prima ancora che con i motori di ricerca.

Dopo aver cambiato nome o slogan del sito, rigenera l'immagine di anteprima social:

```bash
npm run immagine-social
```

---

## I tre comandi che userai sempre

Aprili nella cartella del progetto (`C:\Users\Utente\Progetti\abbiamounproblema`).

**Vedere il sito mentre lavori** — si aggiorna da solo a ogni salvataggio:

```bash
npm run dev
```

Poi apri **http://localhost:4321** nel browser.

> **Da sapere:** Astro avvia il server *staccato dal terminale*. Il comando finisce subito e ti restituisce il prompt, ma il server **resta acceso**: `Ctrl + C` non lo ferma e chiudere la finestra nemmeno. Continua a funzionare finché non lo spegni o non riavvii il computer.

Per fermarlo:

```bash
npm run dev:stop
```

Per sapere se è acceso:

```bash
npm run dev:stato
```

Se `localhost:4321` dà errore, quasi sempre è perché il server non è in funzione: lancia `npm run dev`.

**Controllare che sia tutto a posto** prima di pubblicare:

```bash
npm run build
```

Se c'è un errore te lo dice qui, con il nome del file da correggere. Meglio scoprirlo adesso che online.

**Pubblicare**:

```bash
git add . ; git commit -m "Nuovo articolo: titolo del pezzo" ; git push
```

Da qui in poi fa tutto Cloudflare: se ne accorge da solo, ricostruisce il sito e lo mette online. Ci mette circa un minuto.

---

## Scrivere un articolo nuovo

**1.** Vai in `src/contenuti/articoli/`.

**2.** Copia un articolo esistente e rinominalo, così ti porti dietro l'intestazione già compilata. Il nome del file diventa l'indirizzo della pagina:

| Nome del file | Indirizzo online |
|---|---|
| `caro-affitti.md` | `abbiamounproblema.it/caro-affitti` |
| `sanita-liste-attesa.md` | `abbiamounproblema.it/sanita-liste-attesa` |

Regole per il nome: solo minuscole, numeri e trattini. Niente spazi, niente accenti, niente maiuscole. Tienilo corto e comprensibile: è un pezzo di indirizzo che la gente legge.

> **Attenzione:** una volta pubblicato, **non cambiare più il nome del file**. L'indirizzo cambierebbe e tutti i link a quell'articolo — compresi quelli su Google e quelli condivisi dalle persone — smetterebbero di funzionare.

**3.** Compila l'intestazione (la parte tra i due `---`) e scrivi il pezzo sotto.

**4.** Metti `bozza: false` quando è pronto.

**5.** Lancia `npm run build` per il controllo, poi pubblica con i comandi git qui sopra.

---

## I campi dell'intestazione

| Campo | Obbligatorio | Cosa ci va |
|---|---|---|
| `titolo` | sì | 15–70 caratteri |
| `descrizione` | sì | 70–170 caratteri, il testo che appare su Google |
| `dataPubblicazione` | sì | formato `2026-08-11` |
| `dataAggiornamento` | no | solo quando modifichi un pezzo già pubblicato |
| `categoria` | sì | una di quelle elencate in `src/config.ts` |
| `tag` | no | 2–5 parole chiave |
| `immagine` | no | `"./nome-foto.jpg"`, nella stessa cartella |
| `immagineAlt` | se c'è l'immagine | descrizione di cosa si vede |
| `bozza` | no | `true` = non pubblicato |
| `inEvidenza` | no | `true` solo per trattenere in cima un pezzo più vecchio |

I limiti di lunghezza vengono verificati alla compilazione: se sfori, `npm run build` si ferma e ti dice quale articolo correggere.

---

## Le immagini

Metti il file nella stessa cartella dell'articolo e richiamalo con `immagine: "./nome-file.jpg"`.

Astro la converte automaticamente in WebP, la ridimensiona per ogni tipo di schermo e ne dichiara le dimensioni nella pagina. Non devi ottimizzare niente a mano.

Due accortezze:

- **Carica immagini grandi** (almeno 1600 pixel di larghezza): rimpicciolire è automatico, ingrandire no.
- **Usa solo immagini che puoi usare.** Su un sito di attualità le foto prese da Google sono il modo più rapido per ricevere una richiesta di risarcimento. Fonti gratuite e sicure: Unsplash, Pexels, Wikimedia Commons.

---

## Correggere un articolo già pubblicato

1. Modifica il testo.
2. Aggiungi (o aggiorna) `dataAggiornamento` nell'intestazione.
3. Se la correzione riguarda un fatto, scrivilo in fondo all'articolo:

```markdown
---

*Aggiornamento dell'11 agosto 2026: nella versione precedente avevo scritto X.
Il dato corretto è Y. Grazie a chi lo ha segnalato.*
```

4. Pubblica come al solito.

Correggere in chiaro invece che in silenzio è la scelta che, alla lunga, distingue un sito credibile da uno che non lo è.

---

## Cambiare il menu del sito

Dal pannello: **Impostazioni → Menu del sito**.

Puoi rinominare le voci, cambiare dove portano, trascinarle per riordinarle, aggiungerne e toglierne. Le modifiche valgono sia per la barra in alto sia per l'elenco in fondo alla pagina: sono la stessa cosa.

Due regole che il pannello fa rispettare da solo:

- **il testo di una voce sta in 24 caratteri**, altrimenti la barra va a capo
- **l'indirizzo comincia con `/` e non finisce con `/`**: si scrive `/archivio`, non `archivio/`

Se sbagli, la pubblicazione si ferma e ti dice quale voce e quale campo correggere. Il sito online resta quello di prima finché non è a posto.

---

## Modificare le pagine che non sono articoli

Alcune pagine non sono articoli e non compaiono nell'elenco Articoli: sono in **Impostazioni**, ciascuna con il proprio nome.

Funzionano come un articolo — scrivi, salvi, il sito si aggiorna — ma hanno campi propri, perché la loro struttura è fissa. Anche qui il flag **Tienila in bozza** decide se sono visibili: acceso, la pagina esiste ma la raggiungi solo tu digitando l'indirizzo; spento, diventa pubblica.

> **Attenzione:** togliere la bozza a una pagina non la mette nel menu. Sono due passaggi distinti, e il secondo si fa in *Impostazioni → Menu del sito*.

---

## Aggiungere una categoria

Aprila `src/config.ts`, aggiungi il nome all'elenco `CATEGORIE`, salva. La pagina della nuova categoria, il link nel menu a piè di pagina e la sitemap si aggiornano da soli.

---

## Nomi di file che non puoi usare

Sono già occupati dalle pagine fisse del sito:

`archivio` · `categoria` · `chi-sono` · `contatti` · `privacy` · `404` · `rss.xml` · `sitemap-index.xml`

---

## Se qualcosa non funziona

**`npm run build` dà errore** — leggi le ultime righe: c'è scritto il file e il campo che non va. Nove volte su dieci è un limite di lunghezza sforato o una categoria scritta in modo diverso da quelle in `config.ts`.

**Il sito online non si aggiorna** — controlla su Cloudflare, sezione *Deployments*, se l'ultima compilazione è andata a buon fine. Se è in rosso, il log dice cosa si è rotto.

**Un articolo non compare** — quasi sempre è rimasto `bozza: true`.
