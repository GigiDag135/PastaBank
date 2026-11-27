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
- 27 nov: ricerca 118 (griglia-118.js): griglia BTC con stop solo col bot fermo. NON PASSA: +33%/anno 2018-22 ma +2% 2023-26 (−4% a taker);
  insieme al bot peggiora il rapporto nel 2023-26. Bot invariato.
- 27 nov: ricerca 117 (walkforward-117.js): parametri scelti ogni anno sui 3 anni prima → efficienza 58-59%, 56-60%/anno nel 2021-26,
  2022 −6/−7%. Parametri di oggi vicini a quelli scelti, solo più fortunati nel 2022-26. Bot invariato.
- 27 nov: ricerca 116 (solidita-116.js): 92/92 partenze di 12 mesi in guadagno, batte entrate a caso 199/200. Parametri di oggi 1° su 81 nel
  2022-26 ma 67° nel 2018-21: scelti nel 2021 → 47%/anno, disc. 32%. Aspettativa realistica 50-70%/anno, disc. 25-32%. Bot invariato.
- 27 nov: ricerca 115 (solidita-115.js): solidità. Parametri ±20%, costi ×2-3, ritardi, 5 monete mai usate: sempre in guadagno, ma nel
  2023-26 i parametri sono al picco e fuori da BTC/ETH/SOL rende 5-22%/anno. Monte Carlo 1 anno: discesa 1 su 100 = 36%. Soglie proposte a Gigi.
- 27 nov: ricerca 114 (Mac): uscita più stretta dopo +10 R (massimo −3/−5/−8 R o metà del massimo). NON PASSA: perde dal 19% al 53%
  della somma R. L'uscita al segnale opposto resta la migliore. Bot invariato.
