/**
 * Genera public/og-default.png, l'immagine mostrata quando un link del sito
 * viene condiviso su WhatsApp, Facebook, X, LinkedIn o Telegram.
 *
 * Si lancia con:  npm run immagine-social
 *
 * Rilancialo dopo aver cambiato il nome o lo slogan del sito in src/config.ts.
 */
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Letti a mano dal file di configurazione per non dover compilare TypeScript
// solo per generare un'immagine.
const configurazione = await import(`file://${radice}/src/config.ts`).catch(() => null);

const NOME = configurazione?.SITO?.nome ?? 'Abbiamo un problema';
const SLOGAN = configurazione?.SITO?.slogan ?? 'Dal problema alla proposta';
const DOMINIO = 'abbiamounproblema.it';

// La banda superiore riprende il tricolore della cartina in homepage.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#161513"/>
  <rect x="0" y="0" width="400" height="10" fill="#3aa971"/>
  <rect x="400" y="0" width="400" height="10" fill="#e8e4dc"/>
  <rect x="800" y="0" width="400" height="10" fill="#d9564b"/>
  <text x="90" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="82" font-weight="700" fill="#ece9e3">${NOME}</text>
  <text x="90" y="368" font-family="Georgia, 'Times New Roman', serif" font-size="36" fill="#a29c92">${SLOGAN}</text>
  <rect x="90" y="430" width="72" height="4" fill="#d9a441"/>
  <text x="90" y="500" font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="3" fill="#d9a441">${DOMINIO.toUpperCase()}</text>
</svg>`;

await mkdir(`${radice}/public`, { recursive: true });

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
await writeFile(`${radice}/public/og-default.png`, png);

console.log(`Creata public/og-default.png (${Math.round(png.length / 1024)} KB)`);
