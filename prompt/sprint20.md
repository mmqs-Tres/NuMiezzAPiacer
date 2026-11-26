Devi implementare l'**init di sistema** della fase **Pubblica Amministrazione (PA)** del nostro MVP vehicle sharing, seguendo rigorosamente la Vertical Slice Architecture già presente nel monorepo.

Questo sprint **NON implementa** le funzioni PA vere e proprie: prepara il terreno (shell, routing, scaffolding di contratti, mock e seed) così che gli sprint successivi (21+) possano implementare una funzione alla volta end-to-end senza dover ridisegnare struttura, ruolo o wiring.

Le due funzioni PA pianificate, che questo sprint **predispone ma non realizza**, sono:

- **IF18 - AP.01**: Un'interfaccia analitica che riporti il numero **giornaliero di corse avviate**, suddivise per **tipologia di veicolo**.
- **IF19 - AP.04.1 + IF21 - AP.04.3**: Creare **aree geografiche delimitate (Geofence)** per segnalare cantieri stradali e **impedire la conclusione del noleggio** al loro interno.

In questo sprint entrambe restano **segnaposto disabilitati/"presto disponibile"** nella shell PA. Nessuna logica analitica reale, nessun calcolo aggregato, nessun enforcement geofence su `EndRide`. Solo l'impalcatura.

---

## Premessa importante: dipendenza da Sprint 17, 18 e 19

Questo sprint **presuppone che Sprint 17 (IF23 - OP.01), Sprint 18 (IF27 - OP.03.2 + schema reale) e Sprint 19 (IF30 - OP.11) siano già stati implementati**, quindi assume che esistano:

- la **shell operatore** dedicata (`OperatorLayout` + header operatore, niente `BottomNav` rider) e il redirect/guard di ruolo al login;
- l'**helper di risoluzione utente/ruolo corrente** introdotto in Sprint 17 (es. `apps/web/src/lib/use-current-user.ts` o equivalente che risolve l'utente da `currentUserId` + `DEMO_USERS`): in Sprint 17 gestisce `OPERATOR → /operator`, RIDER → `/`, e ADMIN trattato come gli altri (`/`). **Questo sprint estende quell'helper/redirect per ADMIN.** Se il nome/percorso reale differisce, adattati a quello esistente: NON crearne un secondo parallelo.
- il mount API operatore `app.use('/api/operator', ...)` con le slice `FleetOverview` / `FaultRegistry` / `RemoteBlock`;
- lo **schema reale completo** introdotto in Sprint 18 (`apps/api/src/db/schema.ts` + `createTables` in `apps/api/src/db/index.ts`), comprese le tabelle che questa fase userà in futuro: `public_administration`, `mobility_reports`, `rides`, `areas`, `area_vertexes`, `zone_vertexes`, `zone_roles`. Le tabelle MVP `vehicles`/`users`/`bookings`/`rides` restano a id **`TEXT`** (adattamento dichiarato in Sprint 18);
- il nuovo stato `VehicleStatus.BLOCKED` introdotto in Sprint 19 (irrilevante qui, ma non rimuoverlo).

Se, aprendo il codice, scopri che Sprint 17/18/19 NON sono ancora stati implementati (manca `OperatorLayout`, manca `/operator`, manca il mount `/api/operator`, manca lo schema reale con le tabelle sopra), **fermati e segnalalo**: non reimplementarli dentro questo sprint, non improvvisare shell o schema parziali. Produci una nota chiara e attendi indicazioni.

---

## Contesto verificato (confermato via Graphify + lettura codebase)

- monorepo Turborepo + pnpm
- frontend: `apps/web` — Next.js 14 App Router, React, Tailwind, shadcn/ui, TanStack Query, zustand
- backend: `apps/api` — Express + TypeScript
- shared kernel / contratti: `packages/contracts`
- database: SQLite + Drizzle ORM

Stato dominio rilevante (VERIFICATO):

- **Ruolo**: `UserRole` (`packages/contracts/src/enums/index.ts`) ha già `RIDER`, `OPERATOR`, `ADMIN`. **La PA usa `UserRole.ADMIN`** (non si introduce un nuovo ruolo). Utenti demo ADMIN già presenti in `apps/web/src/lib/demo-users.ts`:
  - `u4` → `marco.dipalma@mvp.local` → `UserRole.ADMIN`
  - `u5` → `giuseppe.dicosola@mvp.local` → `UserRole.ADMIN`
