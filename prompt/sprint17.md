Devi implementare il primo blocco della **schermata Operatore** del nostro MVP vehicle sharing, seguendo rigorosamente la Vertical Slice Architecture già presente nel monorepo.

Questo sprint introduce SOLO la prima funzione minima della schermata operatore:

- **IF23 - OP.01**: Visualizzare sulla mappa la posizione dei veicoli filtrandoli per stato (Disponibile, In Uso, In Manutenzione).

Le altre funzioni operatore già pianificate NON fanno parte di questo sprint, ma la schermata va progettata per ospitarle in futuro:

- IF27 - OP.03.2: Visualizzare nel registro centralizzato le segnalazioni di guasto inserite.
- IF30 - OP.11: Inviare un comando remoto di interruzione (blocco) a un veicolo tramite ID.

Per IF27 e IF30 in questo sprint: solo segnaposto disabilitati/"presto disponibile" nella shell operatore. Nessuna logica, nessuna route, nessun contratto.

---

## Contesto verificato (confermato via Graphify + lettura codebase)

- monorepo Turborepo + pnpm
- frontend: `apps/web` — Next.js 14 App Router, React, Tailwind, shadcn/ui, TanStack Query, zustand
- backend: `apps/api` — Express + TypeScript
- shared kernel / contratti: `packages/contracts`
- database: SQLite + Drizzle ORM
- Graphify ha confermato: nessun import cross-slice, dipendenze verso `@mvp/contracts`

Stato auth attuale (importante):
- L'autenticazione è solo lato client, demo-oriented.
- `apps/web/src/slices/Login/Login.page.tsx` cerca l'utente in `DEMO_USERS`, valida `password === 'password'`, imposta `currentUserId` nello store (`useAppStore`) e fa **sempre** `router.push('/')`.
- NON esiste ancora un redirect per ruolo.
- `apps/web/src/stores/app.store.ts` persiste `currentUserId` (zustand persist, default `'u1'`).
- `apps/web/src/lib/demo-users.ts` contiene già gli operatori:
  - `u2` → `flavio.demusso@mvp.local` → `UserRole.OPERATOR`
  - `u3` → `gabriele.farigu@mvp.local` → `UserRole.OPERATOR`
  - (`u1` RIDER, `u4`/`u5` ADMIN)

Stato dominio veicoli:
- `VehicleStatus` (`packages/contracts/src/enums/index.ts`): `AVAILABLE`, `IN_USE`, `RESERVED`, `MAINTENANCE`, `OFFLINE`.
  - Mappa stati richiesti da IF23: `AVAILABLE` = "Disponibile", `IN_USE` = "In uso", `MAINTENANCE` = "In manutenzione".
- `Vehicle` (`packages/contracts/src/types/index.ts`) ha `id`, `type`, `status`, `location: { lat, lng }`, `battery`, `model`, `licensePlate?`.
- `IVehicleRepository.search(filters)` con `{ query?, type?, onlyAvailable? }`.
  - VERIFICATO: `DrizzleVehicleRepository.search({})` (filtri vuoti) ritorna **l'intera flotta**, tutti gli stati, con `location`. Quindi NON serve estendere il contratto per questo sprint.

Convenzioni VSA (già in uso):
- Slice API: `Slice.types.ts` + `Slice.handler.ts` + `Slice.router.ts`.
- Handler puro creato con `createXHandler(deps)`, indipendente da Express.
- Router fa solo HTTP (parse → handler → response).
- Wiring concreto in `apps/api/src/composition-root.ts`, mount in `apps/api/src/app.ts`.
- Slice web: `Slice.types.ts` + `Slice.hook.ts` + `Slice.page.tsx`, route in `apps/web/src/app/<route>/page.tsx` che monta la page della slice.

---

## Decisioni MVP già fissate (NON rimetterle in discussione)

1. **Mappa schematica leggera**, NON una mappa reale.
   - Rispetta le geo rules del `CLAUDE.md`: niente mappe reali, niente GeoJSON, niente librerie geospaziali.
   - Resa: un riquadro/canvas che plotta i veicoli per coordinate semplici (`location.lat`/`location.lng` normalizzate sul bounding box dei veicoli) con marker colorati per stato.
   - Nessuna nuova dipendenza per la mappa.
