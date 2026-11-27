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
- 27 nov: HyperSpeedUp/ (nome di Gigi): copia identica della strategia per provare modifiche senza toccare il bot. Ridà i numeri
  della 077 (107,9% / 147,2%). Dati con prendi-dati.sh (Release), confronto con node prova.js. Bot invariato.
- 27 nov: HyperSpeedUp, più operazioni (Gigi): classifica 2/3, +XRP, +sq2h/ema4h/kel4h/mom8h, +segnali Lighter nei giorni fermi: nessuna
  passa (più operazioni ma rapporto peggiore nel 2023-26). Lighter su BTC/ETH/SOL +0,07%/op, 2026 ~0: con le fee Hyperliquid perde.
- 27 nov: HyperSpeedUp prove 1-3 (Gigi): classifica 2 con meno rischio e squeeze 2h solo da ferma: no. Segnali Lighter più forti (>95° perc.
  90 g) su BTC/ETH/SOL con fee HL: positivi ogni anno 2022-26, t 2,3; nel bot +60 op/anno, 110→123%/anno, discesa 19→20% (prova-3b.js). Da confermare.
- 24 nov: ricerca 077 (Mac): HyperStrategy ferma dal 5 nov (BTC 80.500 → 59.800, volatilità al 98-100° percentile): simulazione identica, zero
  aperture: è la strategia. 3 prove fissate prima: ATR 7 (no, B peggio), short di crollo BTC Donchian 4h (no, A peggio), Lighter ×1,2 nei giorni fermi (no).
  Short di crollo con precedenza al long (P2b, scelta dopo): A 111% contro 108%, B 158% contro 147%; nel bot intero su BTC 2012-17
  (mai visto) 111,8% contro 111,9%: chiuso. Il bot di oggi su 2014-17 mai visto: ogni anno in attivo (2014 +25%). Bot invariato.
- 23 nov: ricerca 076 (Mac, solo analisi): percorsi delle 756 operazioni 2020-26. Grandi vincite poco riconoscibili nelle prime ore
  (AUC 0,58 a 1 h, ~0,7 a 2-8 h); sopra +1 R a 2 h 19% diventano >10 R (contro 4%): è già PiramidBoost. Le oltre 20 R restituiscono
  in mediana 16,6 R prima del segnale opposto: unico punto aperto è l'uscita dopo +10 R. Bot invariato.
- 23 nov: ricerca 075 (Mac): modello che stima la probabilità di grandi vincite (> 5 R) su 14 monete, regole di Gigi fissate prima.
  Forti peggio dei normali in 2020-22 e 2023-26 (R medio 0,71/0,94 contro 1,23/1,08); oltre 20 R il modello si rovescia fra i periodi.
  Le grandi vincite non si vedono all'entrata. Tema «modello sui segnali» chiuso (4 prove). Bot invariato.
- 23 nov: ricerca 074 (Mac): modello che impara da 14.866 segnali su 14 monete e dà solo la forza (forti rischio ×1,5, strategia uguale).
  I «forti» vanno PEGGIO degli altri (2023-26 R medio +0,48 contro +1,27): il modello ritrova solo il filtro di volatilità. Bot invariato.
- 23 nov: ricerca 073 (cartella research del Mac): HyperStrategy «che impara» come LighterStrategy. M1 meta-modello mese per mese: previsione
  al contrario del risultato (correlazione −0,09/−0,22), peggio del filtro; M2 soglia di volatilità che si adatta: meglio 2020-22, peggio 2023-26.
  Fermate a metà, niente prova col bot. Solo ~200 segnali l'anno: troppo pochi per imparare. Filtro 50° resta. Bot invariato.
- 21 nov: lettura sicura del saldo (decisione di Gigi, senza interruttore): lettura incompleta (spot mancante) = scartata, non 0 $
  (hl.js incompleto, accountSicuro 3 tentativi; doOpen/doAdd non inviano); blocco del 5% solo con due letture di fila. Gigi è passato all'assetto 7.
  FATTO (25 nov, controllo sul server): lettura sicura e Sentinella installate, 5 servizi attivi. Dal 5 nov nessun segnale ha passato i filtri
  (0 Squeeze 4h, tutti gli altri scartati dalla volatilità): il silenzio del registro è spiegato. RESTA: /stato del conto Tommaso (bot acceso?); il
  conto nuovo non ha ancora avuto un segnale valido. Non spiegato: blocco 5% dell'8 nov su [Gigi] senza operazioni nel registro letto.
