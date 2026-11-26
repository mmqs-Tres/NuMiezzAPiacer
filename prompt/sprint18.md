Devi implementare il secondo blocco della **schermata Operatore** del nostro MVP vehicle sharing, seguendo rigorosamente la Vertical Slice Architecture già presente nel monorepo.

Questo sprint introduce la seconda funzione della schermata operatore:

- **IF27 - OP.03.2**: Visualizzare nel **registro centralizzato** le segnalazioni di guasto inserite manualmente dagli utenti, così che l'operatore possa pianificare le riparazioni.

Questo sprint introduce inoltre, **a livello di solo database**, l'intero schema "reale" del progetto (vedi `prompt/schema.sql`), anche per le tabelle che il MVP non usa ancora: l'obiettivo è **dimostrarne l'esistenza** ai docenti che valuteranno il progetto. Vedi la sezione dedicata più sotto.

La terza funzione operatore già pianificata NON fa parte di questo sprint, ma la shell la ospita già come segnaposto:

- IF30 - OP.11: Inviare un comando remoto di interruzione (blocco) a un veicolo tramite ID. → resta segnaposto disabilitato/"presto disponibile". Nessuna logica, nessuna route, nessun contratto.

---

## Premessa importante: dipendenza da Sprint 17

Questo sprint **presuppone che Sprint 17 (IF23 - OP.01) sia già stato implementato**, quindi assume che esistano:

- la **shell operatore** dedicata (`OperatorLayout` + header operatore, niente `BottomNav` rider);
- la rotta `apps/web/src/app/operator/page.tsx` e il redirect/guard di ruolo al login (operatore → `/operator`);
- l'helper di risoluzione utente/ruolo corrente (es. `apps/web/src/lib/use-current-user.ts`);
- la nav operatore con le voci: "Mappa flotta" (attiva, IF23), **"Registro guasti" (IF27, oggi segnaposto disabilitato)**, "Blocco remoto" (IF30, segnaposto disabilitato);
- il mount API operatore `app.use('/api/operator', ...)` con la slice `FleetOverview` già esistente.

In questo sprint la voce **"Registro guasti" smette di essere un segnaposto** e diventa una pagina reale.

Se, aprendo il codice, scopri che Sprint 17 NON è ancora stato implementato (manca `OperatorLayout`, manca `/operator`, manca il mount `/api/operator`), **fermati e segnalalo**: non reimplementare Sprint 17 dentro questo sprint, e non improvvisare una shell parziale incoerente. Produci una nota chiara e attendi indicazioni.

---

## Contesto verificato (confermato via lettura codebase + `prompt/schema.sql`)

- monorepo Turborepo + pnpm
- frontend: `apps/web` — Next.js 14 App Router, React, Tailwind, shadcn/ui, TanStack Query, zustand
- backend: `apps/api` — Express + TypeScript
- shared kernel / contratti: `packages/contracts`
- database: SQLite + Drizzle ORM
  - lo schema Drizzle MVP è in `apps/api/src/db/schema.ts`;
  - il bootstrap effettivo delle tabelle avviene in `apps/api/src/db/index.ts` → funzione `createTables(sqlite)` con `CREATE TABLE IF NOT EXISTS ...` (questo è ciò che crea fisicamente le tabelle nel file SQLite);
  - il seed demo è in `apps/api/src/db/seed.ts` (richiamato da `initDb()`).

Schema reale di riferimento: `prompt/schema.sql` (ER completo). La tabella rilevante per IF27 è:

```sql
CREATE TABLE vehicle_condition_repo (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id      INTEGER         NOT NULL,
    reported_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category        VARCHAR(50),
    severity        VARCHAR(50),
    notes           TEXT,
    images          TEXT,  -- JSON array of image URLs
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
```

Il commento dello schema la descrive come "segnalazioni condizione veicolo": è esattamente il registro delle segnalazioni di guasto/condizione inserite sul veicolo. **È questa la tabella che alimenta IF27.**

NB: nello schema reale esiste anche `support_tickets` (con `status`, `assigned_operator`, ecc.). NON è la tabella di IF27: riguarda IF26/ticket di supporto, che è un non-goal MVP. Per IF27 usa **solo** `vehicle_condition_repo`.