2. **Filtro per stato lato client.**
   - Il backend ritorna l'intera flotta; il filtro Disponibile / In uso / In manutenzione avviene nel frontend operatore.
   - NON modificare `packages/contracts` né `VehicleSearchFilters` per questo sprint.
3. **Shell operatore dedicata (desktop-like, mobile-first che diventa desktop-like).**
   - NIENTE `BottomNav` rider nella schermata operatore.
   - Layout responsive a blocchi shadcn: topbar operatore + griglia che da mobile (stack verticale) diventa desktop (più colonne).
   - Predisposta per ospitare IF27 e IF30 (segnaposto disabilitati).

---

## Vincoli architetturali non negoziabili

1. Nessun import tra slice.
2. La nuova slice backend deve rispettare il pattern `FleetOverview.types.ts` / `FleetOverview.handler.ts` / `FleetOverview.router.ts`.
3. Il router Express fa solo lavoro HTTP; l'handler è puro (`createFleetOverviewHandler(deps)`), tipizzato in input/output, senza dipendenze da Express.
4. Le dipendenze concrete si risolvono nel composition root.
5. La nuova slice web rispetta `FleetOverview.types.ts` / `FleetOverview.hook.ts` / `FleetOverview.page.tsx`.
6. Web e API condividono tipi SOLO via `@mvp/contracts`.
7. Nessun adapter concreto dentro le slice.
8. Usa Graphify all'inizio e alla fine per confermare assenza di coupling scorretto e di cicli.

---

## Task da eseguire

### 1. Redirect operatore al login + guard di rotta

- Modifica `apps/web/src/slices/Login/Login.page.tsx`:
  - dopo aver impostato `currentUserId`, calcola il ruolo dell'utente da `DEMO_USERS`;
  - se `role === UserRole.OPERATOR` → `router.push('/operator')`;
  - altrimenti → `router.push('/')` (comportamento attuale invariato per RIDER; ADMIN fuori scope, trattalo come gli altri = `/`).
