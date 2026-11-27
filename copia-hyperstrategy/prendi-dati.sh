#!/bin/sh
# Scarica le candele 15 min (BTC ETH SOL 2017-2026) dalla Release privata dati-ricerche (pacchetto della ricerca 077) in dati/. Lanciare sul Mac.
cd "$(dirname "$0")" && mkdir -p dati && cd dati && gh release download dati-ricerche -R GigiDag135/Jeriko-OS -p ricerca-077.tgz --clobber \
 && tar xzf ricerca-077.tgz --strip-components=1 077-codice/BTC.csv 077-codice/ETH.csv 077-codice/SOL.csv 077-codice/XRP.csv 077-codice/vecchi && rm ricerca-077.tgz && ls