Convenzioni VSA (già in uso, non negoziabili):

- Slice API: `Slice.types.ts` + `Slice.handler.ts` + `Slice.router.ts`.
- Handler puro creato con `createXHandler(deps)`, indipendente da Express.
- Router fa solo HTTP (parse → handler → response), nessuna business logic.
- Wiring concreto in `apps/api/src/composition-root.ts`, mount in `apps/api/src/app.ts`.
- Adapter concreti (repository/service) in `apps/api/src/adapters`, MAI dentro le slice.
- Slice web: `Slice.types.ts` + `Slice.hook.ts` + `Slice.page.tsx`, route in `apps/web/src/app/<route>/page.tsx` che monta la page della slice.
- Web e API condividono tipi SOLO via `@mvp/contracts`.

---

## Decisioni MVP già fissate (NON rimetterle in discussione)

1. **Fonte dati = seed mock.**
   - IF10/IF11/IF12 (invio segnalazione lato utente) NON sono implementati: oggi non esiste alcuna UI/route per inserire segnalazioni.
   - Quindi il registro viene popolato con **segnalazioni demo seedate** nella tabella `vehicle_condition_repo`, collegate ai veicoli già presenti nel seed.
   - In questo sprint NON si implementa l'invio lato utente. IF27 è **sola lettura** (registro consultabile dall'operatore).
2. **Persistenza = sul database reale (tabella `vehicle_condition_repo`), con mock dove serve.**
   - Le segnalazioni vivono in una vera tabella SQLite, non in un repository puramente in-memory: si vuole mostrare il dato persistito.
   - Dove i campi dello schema reale sono troppo complessi o incoerenti con il MVP (es. tipi `INTEGER` autoincrement vs id testuali esistenti), si **adatta/mocka** mantenendo la tabella presente e i nomi dei campi reali. Vedi sezione "Adattamenti schema reale → MVP".
3. **Vista = lista + filtro + dettaglio (read-only).**
   - Tabella/lista delle segnalazioni, filtri client-side, contatori, pannello di dettaglio. Coerente per ricchezza con IF23 (Sprint 17).
4. **Shell operatore dedicata già esistente (Sprint 17).**
   - La pagina IF27 vive dentro `OperatorLayout`, niente `BottomNav` rider.
   - Si attiva la voce di nav "Registro guasti" (prima segnaposto).

---

## Vincoli architetturali non negoziabili

1. Nessun import tra slice.
2. La nuova slice backend deve rispettare il pattern `FaultRegistry.types.ts` / `FaultRegistry.handler.ts` / `FaultRegistry.router.ts`.
3. Il router Express fa solo lavoro HTTP; l'handler è puro (`createFaultRegistryHandler(deps)`), tipizzato in input/output, senza dipendenze da Express.
4. Le dipendenze concrete (repository) si risolvono nel composition root.
5. La nuova slice web rispetta `FaultRegistry.types.ts` / `FaultRegistry.hook.ts` / `FaultRegistry.page.tsx`.
6. Web e API condividono tipi SOLO via `@mvp/contracts`.
7. Nessun adapter concreto dentro le slice: il `DrizzleFaultReportRepository` sta in `apps/api/src/adapters/db`.
8. Le slice dipendono dall'interfaccia `IFaultReportRepository` (in `@mvp/contracts`), mai dall'implementazione concreta.
9. Nessuna dipendenza circolare. Usa Graphify all'inizio e alla fine per confermarlo.

---

## PARTE A — Introdurre l'intero schema reale (a fini dimostrativi)

Obiettivo: rendere **presenti e visibili** tutte le tabelle dello schema reale (`prompt/schema.sql`), così che si possa dimostrare ai docenti che il modello dati completo esiste nel progetto, anche se il MVP ne usa solo una parte.

### A.1 Cosa fare

