# PastaBank / CashMkr · istruzioni per Claude

Leggilo all'inizio di ogni sessione. Aggiornalo alla fine (ultima sezione). Tienilo corto.

## Come si lavora
- GitHub (GigiDag135/PastaBank, branch main) è l'unica versione buona: `git pull` prima di iniziare, push su main alla fine.
  Mai far caricare a Gigi uno zip sopra il repository.
- PRIMA di modificare CashMkr: scrivi la proposta nella risposta e aspetta il suo ok. Poi costruisci.
- Ogni funzione nuova ha un interruttore (comando Telegram o impostazione).
- Consegne sempre complete: lo zip intero, mai file singoli da sostituire a mano.
- Gigi non è un programmatore: italiano semplice, passi concreti, dove lanciare ogni comando (Mac o server).
- Mai inserire password o chiavi. Le chiavi di Hyperliquid restano solo sul server.
- Leggi solo i file che servono (server.js è grande: cerca con grep).

## Com'è fatto
- index.html: CashMkr nel browser (GitHub Pages), si apre anche dal PC di PastaCrypto in Jeriko OS.
- cashmkr-server.zip → cartella cashmkr-server/: il bot sul server Oracle (Ubuntu, utente ubuntu).
  server.js (bot Telegram e ordini), lib/core.js (strategia PastaBank v1), lib/engine.js, lib/hl.js (Hyperliquid).
  Guida per Gigi: LEGGIMI-SERVER.txt (aggiornala quando cambi i comandi). Aggiornamento sul server: aggiorna.sh.
  Per modificarlo: scompatta, modifica, ricompatta lo zip intero.
- Il bot manda a Jeriko OS (/api/cashmkr, segreto CASHMKR_SECRET) conti e impostazioni (`set`), che Pepper usa per le stime.
- Strategia: PastaBank v1 su BTC/ETH/SOL/XRP. Si torna alla V.2 solo se lo chiede Gigi.

## Impostazioni dal vivo
- Rischio adattivo acceso, "Solo la più forte" (/classifica 1), PiramidBoost acceso, Ibrido acceso (non agisce con l'adattivo).

## Ultime modifiche (al massimo 10 righe, togli le più vecchie)
- 13 nov: /classifica 1|2 (long solo sulla moneta più forte); il resoconto a Jeriko include le impostazioni di rischio.