- **IF18 (analytics)**: `IRideRepository` (`packages/contracts/src/interfaces/index.ts`) espone oggi `findById`, `findActiveByUserId`, `findByUserId`, `create`, `updateStatus`, `end`. **Non esiste alcun metodo di lettura per intervallo/aggregazione**: è il punto da predisporre. `Ride` (`packages/contracts/src/types/index.ts`) ha `startedAt: Date`, `vehicleId`, ecc.; il tipo veicolo si ricava da `vehicleRepo.findById(vehicleId).type` (`VehicleType`).
- **IF19/IF21 (geofence)**: il punto di aggancio dell'enforcement è `IZoneValidator.isInParkingZone`, usato da `apps/api/src/slices/EndRide/EndRide.handler.ts` (oggi `MockZoneValidator` ritorna sempre `{ valid: true }`). Esistono già `FleetZone` + `IFleetZoneRepository` + `InMemoryFleetZoneRepository` (pattern in-memory di riferimento). Le tabelle reali per i poligoni cantiere (`areas`, `area_vertexes`, `zone_vertexes`, `zone_roles`) esistono dallo Sprint 18.

Convenzioni VSA (già in uso, non negoziabili):

- Slice API: `Slice.types.ts` + `Slice.handler.ts` + `Slice.router.ts`. Handler puro `createXHandler(deps)`, router solo HTTP, wiring nel composition root, mount in `app.ts`.
- Adapter concreti (repository/service) in `apps/api/src/adapters` (`/db`, `/services`), MAI dentro le slice. I service esterni sono **mock** coerenti con i contratti.
- Slice web: `Slice.types.ts` + `Slice.hook.ts` + `Slice.page.tsx`, route in `apps/web/src/app/<route>/page.tsx`.
- Web e API condividono tipi SOLO via `@mvp/contracts`.

---

## Decisioni già fissate (NON rimetterle in discussione)

1. **Naming/namespace PA = `/admin` (web) e `/api/admin` (API).**
   - Coerente con `UserRole.ADMIN` e con gli utenti demo `u4`/`u5`; simmetrico a `/operator` + `/api/operator` dello Sprint 17.
   - Le future rotte PA vivranno sotto questi prefissi (es. `/admin/analisi-corse`, `/admin/cantieri`; `GET /api/admin/...`).
2. **Interfaccia PA dedicata, desktop-first.**
   - La PA è un'utenza da scrivania (enti convenzionati): la shell PA è **desktop-first** (layout a colonne/sidebar leggera pensato per schermo largo, comunque non rotto su mobile), **distinta** da `OperatorLayout` e dalla `BottomNav` rider.
   - NIENTE `BottomNav` rider, NIENTE riuso di `OperatorLayout`: è un terzo contesto applicativo. Puoi riusare i primitivi shadcn (Card, Button, Badge, Separator…) e i pattern di stile esistenti, ma la shell è propria della PA.
3. **Init, non funzione.**
   - Questo sprint si ferma a: redirect/guard ADMIN, shell PA con voci di nav **segnaposto disabilitate** per IF18 e IF19/IF21, prefisso `/api/admin` predisposto, e **scaffolding di contratti/mock/seed** che gli sprint 21+ consumeranno.
   - NON implementare: il calcolo delle corse giornaliere per tipo, la UI analitica reale, la CRUD dei geofence, l'enforcement su `EndRide`. Sono i prossimi sprint.
4. **Non toccare `EndRide`.**
   - L'enforcement geofence (IF21) modificherà `EndRide` in un futuro sprint. In questo sprint `EndRide.handler.ts` resta **invariato**. Qui si predispone solo il punto di estensione lato contratti (vedi Parte C.2), senza wired-in.
5. **Auth invariata.**
   - Resta il modello demo client-side (Sprint 17). Niente JWT, sessioni server o ruoli persistiti lato server.

---

## Vincoli architetturali non negoziabili

1. Nessun import tra slice (anche future).
2. Adapter concreti (incl. i nuovi stub) in `apps/api/src/adapters`, MAI dentro le slice.
3. Le dipendenze concrete si risolvono nel composition root.
4. Web e API condividono tipi SOLO via `@mvp/contracts`. Le nuove interfacce/tipi PA vanno in `packages/contracts`.
5. Le future slice dipenderanno da **interfacce** (`IRideRepository` esteso, `IWorkZoneRepository`, `IZoneValidator` esteso), mai da implementazioni concrete.
6. Nessuna dipendenza circolare. Usa Graphify all'inizio e alla fine per confermarlo.
7. Gli stub introdotti devono lasciare `pnpm typecheck` e `pnpm build` **puliti** (niente metodi mancanti, niente unused-var: usa il pattern `void x` già presente nel composition root per le dipendenze non ancora wired).