- Porta **tutte** le tabelle di `prompt/schema.sql` nello schema Drizzle (`apps/api/src/db/schema.ts`) usando i tipi `sqlite-core` (`text`, `integer`, `real`, ecc.) e mappando i tipi SQL del file reale ai tipi SQLite:
  - `INTEGER PRIMARY KEY AUTOINCREMENT` → `integer('id').primaryKey({ autoIncrement: true })`
  - `DECIMAL(p,s)` → `real(...)`
  - `VARCHAR(n)` / `TEXT` → `text(...)`
  - `BOOLEAN` → `integer(..., { mode: 'boolean' })`
  - `TIMESTAMP` / `DATE` → `integer(..., { mode: 'timestamp' })` (oppure `text(...)` se più semplice; scegli e dichiara la convenzione, usala in modo uniforme)
  - foreign key: dichiarale con `references(() => ...)` dove non creano problemi; se una FK incrocia tabelle MVP con id di tipo diverso, vedi A.3.
- Replica le stesse tabelle nel bootstrap fisico `createTables(sqlite)` in `apps/api/src/db/index.ts` con `CREATE TABLE IF NOT EXISTS ...`, così che esistano davvero nel file SQLite e siano ispezionabili (es. con un browser SQLite).
- Mantieni anche gli `CREATE INDEX` rilevanti dello schema reale (almeno quelli su `vehicle_condition_repo` / `support_tickets` / `vehicle_position_history`), non bloccare lo sprint se qualche indice è superfluo.

### A.2 Tabelle da introdurre

Dallo schema reale: `zone_vertexes`, `zone_roles`, `areas`, `area_vertexes`, `fleet_names`, `parking_bonus_rules`, `operators`, `cars`, `bicycles`, `scooters`, `vehicle_position_history`, **`vehicle_condition_repo`**, `support_tickets`, `promotions`, `customers`, `payment_methods`, `public_administration`, `mobility_reports`, oltre alle "parent" `vehicles`, `users`, `rides`, `bookings`.

### A.3 Adattamenti schema reale → MVP (gestione collisioni) — IMPORTANTE

Quattro tabelle dello schema reale **esistono già** nella versione MVP e sono usate dalle slice implementate (NearbyVehicles, VehicleDetails, BookVehicle, UnlockVehicle, EndRide, Search, ecc.):

- `vehicles` (MVP: `id TEXT`, colonne `type/status/lat/lng/battery_level/...`)
- `users` (MVP: `id TEXT`, `email/role/created_at`)
- `bookings` (MVP: `id TEXT`, `user_id TEXT`, `vehicle_id TEXT`, ...)
- `rides` (MVP: `id TEXT`, `user_id TEXT`, `vehicle_id TEXT`, ...)

Lo schema reale le ridefinisce con `INTEGER AUTOINCREMENT` e molte più colonne. **NON sostituire né rompere le tabelle MVP funzionanti.** Regola:

- Per le 4 tabelle in collisione (`vehicles`, `users`, `bookings`, `rides`): **mantieni la definizione MVP esistente** (è quella realmente usata dalle slice). NON cambiarne tipi di id né colonne.
- Per **tutte le altre** tabelle dello schema reale: introducile come da `schema.sql` (sono nuove, non collidono).
- Le FK delle tabelle nuove verso `vehicles`/`users`/`rides` devono puntare al **tipo id reale del MVP**: gli id veicolo/utente nel MVP sono **`TEXT`**, quindi nelle tabelle nuove le colonne `vehicle_id` / `user_id` / `customer_id` / `related_vehicle_id` / `related_ride_id` ecc. vanno dichiarate come **`text`**, non `integer`, per restare coerenti e poter referenziare i dati MVP esistenti. Dichiaralo come adattamento esplicito.
- Le tabelle nuove che NON vengono usate dal MVP possono restare **vuote** (nessun seed obbligatorio), tranne `vehicle_condition_repo` che DEVE essere seedata (Parte B). Se vuoi, puoi inserire 1–2 righe demo anche in `support_tickets`/`promotions` per renderle "vive", ma non è richiesto.

### A.4 Segnalazione obbligatoria nel report finale

Nel report finale dello sprint, includi una sezione **"Schema reale introdotto"** che elenchi:

- quali tabelle dello schema reale sono state aggiunte e ora esistono nel DB;
- quali sono **realmente usate** dal MVP (oggi: tabelle MVP esistenti + `vehicle_condition_repo` per IF27);
- quali sono presenti **solo a fini dimostrativi** (non ancora wired in alcuna slice);
- gli adattamenti di tipo fatti (es. `vehicle_id` come `TEXT` invece di `INTEGER`) e il perché.

Questo serve esplicitamente per mostrare ai docenti la copertura del modello dati.

---

## PARTE B — IF27: Registro centralizzato segnalazioni di guasto

### B.1 Contracts (`packages/contracts`)

Aggiungi i tipi/contratti condivisi (web + api li useranno via `@mvp/contracts`):

- Enum (in `packages/contracts/src/enums/index.ts`), per abilitare filtro e badge — sono valori MVP curati (lo schema reale tiene `category`/`severity` come stringhe libere; qui li vincoliamo per la UI, dichiarandolo come assunzione):
  - `FaultSeverity`: es. `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - `FaultCategory`: es. `MECHANICAL`, `ELECTRICAL`, `BRAKES`, `TIRE`, `BATTERY`, `BODY`, `OTHER`.
- Tipi (in `packages/contracts/src/types/index.ts`):
  - `FaultReport` (modello di dominio, mappa `vehicle_condition_repo`):
    - `id: string`
    - `vehicleId: string`
    - `reportedAt: Date`
    - `category: FaultCategory`
    - `severity: FaultSeverity`
    - `notes?: string`
    - `images: string[]` (parse del JSON `images`)
  - `FaultReportItem` (item per la lista, arricchito per la UI):
    - `id`, `vehicleId`, `plateOrCode`, `vehicleType`, `reportedAt` (ISO string nel transport), `category`, `severity`, `notesPreview?`, `imagesCount`.
  - `FaultRegistryResponse`: `{ reports: FaultReportItem[]; total: number }`.
  - (opzionale) `FaultReportDetail` se vuoi un payload di dettaglio separato; in alternativa la lista può già contenere i campi necessari al dettaglio (vedi B.4).
- Interfaccia repository (in `packages/contracts/src/interfaces/index.ts`):
  - `IFaultReportRepository`:
    - `findAll(): Promise<FaultReport[]>`
    - `findById(id: string): Promise<FaultReport | null>`
  - Niente filtri lato repository in questo sprint (il filtro è client-side, vedi B.4). Mantieni l'interfaccia minima.

Allinea export in `packages/contracts/src/index.ts`.

### B.2 Adapter concreto (`apps/api/src/adapters/db`)

- Crea `DrizzleFaultReportRepository.ts` che implementa `IFaultReportRepository` leggendo dalla tabella `vehicle_condition_repo`:
  - mappa riga DB → `FaultReport` (parse di `images` da JSON a `string[]`; gestisci `category`/`severity` mappandole sugli enum, con fallback a `OTHER` / `MEDIUM` se valore non riconosciuto — dichiaralo come assunzione).
  - `findAll()` ordina per `reportedAt` desc (più recenti prima).
- L'adapter NON sta dentro la slice. È un adapter concreto, come `DrizzleVehicleRepository`.

### B.3 Seed (`apps/api/src/db/seed.ts`)

- Aggiungi il seed di **alcune segnalazioni demo** (es. 6–10) nella tabella `vehicle_condition_repo`, collegate a `vehicleId` realmente presenti nel seed veicoli esistente.
- Varia `category`, `severity`, `reportedAt` (alcune recenti, alcune più vecchie) e includi 1–2 con `images` (anche URL placeholder statici, es. `/placeholder-damage.jpg`) per mostrare il campo immagini.
- Idempotenza coerente con il resto del seed (non duplicare ad ogni avvio: stessa strategia già usata per gli altri seed).

### B.4 Backend — slice `FaultRegistry` (sola lettura)

Crea `apps/api/src/slices/FaultRegistry/`:

- `FaultRegistry.types.ts`: `FaultRegistryDeps` (`{ faultReportRepo: IFaultReportRepository; vehicleRepo: IVehicleRepository }`), `FaultRegistryInput` (vuoto/minimo), output = `FaultRegistryResponse` (da `@mvp/contracts`).
- `FaultRegistry.handler.ts`: `createFaultRegistryHandler(deps)`:
  - chiama `faultReportRepo.findAll()`;
  - per ogni report risolve i dati veicolo minimi (`plateOrCode`, `vehicleType`) via `vehicleRepo.findById(vehicleId)` (riusa la stessa logica `plateOrCode = licensePlate ?? \`${type}-${id.slice(-3).toUpperCase()}\`` usata nelle altre slice; se il veicolo non esiste più, usa un fallback leggibile e non rompere);
  - costruisce `FaultReportItem[]` + `total`. Niente filtro server-side.