- Aggiungi un guard minimo per la rotta operatore (client-side, coerente con l'auth demo attuale):
  - introduci un piccolo helper per risolvere l'utente/ruolo corrente da `currentUserId` + `DEMO_USERS` (es. `apps/web/src/lib/use-current-user.ts` o simile, riusabile);
  - nella shell/route operatore: se l'utente corrente non è `OPERATOR`, redirect a `/`.
- Non introdurre auth reale, JWT, sessioni server: resta nel modello demo esistente.

### 2. Backend — nuova slice `FleetOverview` (sola lettura)

Crea `apps/api/src/slices/FleetOverview/`:
- `FleetOverview.types.ts`: `FleetOverviewDeps` (`{ vehicleRepo: IVehicleRepository }`), `FleetOverviewInput` (vuoto/minimo), `FleetOverviewOutput`.
- `FleetOverview.handler.ts`: `createFleetOverviewHandler(deps)` che chiama `deps.vehicleRepo.search({})` e mappa ogni `Vehicle` in un item flotta minimale:
  - `id`, `plateOrCode` (usa `licensePlate ?? \`${type}-${id.slice(-3).toUpperCase()}\``, coerente con la slice Search), `type`, `status`, `model`, `batteryLevel`, `position: { lat, lng }`.
  - Output: `{ vehicles: FleetVehicleItem[], total }`. Nessun filtro per stato lato server (filtro è client).
- `FleetOverview.router.ts`: `createFleetOverviewRouter(deps)` con `GET /fleet`, gestione errori coerente con gli altri router.
- Tipi item/response: se sono utili anche al web, valuta se aggiungerli a `packages/contracts` (es. `FleetVehicleItem`, `FleetOverviewResponse`); se restano interni all'API, tienili nella slice. Preferisci la soluzione minima: se il web ne ha bisogno, esponili da `@mvp/contracts` per non duplicare.
- Wiring: aggiungi `fleetOverviewRouter: createFleetOverviewRouter({ vehicleRepo })` in `apps/api/src/composition-root.ts`.
- Mount in `apps/api/src/app.ts`: `app.use('/api/operator', root.fleetOverviewRouter)` → endpoint finale `GET /api/operator/fleet`.

### 3. Frontend — shell operatore dedicata

- Crea una shell operatore in `apps/web/src/components/layout/` (es. `OperatorLayout.tsx` + eventuale `OperatorHeader.tsx`):
  - NON usa `BottomNav`.
  - Topbar con titolo (es. "Centro Operativo"), identità operatore corrente, azione logout/cambio account coerente con lo store.
  - Contenuto in griglia responsive con blocchi shadcn: mobile = stack verticale; da `md`/`lg` = layout multi-colonna desktop-like.
  - Navigazione operatore con voci: "Mappa flotta" (attiva, IF23), "Registro guasti" (IF27, disabilitata/"presto"), "Blocco remoto" (IF30, disabilitata/"presto"). Solo segnaposto per IF27/IF30.
- Route: `apps/web/src/app/operator/page.tsx` che monta la page della slice.

### 4. Frontend — slice `FleetOverview` (IF23: mappa + filtro stato)

Crea `apps/web/src/slices/FleetOverview/`:
- `FleetOverview.types.ts`: tipi locali della slice (stato filtri, ecc.). Riusa i tipi item/response da `@mvp/contracts` se esposti al punto 2.
- `FleetOverview.hook.ts`: query TanStack verso `GET /api/operator/fleet` (riusa `apiFetch`). Espone veicoli, `isLoading`, `error`.
- `FleetOverview.page.tsx`: la pagina IF23, dentro `OperatorLayout`. Deve contenere:
  - **Filtro per stato** (client-side): controlli a toggle/segmented per Disponibile / In uso / In manutenzione. Default: tutti e tre attivi. Il filtro nasconde/mostra i marker sulla mappa e le righe in lista.
  - **Mappa schematica leggera**: blocco/card shadcn con un riquadro che plotta i veicoli per coordinate normalizzate sul bounding box dei veicoli, marker colorati per stato + legenda. Niente librerie mappa.
  - **Lista flotta** affiancata/sotto la mappa (responsive): per ogni veicolo plateOrCode, tipo, stato (Badge), batteria; coerente con lo stile delle card esistenti (vedi `NearbyVehicles.page.tsx` per pattern badge/icone/colori).
  - **Contatori per stato** (es. "Disponibili: N · In uso: N · In manutenzione: N") da blocchi shadcn.
  - Stati UI: loading (skeleton), error (con retry), empty.
- Riusa label/colori stato già usati lato rider per coerenza (Disponibile/In uso/Manutenzione). Mostra solo i tre stati richiesti da IF23 nei filtri; gli altri stati (`RESERVED`, `OFFLINE`) per ora puoi escluderli dalla vista o mapparli in modo neutro — scegli la soluzione minima e dichiarala come assunzione.

### 5. Verifica finale

- `pnpm typecheck` pulito su web e api.
- `pnpm build` (o build mirate) senza errori.
- Smoke test manuale del flusso:
  - login con `flavio.demusso@mvp.local` / `password` → redirect a `/operator`;
  - login con utente RIDER → resta su `/`;
  - utente non operatore che apre `/operator` → redirect a `/`.
- Usa Graphify a fine lavoro per confermare:
  - zero import cross-slice (incluse le nuove slice `FleetOverview`);
  - dipendenze solo verso `@mvp/contracts`, framework e file della stessa slice;
  - nessun ciclo introdotto.

---

## Dati / demo

- Operatori demo: `flavio.demusso@mvp.local`, `gabriele.farigu@mvp.local` — password `password`.
- I veicoli seed hanno già coordinate semplici (area Milano Duomo): sufficienti per la mappa schematica.

---

## Output finale richiesto

1. decisione architetturale presa e motivazione (nuova slice `FleetOverview` API + web, shell operatore dedicata);
2. elenco file creati/modificati;
3. sintesi delle scelte implementative (redirect/guard, mappa schematica, filtro client-side);
4. assunzioni fatte (es. gestione `RESERVED`/`OFFLINE`, comportamento ADMIN);
5. check architetturale finale basato su Graphify;
6. TODO residui per IF27 e IF30 (segnaposto già predisposti nella shell).

---

## Importante — non fare

- non implementare IF27 o IF30 (solo segnaposto disabilitati);
- non introdurre una mappa reale o librerie geospaziali;
- non estendere `packages/contracts`/`VehicleSearchFilters` per filtrare lo stato lato server;
- non introdurre auth reale (JWT, sessioni server): resta nel modello demo client-side;
- non far comparire la `BottomNav` rider nella schermata operatore;
- non introdurre import tra slice;
- non mettere business logic nel router né far istanziare repository concreti all'handler;
- se trovi un'ambiguità bloccante, fermati e produci domande precise invece di improvvisare.
