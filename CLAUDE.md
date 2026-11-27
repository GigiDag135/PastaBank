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
- Dal vivo (15 nov 2026): adattivo 1,3% / 0,65%, tetto 2× (max 3%), PiramidBoost = assetto 🏃 6.
- Monete: BTC, ETH, SOL. XRP spenta con /moneta XRP off (15 nov 2026, ricerca 039 nella cartella del Mac): la classifica
  usa solo le monete accese. Gli short intelligenti restano come sono (ricerca 040: nessuna variante migliore).
- Assetti 1-10 in server.js (ASSETTI): scelti su 61 combinazioni (2018-22 e 2022-26). Se cambi i numeri di un assetto,
  cambiali anche in Jeriko-OS (pepper/stima.html, index.html, scarica/jeriko-pepper.zip con riferimenti.json).
- Modalità ribasso (/ribasso on|off, set.ribasso, spenta di partenza): costanti RIB in server.js (media 50, efficienza 30 g
  > 0,25, long × 0,5, funding 7 g HL < 0,7 pb/g → niente short). Pepper (pepper/stima.js) la simula con gli stessi numeri:
  se li cambi, cambiali in tutti e due. Ricerche 044-047 nella cartella research del Mac.

## Ultime modifiche (al massimo 10 righe, togli le più vecchie)
- 27 nov: ricerca 113 (Mac): chiudere a mercato dopo 2/4/8 ore le operazioni sotto −0,5 R o in perdita. NON PASSA: la migliore
  +1,5% (2020-22) e −5,6% (2023-26). Lo stop a 2 ATR fa già il suo lavoro. Tema «riconoscere i perdenti» chiuso. Bot invariato.
- 27 nov: HyperSpeedUp/ (nome di Gigi): copia identica della strategia per provare modifiche senza toccare il bot. Ridà i numeri
  della 077 (107,9% / 147,2%). Dati con prendi-dati.sh (Release), confronto con node prova.js. Bot invariato.
- 27 nov: HyperSpeedUp, più operazioni (Gigi): classifica 2/3, +XRP, +sq2h/ema4h/kel4h/mom8h, +segnali Lighter nei giorni fermi: nessuna
  passa (più operazioni ma rapporto peggiore nel 2023-26). Lighter su BTC/ETH/SOL +0,07%/op, 2026 ~0: con le fee Hyperliquid perde.
- 27 nov: HyperSpeedUp prove 1-3 (Gigi): classifica 2 con meno rischio e squeeze 2h solo da ferma: no. Segnali Lighter più forti (>95° perc.
  90 g) su BTC/ETH/SOL con fee HL: positivi ogni anno 2022-26, t 2,3; nel bot +60 op/anno, 110→123%/anno, discesa 19→20% (prova-3b.js). Da confermare.
- 27 nov: ricerca 110 (Mac, verifica-110.js): prova 3 su apr 2018-dic 2021 mai visti NON PASSA (2018-19 −0,20%/op, t 1,7, senza il 5% migliore
  negativo; nel bot 139→161%/anno ma per gli anni forti). Niente attivazione. Bot invariato.