- `FaultRegistry.router.ts`: `createFaultRegistryRouter(deps)` con:
  - `GET /fault-reports` → lista completa (`FaultRegistryResponse`);
  - gestione errori coerente con gli altri router.
- Dettaglio: per il MVP **non serve un endpoint separato**. La lista può già contenere i campi sufficienti al pannello di dettaglio (incluse `notes` complete e `images`); se preferisci tenere la lista leggera, esponi `GET /fault-reports/:id` che usa `findById`. Scegli la soluzione minima e dichiarala. (Preferenza: singolo endpoint lista con item completi, dettaglio renderizzato client-side.)
- Wiring: in `apps/api/src/composition-root.ts` istanzia `faultReportRepo = new DrizzleFaultReportRepository(db)` e `faultRegistryRouter = createFaultRegistryRouter({ faultReportRepo, vehicleRepo })`.
- Mount in `apps/api/src/app.ts`: monta sotto lo stesso base operatore già usato da Sprint 17 → `app.use('/api/operator', root.faultRegistryRouter)` → endpoint finale `GET /api/operator/fault-reports`. (Assicurati che il mount non collida con le route di `FleetOverview`: path diversi, stesso router base va bene se già strutturato così; in caso, usa un Router Express dedicato montato sullo stesso prefisso.)

### B.5 Frontend — slice `FaultRegistry` (lista + filtro + dettaglio)

Crea `apps/web/src/slices/FaultRegistry/`:

- `FaultRegistry.types.ts`: tipi locali (stato filtri: insieme di `FaultSeverity` attive, `FaultCategory` attiva/"tutte", testo di ricerca per veicolo). Riusa `FaultReportItem`/`FaultRegistryResponse` da `@mvp/contracts`.
- `FaultRegistry.hook.ts`: query TanStack verso `GET /api/operator/fault-reports` (riusa `apiFetch`). Espone `reports`, `isLoading`, `error`, refetch.
- `FaultRegistry.page.tsx`: pagina IF27 dentro `OperatorLayout`. Deve contenere:
  - **Intestazione** "Registro guasti" / "Registro centralizzato segnalazioni".
  - **Contatori** per severità (es. "Critiche: N · Alte: N · Medie: N · Basse: N") e totale, con blocchi/Badge shadcn.
  - **Filtri client-side**:
    - toggle/segmented per severità (default: tutte attive);
    - select/segmented per categoria (default: "Tutte");
    - campo di ricerca per `plateOrCode`/`vehicleId`.
    - I filtri restringono la lista in locale (nessuna nuova chiamata API).
  - **Lista/tabella** delle segnalazioni: per ogni riga `plateOrCode` (+ tipo veicolo), categoria (Badge), severità (Badge colorato per livello), data/ora `reportedAt` (formattata, locale), eventuale indicatore "📷 N" se `imagesCount > 0`, anteprima `notes`.
    - Coerenza stilistica con le card/badge già usati (vedi pattern di `NearbyVehicles.page.tsx` e della pagina IF23 di Sprint 17).
    - Mobile-first: su mobile righe a card impilate; da `md`/`lg` tabella/righe più dense desktop-like.
  - **Dettaglio**: al click su una riga, apri un pannello di dettaglio (es. `Sheet`/`Dialog` shadcn) con: veicolo (`plateOrCode`, tipo), data/ora completa, categoria, severità, `notes` integrali, e le immagini (se presenti, anche placeholder). Read-only: nessuna azione di modifica/risoluzione in questo sprint.
  - **Stati UI**: loading (skeleton), error (con retry), empty (registro vuoto: messaggio curato).
