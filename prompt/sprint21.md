Devi implementare la **prima funzione reale della fase Pubblica Amministrazione (PA)** del nostro MVP vehicle sharing, seguendo rigorosamente la Vertical Slice Architecture già presente nel monorepo.

Questo sprint trasforma il primo segnaposto PA (predisposto dallo Sprint 20) in una funzione end-to-end:

- **IF18 - AP.01**: Un'interfaccia analitica che riporti il numero **giornaliero di corse avviate**, suddivise per **tipologia di veicolo**.

L'altra funzione PA pianificata NON fa parte di questo sprint e resta segnaposto disabilitato/"presto disponibile" nella shell PA:

- **IF19 - AP.04.1 + IF21 - AP.04.3**: aree geografiche delimitate (Geofence) per cantieri stradali + blocco conclusione noleggio al loro interno. → resta segnaposto. Nessuna logica, nessun enforcement su `EndRide`.

In questo sprint la voce di nav **"Analisi corse" smette di essere un segnaposto** e diventa una pagina reale.

---

## Premessa importante: dipendenza da Sprint 17, 18, 19 e 20

Questo sprint **presuppone che Sprint 17 (IF23), Sprint 18 (IF27 + schema reale), Sprint 19 (IF30 + `VehicleStatus.BLOCKED`) e soprattutto Sprint 20 (init PA) siano già stati implementati**, quindi assume che esistano:

- la **shell PA desktop-first** introdotta in Sprint 20: `AdminLayout` (+ eventuale `AdminHeader`/sidebar leggera) in `apps/web/src/components/layout/`, distinta da `OperatorLayout` e dalla `BottomNav` rider;
- la rotta `apps/web/src/app/admin/page.tsx` (home/overview PA) e il redirect/guard di ruolo `ADMIN → /admin` (utente non `ADMIN` su `/admin` → redirect a `/`), basati sull'helper di risoluzione utente/ruolo corrente (`apps/web/src/lib/use-current-user.ts` o equivalente). NON duplicarlo;
- la nav PA con le due voci: **"Analisi corse" (IF18, oggi segnaposto disabilitato)** e "Aree cantiere (Geofence)" (IF19/IF21, segnaposto disabilitato);
- lo **scaffolding di contratti IF18 introdotto in Sprint 20**, in particolare (VERIFICA che esistano davvero, vedi sotto):
  - `IRideRepository.findStartedBetween(from: Date, to: Date): Promise<Ride[]>` in `packages/contracts/src/interfaces/index.ts`;
  - i tipi di trasporto `DailyRidesByType` e `RideAnalyticsResponse` in `packages/contracts/src/types/index.ts`;
  - l'implementazione `DrizzleRideRepository.findStartedBetween` in `apps/api/src/adapters/db/DrizzleRideRepository.ts` (lettura semplice per intervallo);
  - il seed corse (`apps/api/src/db/seed.ts`) arricchito con `rides` distribuite su **più giorni** e su **più `VehicleType`**;
- la predisposizione del namespace API PA `/api/admin` (commento segnaposto in `apps/api/src/app.ts`, o router diagnostico minimale, secondo la scelta dichiarata in Sprint 20).

Se, aprendo il codice, scopri che Sprint 17/18/19/20 NON sono ancora stati implementati (manca `AdminLayout`, manca `/admin`, manca il redirect/guard `ADMIN`, **mancano `findStartedBetween` / `DailyRidesByType` / `RideAnalyticsResponse`**, manca il seed corse multi-giorno/multi-tipo), **fermati e segnalalo**: non reimplementarli dentro questo sprint, non improvvisare shell, contratti o seed parziali. Produci una nota chiara e attendi indicazioni.

