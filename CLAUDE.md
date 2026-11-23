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
- 23 nov: ricerca 073 (cartella research del Mac): HyperStrategy «che impara» come LighterStrategy. M1 meta-modello mese per mese: previsione
  al contrario del risultato (correlazione −0,09/−0,22), peggio del filtro; M2 soglia di volatilità che si adatta: meglio 2020-22, peggio 2023-26.
  Fermate a metà, niente prova col bot. Solo ~200 segnali l'anno: troppo pochi per imparare. Filtro 50° resta. Bot invariato.
- 22 nov: ricerca 064 (cartella research del Mac, regola fissata prima): segnali scartati dal filtro di volatilità divisi per modalità ribasso.
  Mercato agitato E in discesa: kel1h, mom1h e short perdono tutti nel 2023-26 (short −17 R). Unica casella buona (mom1h agitato senza ribasso)
  peggiora il bot in ogni periodo (2023-26 rapporto 7,78 → 4,66). Bot invariato. 1-5 nov rifatti: stesse 5 operazioni del vivo; DA VEDERE:
  dal vivo il rischio adattivo non è sceso dopo le perdite (~1,2% ciascuna invece di 0,65%).
- 21 nov: ricerca 063 (cartella research del Mac, dati 2017-2026, scelta 2018-22, fuori campione 2023-26): nessuna strategia per il mercato agitato
  regge: 0 su 29 finaliste e 0 su 455 combinazioni migliorano il bot fuori campione; gli short col mercato agitato perdono sempre. Bot invariato.
  LighterStrategy rende +0,40%/giorno proprio quando HyperStrategy è ferma (+0,15% gli altri giorni): diviso 70/30 discesa 15,7% invece di 20%.
- 21 nov: ricerca 062 (filtro di volatilità, assetto 7, BTC/ETH/SOL, ott 2022-11 nov 2026): HyperStrategy ferma dal 5 nov perché la volatilità
  è sopra il 50° percentile (kel1h, mom1h, kelS entrano solo sotto: segnali scartati in silenzio). Filtro 50 il migliore in OGNI anno; senza filtro
  +1.209% contro +2.842%, PF 1,36 contro 1,90; 60/70/80, metà rischio, solo long/short tutti peggio. Bot invariato. Tutte e 3 sopra il filtro 31% dei giorni.
- 21 nov: Sentinella di Pepper (decisione di Gigi, interruttore SENTINELLA in server.js): con allarme 🔴/⛔ su Hyperliquid in
  ~/jeriko-pepper/data/sentinella.json doOpen e doAdd non inviano (sentinellaFerma); file mancante, spento o vecchio > 10 min = apre normalmente.
- 21 nov: lettura sicura del saldo (decisione di Gigi, senza interruttore): lettura incompleta (spot mancante) = scartata, non 0 $
  (hl.js incompleto, accountSicuro 3 tentativi; doOpen/doAdd non inviano); blocco del 5% solo con due letture di fila. Gigi è passato all'assetto 7.
  DA FARE: Gigi deve lanciare aggiorna.sh sul server; poi leggere registro.log (grep ignorato|non eseguito|non inviato|Perdita di oggi):
  il wallet 0x8294… non ha MAI operato (ultime operazioni 5 nov sul wallet vecchio 0xe2d5…): capire perché.
- 17 nov: ricerca 048: modalità ribasso moneta per moneta provata e scartata (più discesa nel 2022-26): resta solo BTC.
- 17 nov: modalità ribasso (/ribasso on|off): long a metà e short in più nel ribasso efficiente, niente short con funding
  basso; /stato, avviso giornaliero, set.ribasso/ribassoOggi/fund7 nel resoconto a Jeriko. 25 prove con mercato finto.
- 15 nov: XRP spenta dal bot (/moneta XRP off), nessuna modifica al codice.
- 15 nov: assetti rifatti con la prova di 61 combinazioni (adattivo o fisso+Ibrido, sempre PiramidBoost); il bot di oggi è il 6.