- Route: `apps/web/src/app/operator/guasti/page.tsx` (o `operator/registro-guasti`) che monta `FaultRegistry.page.tsx`. Scegli uno slug e usalo coerentemente.
- **Attiva la voce di nav "Registro guasti"** nella shell operatore (Sprint 17): da segnaposto disabilitato a link reale verso la nuova rotta. Lascia "Blocco remoto" (IF30) come segnaposto.

---

## Verifica finale

- `pnpm typecheck` pulito su web e api.
- `pnpm build` (o build mirate) senza errori.
- `cd apps/api && npx drizzle-kit generate` se usi le migration generate; in ogni caso verifica che il DB venga creato con le nuove tabelle (controlla che `createTables` includa `vehicle_condition_repo` e le altre, e che il file SQLite le contenga).
- Smoke test manuale:
  - login operatore (`flavio.demusso@mvp.local` / `password`) → `/operator`;
  - apri "Registro guasti" → vedi le segnalazioni seedate;
  - filtra per severità/categoria, cerca per veicolo → la lista si aggiorna client-side;
  - apri una segnalazione → dettaglio con note/immagini;
  - utente RIDER che apre la rotta operatore → redirect a `/` (guard di Sprint 17 invariato).
- Usa Graphify a fine lavoro per confermare:
  - zero import cross-slice (inclusa la nuova slice `FaultRegistry`);
  - la slice dipende da `@mvp/contracts` (interfaccia `IFaultReportRepository`), non dall'adapter concreto;
  - l'adapter `DrizzleFaultReportRepository` è fuori dalle slice;
  - nessun ciclo introdotto.

---

## Dati / demo

- Operatori demo: `flavio.demusso@mvp.local`, `gabriele.farigu@mvp.local` — password `password`.
- Segnalazioni demo: seedate in `vehicle_condition_repo`, collegate ai veicoli seed esistenti (area Milano Duomo).

---

## Output finale richiesto

1. decisione architetturale presa e motivazione (nuova slice `FaultRegistry` API + web; uso della tabella reale `vehicle_condition_repo`; lettura sola, seed mock);
2. **sezione "Schema reale introdotto"** (Parte A.4): tabelle aggiunte, quali usate vs solo-dimostrative, adattamenti di tipo e perché;
3. elenco file creati/modificati;
4. sintesi delle scelte implementative (seed, repository Drizzle, filtro client-side, dettaglio);
5. assunzioni fatte (mappatura `category`/`severity` su enum + fallback; assenza del "reporter" nello schema reale → il registro mostra veicolo/condizione, non l'identità dell'utente; gestione veicolo non più esistente; endpoint singolo vs dettaglio);
6. check architetturale finale basato su Graphify;
7. TODO residui per IF30 (segnaposto ancora presente) e per l'eventuale collegamento futuro IF10→IF27 (invio utente che alimenta il registro).

---

## Importante — non fare

- non implementare IF30 (resta segnaposto disabilitato);
- non implementare l'invio segnalazione lato utente (IF10/IF11/IF12): IF27 è sola lettura;
- non usare `support_tickets` per IF27 (è IF26/non-goal): usa `vehicle_condition_repo`;
- non sostituire né rompere le tabelle MVP esistenti (`vehicles`, `users`, `bookings`, `rides`) introducendo lo schema reale: mantieni quelle funzionanti e adatta le FK delle tabelle nuove a id `TEXT`;
- non mettere l'adapter `DrizzleFaultReportRepository` dentro la slice;
- non far dipendere la slice dall'implementazione concreta: dipendi da `IFaultReportRepository` via `@mvp/contracts`;
- non introdurre import tra slice;
- non mettere business logic nel router né far istanziare repository concreti all'handler;
- non far comparire la `BottomNav` rider nella schermata operatore;
- non reimplementare Sprint 17: se manca, fermati e segnalalo;
- se trovi un'ambiguità bloccante, fermati e produci domande precise invece di improvvisare.
