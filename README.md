# abbiamounproblema.it

Sito di analisi e opinioni su temi di attualità. Costruito con [Astro](https://astro.build), pubblicato su Cloudflare Pages.

## Da leggere per primi

| File | A cosa serve |
|---|---|
| **[COME-PUBBLICARE.md](COME-PUBBLICARE.md)** | Come si scrive e si pubblica un articolo |
| **[CHECKLIST-SEO.md](CHECKLIST-SEO.md)** | Cosa controllare prima di pubblicare |

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Avvia il sito in locale su http://localhost:4321 (resta acceso in background) |
| `npm run dev:stop` | Spegne il server locale |
| `npm run dev:stato` | Dice se il server locale è acceso |
| `npm run build` | Compila il sito e verifica che non ci siano errori |
| `npm run preview` | Mostra il sito compilato, come sarà online |
| `npm run immagine-social` | Rigenera l'immagine di anteprima per le condivisioni |
| `npm run controlla` | Controllo approfondito di tipi e collegamenti |

## Com'è organizzato

```
src/
  config.ts                  Nome del sito, autore, categorie, menu
  content.config.ts          Struttura di un articolo e regole di validazione
  contenuti/articoli/        GLI ARTICOLI — un file .md per pezzo
  pages/                     Le pagine del sito
    [...slug].astro          Pagina del singolo articolo
    index.astro              Homepage
    archivio.astro           Elenco completo
    categoria/               Una pagina per categoria
    rss.xml.js               Feed RSS
  components/
    SEO.astro                Meta tag, anteprime social, dati strutturati
  layouts/                   Impalcatura comune delle pagine
  styles/global.css          Tutto lo stile del sito
public/
  _headers                   Intestazioni HTTP lette da Cloudflare
  robots.txt                 Istruzioni per i motori di ricerca
  og-default.png             Immagine di anteprima predefinita
```

## Scelte tecniche

**Sito statico.** Le pagine sono HTML già pronto, generato alla pubblicazione. Nessun database, nessun codice eseguito a ogni visita: il sito regge qualsiasi picco di traffico a costo zero e non ha una superficie d'attacco da mantenere aggiornata.

**Nessun font esterno.** Si usano i caratteri già presenti sul dispositivo del lettore: la pagina appare subito e non viene inviato alcun dato ai server di Google.

**Nessun cookie di profilazione**, allo stato attuale. L'unica cosa memorizzata è la preferenza tra tema chiaro e scuro, e solo se il lettore preme il pulsante.

> Quando verrà attivata la pubblicità questo non sarà più vero. Servirà un banner di consenso ai cookie con un gestore certificato da Google, e la pagina `src/pages/privacy.astro` andrà riscritta di conseguenza. Sono passaggi obbligatori, non facoltativi.

**Tavolozza neutra.** Niente rosso e niente blu come colori identitari: in Italia hanno un significato politico immediato, e questo è un sito che non vuole essere letto come schierato prima ancora di essere letto.

## Pubblicazione

Ogni `git push` sul ramo principale fa ricostruire e ripubblicare il sito da Cloudflare Pages. Ci vuole circa un minuto.