> Nota raccolta dallo Sprint 20 (NON da risolvere qui): `apps/api/src/slices/EndRide/EndRide.handler.ts` è di fatto un handler Express `(req, res)` e non un handler puro come prescrive la convenzione VSA. Questo sprint **non tocca `EndRide`** (IF18 è sola lettura e non ha nulla a che vedere con la conclusione del noleggio): l'eventuale allineamento al pattern resta una valutazione del futuro sprint IF21, che modificherà `EndRide` per l'enforcement geofence. Qui lascialo invariato.

---

## Contesto verificato (confermato via Graphify + lettura codebase)

- monorepo Turborepo + pnpm
- frontend: `apps/web` — Next.js 14 App Router, React, Tailwind, shadcn/ui, TanStack Query, zustand
- backend: `apps/api` — Express + TypeScript
- shared kernel / contratti: `packages/contracts`
- database: SQLite + Drizzle ORM

Stato dominio rilevante (VERIFICATO):

- **Ruolo PA = `UserRole.ADMIN`** (Sprint 20). Utenti demo ADMIN: `u4` → `marco.dipalma@mvp.local`, `u5` → `giuseppe.dicosola@mvp.local` (password `password`).
- **Corse**: `Ride` (`packages/contracts/src/types/index.ts`) ha `startedAt: Date`, `vehicleId`, `status` (`RideStatus.ACTIVE | PAUSED | ENDED`), ecc. "Corsa avviata" = corsa con `startedAt` valorizzato (tutte le corse lo hanno alla creazione). **IF18 conta le corse per `startedAt`, indipendentemente dallo `status`**: una corsa ancora `ACTIVE` o `PAUSED` è comunque stata "avviata" quel giorno. Dichiaralo come assunzione.
- **Tipologia veicolo**: `VehicleType` (`SCOOTER`, `BIKE`, `MOPED`, `CAR`). Il tipo di una corsa si ricava da `vehicleRepo.findById(vehicleId).type` (o, più efficiente, da una mappa `vehicleId → type` costruita una volta sola — vedi B.2).
- **Lettura per intervallo**: `IRideRepository.findStartedBetween(from, to)` (Sprint 20) ritorna le corse con `startedAt ∈ [from, to]`. **Il repository resta "dumb"**: nessuna aggregazione lato repository. Il raggruppamento giornaliero-per-tipo è responsabilità dell'**handler** della slice IF18.
- **Tipi di trasporto già dichiarati** (Sprint 20), da consumare ora:
  - `DailyRidesByType`: `{ date: string; /* YYYY-MM-DD */ countsByType: Partial<Record<VehicleType, number>>; total: number }`
  - `RideAnalyticsResponse`: `{ days: DailyRidesByType[]; from: string; to: string }`

Convenzioni VSA (già in uso, non negoziabili):

- Slice API: `Slice.types.ts` + `Slice.handler.ts` + `Slice.router.ts`. Handler puro `createXHandler(deps)`, router solo HTTP, wiring nel composition root, mount in `app.ts`.
- Adapter concreti (repository/service) in `apps/api/src/adapters`, MAI dentro le slice.
- Slice web: `Slice.types.ts` + `Slice.hook.ts` + `Slice.page.tsx`, route in `apps/web/src/app/<route>/page.tsx`.
- Web e API condividono tipi SOLO via `@mvp/contracts`.

---

## Decisioni MVP già fissate (NON rimetterle in discussione)

1. **Aggregazione nell'handler, non nel repository.**
   - L'handler chiama `findStartedBetween(from, to)`, risolve il `VehicleType` di ogni corsa e produce `RideAnalyticsResponse` (raggruppamento per giorno e per tipo). Il repository resta sola lettura per intervallo.
2. **Intervallo selezionabile lato client, default sensato.**
   - L'API accetta un intervallo (`from`/`to`) via query string; se assente usa un **default** (ultimi **7 giorni**, oggi incluso). La UI offre preset rapidi (es. 7 / 14 / 30 giorni). Niente date-picker complessi: preset + eventuale intervallo passato dall'hook.
   - L'API **normalizza** l'intervallo: `from` a inizio giornata, `to` a fine giornata, e include **tutti** i giorni dell'intervallo nell'output (anche quelli con 0 corse → `total: 0`, `countsByType: {}`), così la serie temporale non ha buchi.