---

## PARTE A — Redirect e guard per il ruolo ADMIN (web)

### A.1 Redirect al login

- Estendi la logica di redirect post-login (Sprint 17) in `apps/web/src/slices/Login/Login.page.tsx` (o nell'helper che Sprint 17 ha estratto):
  - `OPERATOR → /operator` (invariato);
  - **`ADMIN → /admin`** (nuovo);
  - RIDER e default → `/` (invariato).
- Riusa l'helper di risoluzione utente/ruolo già esistente: NON duplicarlo.

### A.2 Guard di rotta PA

- Aggiungi un guard client-side per la sezione `/admin`, coerente con quello operatore di Sprint 17: se l'utente corrente non è `ADMIN`, redirect a `/`.
- Mettilo dove Sprint 17 ha messo il guard operatore (nella shell o nella route), per coerenza.

---

## PARTE B — Shell PA desktop-first (web)

### B.1 Layout

- Crea la shell PA in `apps/web/src/components/layout/` (es. `AdminLayout.tsx` + eventuale `AdminHeader.tsx` / sidebar leggera):
  - **desktop-first**, niente `BottomNav` rider, niente riuso di `OperatorLayout`;
  - topbar/sidebar con titolo (es. "Pannello Pubblica Amministrazione" / "Mobilità urbana"), identità ADMIN corrente, azione logout/cambio account coerente con lo store (`useAppStore`);
  - area contenuto a blocchi shadcn pensata per schermo largo (griglia multi-colonna), che degrada in modo decente su viewport stretti senza rompersi.
- Navigazione PA con voci:
  - **"Analisi corse"** (IF18) → segnaposto disabilitato / "presto disponibile";
  - **"Aree cantiere (Geofence)"** (IF19/IF21) → segnaposto disabilitato / "presto disponibile".
  - Le voci NON devono linkare a rotte inesistenti: rendile chiaramente disabilitate (come i segnaposto IF27/IF30 nello Sprint 17 prima della loro attivazione).

### B.2 Rotta e home PA

- Route: `apps/web/src/app/admin/page.tsx` che monta una pagina **home/overview PA** dentro `AdminLayout`.
- La home è una pagina reale ma minimale (è l'unico contenuto attivo di questo sprint): un saluto/overview con due **card segnaposto** per le funzioni future (IF18 "Analisi corse", IF19/IF21 "Aree cantiere"), ognuna con descrizione breve e stato "in arrivo". Nessuna chiamata API, nessun dato reale.
- Stati UI minimi (la pagina è statica): cura solo un'impaginazione pulita e coerente con lo stile esistente.

> Questa home NON è una slice di dominio: è la shell + landing della sezione. Non creare slice `apps/web/src/slices/...` per essa. Le slice arriveranno con le funzioni reali (sprint 21+).

---

## PARTE C — Scaffolding contratti (packages/contracts)

Obiettivo: definire i **contratti** (interfacce + tipi) che le future slice PA consumeranno, così che gli sprint 21+ implementino solo logica, senza ridisegnare i confini. **Solo dichiarazioni + tipi**: nessuna business logic qui.

### C.1 IF18 — lettura corse per analytics

- Estendi `IRideRepository` (`packages/contracts/src/interfaces/index.ts`) con **un solo** metodo di lettura per intervallo, sufficiente all'aggregazione lato handler futuro:
  - `findStartedBetween(from: Date, to: Date): Promise<Ride[]>` — ritorna le corse con `startedAt` nell'intervallo `[from, to]`.
  - NON aggiungere metodi di aggregazione nel repository: il raggruppamento giornaliero-per-tipo sarà responsabilità dell'handler della futura slice (mantiene il repository "dumb" e coerente con gli altri).
- Aggiungi i **tipi di trasporto** che la futura slice analytics userà (in `packages/contracts/src/types/index.ts`), così la UI e l'API condividono già la forma:
  - `DailyRidesByType`: `{ date: string; /* ISO date YYYY-MM-DD */ countsByType: Partial<Record<VehicleType, number>>; total: number }`.
  - `RideAnalyticsResponse`: `{ days: DailyRidesByType[]; from: string; to: string }`.
  - (Questi tipi sono solo dichiarati ora; nessuno li produce ancora.)

### C.2 IF19/IF21 — geofence cantieri

- Tipo di dominio (in `packages/contracts/src/types/index.ts`):
  - `WorkZone` (geofence cantiere): `{ id: string; name: string; active: boolean; polygon: Coordinates[]; /* vertici ordinati */ createdAt: Date; notes?: string }`.
    - Mappa concettualmente sullo schema reale Sprint 18: `areas` + `area_vertexes` + `zone_vertexes` (poligono) con `zone_roles` di tipo "cantiere"/azione "blocca". La persistenza reale è un TODO degli sprint 21+; qui si fissa solo la forma di dominio.
- Interfaccia repository (in `packages/contracts/src/interfaces/index.ts`):
  - `IWorkZoneRepository`:
    - `findAll(): Promise<WorkZone[]>`
    - `findActive(): Promise<WorkZone[]>`
    - `create(data: Omit<WorkZone, 'id' | 'createdAt'>): Promise<WorkZone>`
  - Minima: niente update/delete in questo init (li valuteranno gli sprint specifici se servono).
- **Punto di estensione enforcement (IF21)** su `IZoneValidator` (in `packages/contracts/src/interfaces/index.ts`):
  - aggiungi `isInBlockedArea(coords: Coordinates): Promise<{ blocked: boolean; zoneId?: string }>`.
  - **NON** chiamarlo da `EndRide` in questo sprint: è solo il contratto del futuro hook. `EndRide.handler.ts` resta invariato.
- Allinea gli export in `packages/contracts/src/index.ts`.

---

## PARTE D — Stub adapter + seed minimi (apps/api)

Obiettivo: rendere i nuovi contratti **istanziabili e typecheck-clean**, senza implementare le funzioni. Gli stub devono compilare e restituire dati neutri/minimi.

### D.1 IF18 — `DrizzleRideRepository.findStartedBetween`

- Implementa il nuovo metodo `findStartedBetween` in `apps/api/src/adapters/db/DrizzleRideRepository.ts`. È una **lettura semplice** (filtro su `startedAt` nell'intervallo), coerente con gli altri metodi del repository: implementarla qui è accettabile (non è business logic della funzione, è solo accesso dati). L'aggregazione resta fuori.
- **Seed**: assicurati che il seed corse (`apps/api/src/db/seed.ts`) contenga abbastanza `rides` con `startedAt` distribuite su **più giorni** e su **più `VehicleType`** diversi, così che la futura slice IF18 abbia dati realistici da aggregare. Se il seed attuale è povero, arricchiscilo in modo idempotente (stessa strategia anti-duplicato già usata). Non inventare nuove tabelle: usa la tabella `rides` MVP esistente.

### D.2 IF19/IF21 — `InMemoryWorkZoneRepository` + `MockZoneValidator.isInBlockedArea`

- Crea `apps/api/src/adapters/db/InMemoryWorkZoneRepository.ts` che implementa `IWorkZoneRepository`, modellato su `InMemoryFleetZoneRepository`:
  - seed in-memory con **1 geofence cantiere demo** (poligono semplice di 3–4 vertici nell'area Milano Duomo, coerente con le coordinate seed esistenti), `active: true`.
  - `create` aggiunge alla collezione in-memory (sufficiente per le demo iniziali; la persistenza Drizzle sullo schema reale è TODO sprint 21+, dichiaralo).
- Estendi `MockZoneValidator` (`apps/api/src/adapters/services/MockZoneValidator.ts`) implementando `isInBlockedArea`: per ora ritorna sempre `{ blocked: false }` (nessun veicolo è dentro un cantiere finché l'enforcement non viene attivato). Mantieni invariati `isInServiceZone`/`isInParkingZone`.

### D.3 Wiring nel composition root (senza esporre rotte di dominio)

- In `apps/api/src/composition-root.ts`:
  - istanzia `const workZoneRepo = new InMemoryWorkZoneRepository();`
  - usa il pattern `void workZoneRepo;` (come già per `fleetZoneRepo`/`gpsTrackingService`) finché nessuna slice lo consuma, così typecheck/lint restano puliti.
  - NON creare slice/router PA fittizi.

### D.4 Prefisso `/api/admin` (predisposto)

- Riserva il namespace API PA. Soluzione minima e onesta: **non** montare router orfani. Aggiungi in `apps/api/src/app.ts` un commento segnaposto accanto ai mount esistenti, es.:
  - `// PA (UserRole.ADMIN): le slice arrivano dagli sprint 21+ → app.use('/api/admin', root.<...>Router)`
- In alternativa, se preferisci dimostrare che il prefisso è raggiungibile, è accettabile montare un singolo router PA minimale con una sola rotta diagnostica `GET /api/admin/health` (che risponde `{ status: 'ok' }`), purché segua il pattern slice/router e non contenga business logic. Scegli **una** delle due soluzioni e dichiarala. (Preferenza: commento segnaposto, per non introdurre una slice vuota.)

---

## Verifica finale

- `pnpm typecheck` pulito su web e api (attenzione: l'aggiunta di metodi a `IRideRepository` e `IZoneValidator` impone di implementarli in **tutti** gli adapter/mock che li implementano — verifica che non resti alcuna implementazione incompleta).
- `pnpm build` (o build mirate) senza errori.
- Smoke test manuale:
  - login con `marco.dipalma@mvp.local` / `password` → redirect a `/admin`;
  - login operatore (`flavio.demusso@mvp.local`) → `/operator` (invariato); login RIDER → `/` (invariato);
  - utente non ADMIN che apre `/admin` → redirect a `/`;
  - `/admin` mostra la shell PA desktop-first con le due card/voci segnaposto disabilitate (IF18, IF19/IF21);
  - i flussi rider e operatore esistenti continuano a funzionare invariati (in particolare `EndRide` non è cambiato).
- Usa Graphify a fine lavoro per confermare:
  - zero import cross-slice;
  - i nuovi contratti vivono in `@mvp/contracts`; gli adapter (`InMemoryWorkZoneRepository`, estensioni `DrizzleRideRepository`/`MockZoneValidator`) sono fuori dalle slice;
  - nessun ciclo introdotto.

---

## Dati / demo

- Utenti PA demo: `marco.dipalma@mvp.local`, `giuseppe.dicosola@mvp.local` — password `password` (ADMIN).
- Corse seed distribuite su più giorni e tipi veicolo (per IF18 futuro).
- 1 geofence cantiere demo in-memory (per IF19/IF21 futuro), area Milano Duomo.

---

## Output finale richiesto

1. decisione architetturale presa e motivazione (sezione PA su `UserRole.ADMIN`; shell PA desktop-first distinta da `OperatorLayout`; namespace `/admin`–`/api/admin`; scaffolding contratti senza logica);
2. elenco file creati/modificati;
3. sintesi delle scelte implementative (redirect/guard ADMIN, shell, estensioni di contratto IF18/IF19/IF21, stub adapter + seed, predisposizione `/api/admin`);
4. assunzioni fatte (PA = ADMIN e non nuovo ruolo; `findStartedBetween` come unico metodo di lettura per IF18 con aggregazione rimandata all'handler futuro; `WorkZone` in-memory ora vs persistenza Drizzle su schema reale come TODO; `isInBlockedArea` dichiarato ma non wired in `EndRide`; soluzione scelta per il prefisso `/api/admin`);
5. check architetturale finale basato su Graphify;
6. **TODO espliciti per gli sprint 21+**, almeno:
   - IF18: slice `RideAnalytics` (API+web) che usa `findStartedBetween` e aggrega `DailyRidesByType`; UI analitica desktop con grafico/tabella corse giornaliere per tipo; attivazione voce di nav "Analisi corse";
   - IF19/IF21: slice `WorkZones` (CRUD geofence) con persistenza Drizzle su `areas`/`area_vertexes`/`zone_vertexes`/`zone_roles`; enforcement in `EndRide` che consuma `isInBlockedArea` (blocco conclusione noleggio dentro cantiere) con messaggio chiaro; attivazione voce di nav "Aree cantiere".

---

## Importante — non fare

- non implementare IF18 (niente calcolo/aggregazione corse, niente UI analitica reale): solo segnaposto;
- non implementare IF19/IF21 (niente CRUD geofence reale, niente enforcement su `EndRide`): solo contratti + stub;
- non modificare `EndRide.handler.ts` in questo sprint;
- non introdurre un nuovo ruolo: la PA è `UserRole.ADMIN`;
- non riusare `OperatorLayout` né far comparire la `BottomNav` rider nella sezione PA;
- non montare router/slice PA orfani o vuoti se scegli il commento segnaposto per `/api/admin`;
- non mettere gli adapter dentro le slice; non far dipendere codice da implementazioni concrete invece che dalle interfacce in `@mvp/contracts`;
- non introdurre auth reale (JWT, sessioni server): resta nel modello demo client-side;
- non lasciare implementazioni di interfaccia incomplete (typecheck deve restare pulito dopo l'estensione di `IRideRepository`/`IZoneValidator`);
- non reimplementare Sprint 17/18/19: se mancano, fermati e segnalalo;
- se trovi un'ambiguità bloccante, fermati e produci domande precise invece di improvvisare.