3. **Convenzione data unica e dichiarata.**
   - Raggruppa per data secondo **una sola** convenzione (consigliato: data locale del server in formato `YYYY-MM-DD`, coerente con come il seed genera le `startedAt`). Usala in modo uniforme tra handler e UI e dichiarala come assunzione. Niente librerie di timezone.
4. **Visualizzazione schematica, niente librerie grafiche pesanti.**
   - Coerente con `CLAUDE.md` ("non aggiungere nuove librerie senza necessità reale") e con la "mappa schematica leggera" dello Sprint 17: il grafico è un **bar chart schematico costruito con div/CSS/Tailwind** (barre proporzionali, eventualmente impilate per tipo) + una **tabella** giorni × tipi. NIENTE `recharts`/`chart.js`/altre dipendenze.
5. **Sola lettura, nessuna mutazione.**
   - IF18 è analitica e read-only: nessuna scrittura, nessun nuovo stato, nessun impatto sui flussi rider/operatore.
6. **Auth invariata.** Resta il modello demo client-side (Sprint 17/20). Niente JWT/sessioni server.

---

## Vincoli architetturali non negoziabili

1. Nessun import tra slice. In particolare `RideAnalytics` **non** importa `FleetOverview`/`FaultRegistry`/`RemoteBlock` né le slice rider.
2. La nuova slice backend rispetta il pattern `RideAnalytics.types.ts` / `RideAnalytics.handler.ts` / `RideAnalytics.router.ts`.
3. Il router Express fa solo lavoro HTTP (parse query → handler → response); l'handler è puro (`createRideAnalyticsHandler(deps)`), tipizzato in input/output, senza dipendenze da Express. **L'aggregazione vive nell'handler.**
4. Le dipendenze concrete (repository) si risolvono nel composition root; riusa i `rideRepo`/`vehicleRepo` già presenti.
5. La nuova slice web rispetta `RideAnalytics.types.ts` / `RideAnalytics.hook.ts` / `RideAnalytics.page.tsx`.
6. Web e API condividono tipi SOLO via `@mvp/contracts` (`RideAnalyticsResponse`, `DailyRidesByType`, `VehicleType`).
7. Nessun adapter concreto dentro la slice; nessuna dipendenza da implementazioni concrete (dipendi da `IRideRepository`/`IVehicleRepository`).
8. Nessuna dipendenza circolare. Usa Graphify all'inizio e alla fine per confermarlo.

---

## PARTE A — Contracts (`packages/contracts`)

In linea di principio **lo scaffolding contratti IF18 è già completo dallo Sprint 20** (`findStartedBetween`, `DailyRidesByType`, `RideAnalyticsResponse`). Quindi:

- **Non ridefinire** ciò che già esiste. Verifica solo che i tipi siano esportati da `packages/contracts/src/index.ts`.
- Se, e solo se, manca qualcosa di minimale utile alla query (es. un tipo input condiviso), valuta di aggiungerlo qui, mantenendolo essenziale. **Preferenza: input `{ from?: string; to?: string }` locale alla slice**, senza aggiungere tipi condivisi non necessari.
- Se `findStartedBetween`/`DailyRidesByType`/`RideAnalyticsResponse` **non esistono** (Sprint 20 non fatto), **fermati e segnalalo** (vedi premessa): non introdurli qui improvvisando lo Sprint 20.

---

## PARTE B — Backend: slice `RideAnalytics` (sola lettura)

### B.1 Struttura

Crea `apps/api/src/slices/RideAnalytics/`:

- `RideAnalytics.types.ts`:
  - `RideAnalyticsDeps`: `{ rideRepo: IRideRepository; vehicleRepo: IVehicleRepository }`.
  - `RideAnalyticsInput`: `{ from?: string; to?: string }` (date ISO `YYYY-MM-DD` opzionali; se assenti → default ultimi 7 giorni).
  - output = `RideAnalyticsResponse` (da `@mvp/contracts`).

### B.2 Handler

`RideAnalytics.handler.ts`: `createRideAnalyticsHandler(deps)`:

- **Normalizza l'intervallo**:
  - se `from`/`to` assenti → default: `to = oggi`, `from = oggi - 6 giorni` (7 giorni inclusivi);
  - valida le date (formato `YYYY-MM-DD`); input non valido → errore di validazione tipizzato (il router → 400);
  - se `from > to` → errore di validazione chiaro;
  - imponi un **limite massimo ragionevole** all'ampiezza (es. ≤ 92 giorni) per evitare risposte enormi; oltre il limite → errore di validazione (dichiaralo).
  - porta `from` a inizio giornata e `to` a fine giornata prima di chiamare il repository.
- `const rides = await rideRepo.findStartedBetween(fromStart, toEnd);`
- **Risolvi il `VehicleType` in modo efficiente** (evita N+1): costruisci una mappa `vehicleId → VehicleType` con **una sola** lettura della flotta (`vehicleRepo.search({})`), poi usala per classificare le corse. Per le corse il cui veicolo non è più presente, usa un fallback dichiarato (es. salta la corsa dal breakdown per tipo ma conteggiala nel `total`, **oppure** assegnala a una categoria neutra) — scegli la soluzione minima e dichiarala.
- **Aggrega**:
  - inizializza **tutti** i giorni dell'intervallo `[from, to]` con `total: 0` e `countsByType: {}` (nessun buco nella serie);
  - per ogni corsa, ricava la `date` (`YYYY-MM-DD`) da `startedAt` secondo la convenzione dichiarata, incrementa `countsByType[type]` e `total` del giorno corrispondente;
  - ordina `days` per `date` crescente.
- Ritorna `RideAnalyticsResponse` `{ days, from, to }` (con `from`/`to` come stringhe `YYYY-MM-DD` normalizzate).
- L'handler NON istanzia repository concreti: tutto via `deps`.

### B.3 Router

`RideAnalytics.router.ts`: `createRideAnalyticsRouter(deps)`:

- `GET /analytics/rides` (sotto il prefisso `/api/admin`, vedi B.5) con query `?from=YYYY-MM-DD&to=YYYY-MM-DD` (entrambe opzionali);
- parse della query → `RideAnalyticsInput` → handler → risposta `RideAnalyticsResponse`;
- gestione errori coerente con gli altri router (validazione → 400, errori interni → 500). Nessuna business logic nel router.

### B.4 Wiring (composition root)

- In `apps/api/src/composition-root.ts` aggiungi `rideAnalyticsRouter: createRideAnalyticsRouter({ rideRepo, vehicleRepo })`, riusando i repository già istanziati. Non creare nuovi adapter.

### B.5 Mount + attivazione namespace `/api/admin`

- In `apps/api/src/app.ts` monta la slice sotto il prefisso PA: `app.use('/api/admin', root.rideAnalyticsRouter)` → endpoint finale `GET /api/admin/analytics/rides`.
- Questo **attiva concretamente** il namespace `/api/admin` che Sprint 20 aveva solo predisposto:
  - se Sprint 20 aveva lasciato un **commento segnaposto**, sostituiscilo con il mount reale;
  - se Sprint 20 aveva montato un router diagnostico `GET /api/admin/health`, **mantienilo** e aggiungi accanto il mount di `RideAnalytics` (path diversi, stesso prefisso: ok).
- Assicurati che il prefisso PA resti distinto da `/api/operator` e dalle route rider.

### B.6 Seed (verifica, non reinventare)

- Il seed corse multi-giorno/multi-tipo è responsabilità dello **Sprint 20**. Qui **verifica** soltanto che i dati siano sufficienti a una demo realistica di IF18: corse su **più giorni** (almeno gli ultimi ~7–14) e su **più `VehicleType`**.
- Se il seed risultasse povero (es. tutte le corse nello stesso giorno o di un solo tipo), arricchiscilo in modo **idempotente** (stessa strategia anti-duplicato già usata), senza introdurre nuove tabelle: usa la tabella `rides` MVP esistente. Dichiara nel report se hai dovuto intervenire.

---

## PARTE C — Frontend: slice `RideAnalytics` (UI analitica PA)

Crea `apps/web/src/slices/RideAnalytics/`:

- `RideAnalytics.types.ts`: tipi locali (intervallo selezionato / preset attivo). Riusa `RideAnalyticsResponse`, `DailyRidesByType`, `VehicleType` da `@mvp/contracts`.
- `RideAnalytics.hook.ts`: query TanStack verso `GET /api/admin/analytics/rides` (riusa `apiFetch`), parametrizzata su `from`/`to` (la `queryKey` include l'intervallo). Espone `data` (`RideAnalyticsResponse`), `isLoading`, `error`, refetch.
- `RideAnalytics.page.tsx`: pagina IF18 **dentro `AdminLayout`** (desktop-first). Deve contenere:
  - **Intestazione**: "Analisi corse" / "Corse avviate per tipologia di veicolo".
  - **Selettore intervallo**: preset rapidi (7 / 14 / 30 giorni), default 7. Cambiando preset, l'hook rifà la query.
  - **Contatori riepilogo** (blocchi/Badge shadcn): totale corse nell'intervallo e, in evidenza, il totale per ciascun `VehicleType` presente (es. "Scooter: N · Bici: N · Moped: N · Auto: N").
  - **Grafico schematico** (div/CSS, niente librerie): bar chart con una barra per giorno; le barre possono essere **impilate per tipo** (segmenti colorati per `VehicleType`) con legenda dei colori/tipi. Le altezze sono proporzionali al massimo `total` dell'intervallo. Coerente con lo stile esistente; degrada in modo decente su viewport stretti.
  - **Tabella** giorni × tipi: una riga per giorno (`date` formattata, locale), una colonna per ciascun `VehicleType` + colonna `total`. I giorni a 0 corse compaiono comunque (serie continua).
  - **Stati UI**: loading (skeleton), error (con retry), empty (intervallo senza corse: messaggio curato, non un crash; la serie mostra comunque i giorni a 0).
  - Riusa label/colori dei `VehicleType` già usati lato rider/operatore per coerenza (es. mappa tipo → etichetta IT e colore). Se non esiste un helper condiviso, definiscine uno locale alla slice senza importare altre slice.
- Route: `apps/web/src/app/admin/analisi-corse/page.tsx` che monta `RideAnalytics.page.tsx` dentro `AdminLayout`. (Slug coerente con il naming PA italiano dello Sprint 20; se Sprint 20 aveva già fissato uno slug per questa funzione, usa quello.)
- **Attiva la voce di nav "Analisi corse"** nella shell PA: da segnaposto disabilitato a link reale verso la nuova rotta. Lascia "Aree cantiere (Geofence)" (IF19/IF21) come segnaposto disabilitato.

---

## Verifica finale

- `pnpm typecheck` pulito su web e api.
- `pnpm build` (o build mirate) senza errori.
- Smoke test manuale:
  - login con `marco.dipalma@mvp.local` / `password` → redirect a `/admin`;
  - dalla shell PA apri "Analisi corse" → vedi grafico + tabella delle corse giornaliere per tipo, popolati dal seed;
  - cambia preset intervallo (7/14/30) → la vista si aggiorna; i giorni senza corse compaiono a 0;
  - `GET /api/admin/analytics/rides` risponde con `RideAnalyticsResponse` coerente; con `?from=&to=` validi rispetta l'intervallo; con date non valide / `from > to` / intervallo troppo ampio → 400 chiaro;
  - utente non ADMIN che apre `/admin/analisi-corse` → redirect a `/` (guard di Sprint 20 invariato);
  - i flussi rider e operatore esistenti restano invariati (in particolare `EndRide` non è stato toccato).
- Usa Graphify a fine lavoro per confermare:
  - zero import cross-slice (inclusa la nuova slice `RideAnalytics`);
  - la slice dipende da `@mvp/contracts` (`IRideRepository`, `IVehicleRepository`, `RideAnalyticsResponse`), non da implementazioni concrete;
  - l'aggregazione è nell'handler, il repository resta sola lettura;
  - nessun ciclo introdotto.

---

## Dati / demo

- Utenti PA demo: `marco.dipalma@mvp.local`, `giuseppe.dicosola@mvp.local` — password `password` (ADMIN).
- Corse seed distribuite su più giorni e tipi veicolo (Sprint 20): sufficienti per popolare grafico e tabella.

---

## Output finale richiesto

1. decisione architetturale presa e motivazione (slice `RideAnalytics` API + web; aggregazione nell'handler con repository "dumb"; attivazione del namespace `/api/admin` predisposto; UI schematica senza librerie grafiche);
2. elenco file creati/modificati;
3. sintesi delle scelte implementative (normalizzazione/validazione intervallo + default 7 giorni; risoluzione `VehicleType` via mappa per evitare N+1; serie temporale senza buchi; grafico CSS + tabella; preset intervallo client-side);
4. assunzioni fatte (corsa "avviata" = `startedAt` valorizzato indipendentemente dallo `status`; convenzione data `YYYY-MM-DD` scelta; limite massimo ampiezza intervallo; fallback per corse il cui veicolo non esiste più; slug rotta PA);
5. check architetturale finale basato su Graphify;
6. **TODO espliciti per gli sprint successivi**, almeno:
   - IF19/IF21: slice `WorkZones` (CRUD geofence) con persistenza Drizzle su `areas`/`area_vertexes`/`zone_vertexes`/`zone_roles`; enforcement in `EndRide` che consuma `isInBlockedArea` (blocco conclusione noleggio dentro cantiere); attivazione voce di nav "Aree cantiere"; **in quell'occasione valutare l'allineamento di `EndRide.handler.ts` al pattern handler puro** (oggi è un handler Express);
   - IF18 (eventuali estensioni): export CSV dei dati analitici, filtri aggiuntivi (per zona/area), confronto tra periodi, persistenza/derivazione da `mobility_reports` invece che dalle sole `rides`.

---

## Importante — non fare

- non implementare IF19/IF21 (niente CRUD geofence, niente enforcement su `EndRide`): resta segnaposto;
- non modificare `EndRide.handler.ts` in questo sprint (l'allineamento al pattern è un TODO del futuro sprint IF21);
- non spostare l'aggregazione nel repository: `findStartedBetween` resta sola lettura, il raggruppamento è nell'handler;
- non aggiungere librerie grafiche (recharts/chart.js/…): il grafico è schematico in CSS;
- non introdurre un nuovo ruolo: la PA è `UserRole.ADMIN`;
- non riusare `OperatorLayout` né far comparire la `BottomNav` rider nella sezione PA: usa `AdminLayout` (Sprint 20);
- non estendere `packages/contracts` se lo scaffolding IF18 di Sprint 20 è già presente: riusalo;
- non introdurre import tra slice; non mettere business logic nel router né far istanziare repository concreti all'handler;
- non introdurre auth reale (JWT, sessioni server): resta nel modello demo client-side;
- non reimplementare Sprint 17/18/19/20: se mancano i prerequisiti (shell PA, guard ADMIN, `findStartedBetween`, tipi `DailyRidesByType`/`RideAnalyticsResponse`, seed multi-giorno), **fermati e segnalalo**;
- se trovi un'ambiguità bloccante, fermati e produci domande precise invece di improvvisare.
