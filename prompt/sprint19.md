Devi implementare il terzo e ultimo blocco della **schermata Operatore** del nostro MVP vehicle sharing, seguendo rigorosamente la Vertical Slice Architecture già presente nel monorepo.

Questo sprint introduce la terza funzione della schermata operatore:

- **IF30 - OP.11**: Inviare un **comando remoto di interruzione (blocco)** a un veicolo identificato tramite il suo Codice Identificativo (ID), così che il mezzo risulti **inutilizzabile**. Lo sprint include anche il **comando remoto di sblocco (unblock)** per ripristinare un veicolo precedentemente bloccato, così che l'operatore possa riportarlo in disponibilità.

Con questo sprint la schermata operatore completa le tre funzioni pianificate (IF23, IF27, IF30). Non c'è una quarta funzione operatore in scope.

> Nota: IF30 nel documento requisiti descrive il solo comando di blocco. Lo sblocco è un'estensione operativa minima e simmetrica decisa per questo sprint (utile per la demo e per non lasciare veicoli permanentemente inutilizzabili). Dichiaralo esplicitamente nel report finale.

---

## Premessa importante: dipendenza da Sprint 17 e Sprint 18

Questo sprint **presuppone che Sprint 17 (IF23 - OP.01) e Sprint 18 (IF27 - OP.03.2) siano già stati implementati**, quindi assume che esistano:

- la **shell operatore** dedicata (`OperatorLayout` + header operatore, niente `BottomNav` rider);
- la rotta `apps/web/src/app/operator/page.tsx` (IF23, mappa flotta) e il redirect/guard di ruolo al login (operatore → `/operator`);
- l'helper di risoluzione utente/ruolo corrente (es. `apps/web/src/lib/use-current-user.ts`);
- la rotta IF27 (es. `apps/web/src/app/operator/guasti/page.tsx`) con la slice `FaultRegistry` già attiva;
- la nav operatore con le voci: "Mappa flotta" (attiva, IF23), "Registro guasti" (attiva, IF27), **"Blocco remoto" (IF30, oggi segnaposto disabilitato)**;
- il mount API operatore `app.use('/api/operator', ...)` con le slice `FleetOverview` e `FaultRegistry` già montate;
- lo schema reale completo introdotto in Sprint 18 (`apps/api/src/db/schema.ts` + `createTables`), con le tabelle MVP `vehicles`/`users`/`bookings`/`rides` ancora a id `TEXT`.

In questo sprint la voce **"Blocco remoto" smette di essere un segnaposto** e diventa una pagina reale.

Se, aprendo il codice, scopri che Sprint 17 o Sprint 18 NON sono ancora stati implementati (manca `OperatorLayout`, manca `/operator`, manca il mount `/api/operator`, manca la slice `FaultRegistry`), **fermati e segnalalo**: non reimplementarli dentro questo sprint, non improvvisare una shell parziale incoerente. Produci una nota chiara e attendi indicazioni.

---

## Contesto verificato (confermato via lettura codebase)

- monorepo Turborepo + pnpm
- frontend: `apps/web` — Next.js 14 App Router, React, Tailwind, shadcn/ui, TanStack Query, zustand
- backend: `apps/api` — Express + TypeScript
- shared kernel / contratti: `packages/contracts`
- database: SQLite + Drizzle ORM

Stato dominio veicoli (VERIFICATO):

- `VehicleStatus` (`packages/contracts/src/enums/index.ts`): `AVAILABLE`, `IN_USE`, `RESERVED`, `MAINTENANCE`, `OFFLINE`. **Non esiste oggi uno stato "bloccato".**
- `IVehicleRepository` (`packages/contracts/src/interfaces/index.ts`) espone **già** `findById(id)` e `updateStatus(id, status): Promise<void>`. Queste due operazioni sono **sufficienti** per IF30: NON serve estendere l'interfaccia repository.
- `DrizzleVehicleRepository.updateStatus` è già usata da UnlockVehicle/EndRide e dalla logica di scadenza prenotazione (II03), quindi è un percorso collaudato.
- `Vehicle` (`packages/contracts/src/types/index.ts`) ha `id`, `type`, `status`, `location`, `battery`, `model`, `licensePlate?`.

Convenzioni VSA (già in uso, non negoziabili):

- Slice API: `Slice.types.ts` + `Slice.handler.ts` + `Slice.router.ts`.
- Handler puro creato con `createXHandler(deps)`, indipendente da Express.
- Router fa solo HTTP (parse → handler → response), nessuna business logic.
- Wiring concreto in `apps/api/src/composition-root.ts`, mount in `apps/api/src/app.ts`.
- Adapter concreti (repository/service) in `apps/api/src/adapters`, MAI dentro le slice. I service esterni (unlock, billing, gps, zone) sono **mock** coerenti con i contratti (`apps/api/src/adapters/services`).
- Slice web: `Slice.types.ts` + `Slice.hook.ts` + `Slice.page.tsx`, route in `apps/web/src/app/<route>/page.tsx` che monta la page della slice.
- Web e API condividono tipi SOLO via `@mvp/contracts`.

---

## Decisioni MVP già fissate (NON rimetterle in discussione)

1. **Il blocco/sblocco = transizione di stato del veicolo da/verso un nuovo stato `BLOCKED`.**
   - IF30 (blocco) cambia lo stato del veicolo in "bloccato": il mezzo risulta inutilizzabile.
   - Lo sblocco riporta il veicolo a `AVAILABLE` (vedi assunzione in B.2: nel MVP non si persiste lo stato precedente al blocco, quindi lo sblocco ripristina sempre `AVAILABLE`).
   - Introduci un nuovo valore enum `VehicleStatus.BLOCKED = 'BLOCKED'` (vedi Parte A). NON riusare `OFFLINE`/`MAINTENANCE`: il blocco remoto ha semantica propria (antifurto / mezzo segnalato come rubato) e va distinto nella UI operatore.
2. **I comandi remoti sono un service mock, coerente con gli altri adapter.**
   - Non esiste hardware reale: i "comandi remoti" (block/unblock) sono simulati da un mock service (`MockRemoteCommandService`) coerente con il pattern di `MockUnlockService`.
   - Il flusso blocco è: il service "invia" il comando (sempre successo nel MVP) → l'handler persiste lo stato `BLOCKED` via `vehicleRepo.updateStatus`.
   - Il flusso sblocco è simmetrico: il service "invia" il comando → l'handler persiste lo stato `AVAILABLE`.
3. **Niente caso "veicolo in uso" da gestire come flusso reale.**
   - Come da indicazione: nel MVP non si verifica che il veicolo da bloccare sia attivamente `IN_USE`.
   - Tuttavia l'handler deve restare difensivo: se per qualunque ragione il veicolo non esiste → errore "not found" chiaro; se è già `BLOCKED` → operazione **idempotente** (successo, nessun errore). Per `IN_USE` scegli la soluzione minima e dichiarala come assunzione (vedi B.2: rifiuto con messaggio chiaro, oppure blocco consentito) — non costruirci sopra un flusso complesso.
4. **Azione distruttiva → conferma esplicita lato UI.**
   - Il blocco è un'azione potenzialmente distruttiva: la pagina deve richiedere conferma esplicita (Dialog/AlertDialog shadcn) prima di inviare il comando.
5. **Shell operatore dedicata già esistente (Sprint 17).**
   - La pagina IF30 vive dentro `OperatorLayout`, niente `BottomNav` rider.
   - Si attiva la voce di nav "Blocco remoto" (prima segnaposto).

---

## Vincoli architetturali non negoziabili

1. Nessun import tra slice. In particolare la slice `RemoteBlock` **non** importa `FleetOverview` né `FaultRegistry`.
2. La nuova slice backend deve rispettare il pattern `RemoteBlock.types.ts` / `RemoteBlock.handler.ts` / `RemoteBlock.router.ts`.
3. Il router Express fa solo lavoro HTTP; l'handler è puro (`createRemoteBlockHandler(deps)`), tipizzato in input/output, senza dipendenze da Express.
4. Le dipendenze concrete (repository, service) si risolvono nel composition root.
5. La nuova slice web rispetta `RemoteBlock.types.ts` / `RemoteBlock.hook.ts` / `RemoteBlock.page.tsx`.
6. Web e API condividono tipi SOLO via `@mvp/contracts`.
7. Nessun adapter concreto dentro la slice: `MockRemoteCommandService` sta in `apps/api/src/adapters/services`.
8. La slice dipende dall'interfaccia `IRemoteCommandService` (in `@mvp/contracts`) e da `IVehicleRepository`, mai dall'implementazione concreta.
9. Nessuna dipendenza circolare. Usa Graphify all'inizio e alla fine per confermarlo.

---

## PARTE A — Nuovo stato `BLOCKED`

### A.1 Contracts

- In `packages/contracts/src/enums/index.ts` aggiungi a `VehicleStatus` il valore `BLOCKED = 'BLOCKED'`.
- Verifica che l'aggiunta non rompa gli `switch`/mapping esistenti che enumerano gli stati (label, colori, badge) lato web e api. Dove un mapping è esaustivo, aggiungi il caso `BLOCKED` con una resa neutra/coerente (label "Bloccato", colore di allerta es. rosso/grigio scuro). NON modificare il comportamento degli altri stati.

### A.2 Impatto su IF23 (FleetOverview) — minimo e dichiarato

- IF23 filtra solo Disponibile / In uso / In manutenzione. Un veicolo `BLOCKED` rientra negli "altri stati" già gestiti da Sprint 17 (come `RESERVED`/`OFFLINE`).
- **Minimo richiesto**: il veicolo bloccato non deve rompere mappa/lista/contatori di IF23 (nessun crash, nessun marker senza colore). Mantieni la stessa strategia già scelta in Sprint 17 per gli stati fuori dai tre filtri.
- **Opzionale (non obbligatorio in questo sprint)**: mostrare i veicoli `BLOCKED` con un badge/colore dedicato in IF23 e/o aggiungere un quarto filtro "Bloccati". Se lo fai, resta minimale e dichiaralo; se non lo fai, lascialo come TODO.

---

## PARTE B — IF30: comando remoto di blocco

### B.1 Contracts (`packages/contracts`)

- Interfaccia service (in `packages/contracts/src/interfaces/index.ts`), coerente con `IUnlockService`:
  - `IRemoteCommandService`:
    - `block(vehicleId: string): Promise<{ success: boolean }>`
    - `unblock(vehicleId: string): Promise<{ success: boolean }>`
  - Mantieni l'interfaccia minima (solo `block`/`unblock`).
- Tipi (in `packages/contracts/src/types/index.ts`), usati da web + api:
  - `RemoteCommandResult` (usato sia per blocco sia per sblocco):
    - `vehicleId: string`
    - `plateOrCode: string`
    - `previousStatus: VehicleStatus`
    - `status: VehicleStatus` (atteso `BLOCKED` dopo blocco, `AVAILABLE` dopo sblocco)
    - `executedAt: string` (ISO string nel transport)
  - (opzionale) un tipo input condiviso se utile; altrimenti l'input è solo `{ vehicleId }` e può restare locale.
- Allinea export in `packages/contracts/src/index.ts`.

### B.2 Backend — slice `RemoteBlock`

Crea `apps/api/src/slices/RemoteBlock/`:

- `RemoteBlock.types.ts`: `RemoteBlockDeps` (`{ vehicleRepo: IVehicleRepository; remoteCommandService: IRemoteCommandService }`), `RemoteBlockInput` (`{ vehicleId: string }`), output = `RemoteCommandResult` (da `@mvp/contracts`). Modella i due comandi come un'azione tipizzata (es. un campo `action: 'BLOCK' | 'UNBLOCK'` nell'input, oppure due funzioni handler distinte `block`/`unblock`): scegli la soluzione minima e usala coerentemente.
- `RemoteBlock.handler.ts`: `createRemoteBlockHandler(deps)` che espone le due operazioni (blocco e sblocco). Logica condivisa:
  - valida/normalizza `vehicleId` (trim); se vuoto → errore di validazione chiaro;
  - `vehicleRepo.findById(vehicleId)`: se `null` → errore "not found" tipizzato (il router lo tradurrà in 404);
  - **Blocco**:
    - se lo stato è già `BLOCKED` → **idempotente**: ritorna il risultato con `previousStatus = status = BLOCKED` senza rinviare il comando (oppure rinviandolo, ma senza errore);
    - **assunzione `IN_USE`** (dichiarala): nel MVP non si verifica; soluzione minima consigliata — rifiuta con errore "conflict" chiaro ("veicolo attualmente in uso, impossibile bloccare da remoto in questa fase") tradotto in 409. Non costruire un flusso di interruzione corsa.
    - altrimenti: `remoteCommandService.block(vehicleId)`; se `success` → `vehicleRepo.updateStatus(vehicleId, VehicleStatus.BLOCKED)`.
  - **Sblocco**:
    - se lo stato **non** è `BLOCKED` → errore "conflict" chiaro ("il veicolo non è bloccato") tradotto in 409. (In alternativa, se preferisci la massima idempotenza, ritorna successo no-op quando già non bloccato: scegli e dichiara.)
    - altrimenti: `remoteCommandService.unblock(vehicleId)`; se `success` → `vehicleRepo.updateStatus(vehicleId, VehicleStatus.AVAILABLE)`. **Assunzione** (dichiarala): lo sblocco ripristina sempre `AVAILABLE`, perché il MVP non persiste lo stato precedente al blocco.
  - In entrambi i casi costruisci `RemoteCommandResult` (`plateOrCode = licensePlate ?? \`${type}-${id.slice(-3).toUpperCase()}\``, coerente con le altre slice; `previousStatus`, `status` risultante, `executedAt = new Date().toISOString()`);
  - se il service ritorna `success === false` → errore "comando non riuscito" (502/500 a scelta, coerente con gli altri router).
  - L'handler NON istanzia repository/service concreti: tutto via `deps`.
- `RemoteBlock.router.ts`: `createRemoteBlockRouter(deps)` con:
  - `POST /vehicles/:id/block` → blocco, risponde con `RemoteCommandResult`;
  - `POST /vehicles/:id/unblock` → sblocco, risponde con `RemoteCommandResult`;
  - mappa gli errori dell'handler su status HTTP coerenti con gli altri router (validazione → 400, not found → 404, conflict → 409, comando fallito → 502/500);
  - nessuna business logic nel router.
- Wiring: in `apps/api/src/composition-root.ts`:
  - istanzia `remoteCommandService = new MockRemoteCommandService()` (vedi B.3);
  - `remoteBlockRouter = createRemoteBlockRouter({ vehicleRepo, remoteCommandService })` (riusa il `vehicleRepo` già presente nel composition root).
- Mount in `apps/api/src/app.ts`: sotto lo stesso base operatore già usato → `app.use('/api/operator', root.remoteBlockRouter)` → endpoint finali `POST /api/operator/vehicles/:id/block` e `POST /api/operator/vehicles/:id/unblock`. Assicurati che i path non collidano con quelli di `FleetOverview` (`GET /fleet`) e `FaultRegistry` (`GET /fault-reports`).

### B.3 Adapter concreto (`apps/api/src/adapters/services`)

- Crea `MockRemoteCommandService.ts` che implementa `IRemoteCommandService`:
  - `block(vehicleId)` e `unblock(vehicleId)` simulano l'invio del comando remoto e ritornano `{ success: true }` (eventualmente con un piccolo log/console coerente con gli altri mock service).
  - Nessuna dipendenza esterna reale (coerente con le data/infra rules del `CLAUDE.md`).
  - L'adapter NON sta dentro la slice.

### B.4 Frontend — slice `RemoteBlock`

Crea `apps/web/src/slices/RemoteBlock/`:

- `RemoteBlock.types.ts`: tipi locali (stato del form, id selezionato/digitato, azione corrente block/unblock, esito). Riusa `RemoteCommandResult` da `@mvp/contracts`.
- `RemoteBlock.hook.ts`:
  - due mutation TanStack (o una mutation parametrica per azione) verso `POST /api/operator/vehicles/:id/block` e `POST /api/operator/vehicles/:id/unblock` (riusa `apiFetch`). Espone `block(vehicleId)`, `unblock(vehicleId)`, `isPending`, `error`, `data` (esito).
  - **Opzionale ma consigliato** (resta self-contained, niente import cross-slice): una query verso `GET /api/operator/fleet` per popolare un selettore di veicoli con il loro stato attuale, così l'operatore sceglie da elenco invece di digitare l'ID a mano. È consentito chiamare lo stesso endpoint API senza importare codice della slice `FleetOverview`. Se lo fai, dopo un blocco/sblocco riuscito invalida questa query per riflettere il nuovo stato.
- `RemoteBlock.page.tsx`: pagina IF30 dentro `OperatorLayout`. Deve contenere:
  - **Intestazione** "Blocco remoto" / "Invio comando remoto di interruzione".
  - **Input ID veicolo**: campo per inserire/incollare il Codice Identificativo del veicolo (IF30 richiede esplicitamente l'inserimento dell'ID). Se implementi il selettore opzionale da flotta, mantieni comunque la possibilità di selezionare/individuare il veicolo per ID.
  - **Azione contestuale block/unblock**: l'azione disponibile dipende dallo stato del veicolo selezionato. Se il veicolo è `BLOCKED` → mostra "Sblocca veicolo"; altrimenti → "Blocca veicolo". Se l'operatore digita un ID a mano senza conoscerne lo stato, è accettabile mostrare entrambe le azioni e lasciare che l'API rifiuti quella non valida (409) con messaggio chiaro.
  - **Conferma esplicita**: al click su "Blocca veicolo" / "Sblocca veicolo" apri un `AlertDialog`/`Dialog` shadcn che riepiloga veicolo (ID/`plateOrCode`) e l'effetto (blocco → mezzo inutilizzabile; sblocco → mezzo di nuovo disponibile); il comando parte solo dopo conferma.
  - **Esito**: dopo il successo, mostra uno stato di conferma curato (es. card con `plateOrCode`, `previousStatus` → `status` risultante, orario) e, se presente il selettore flotta, riflette il nuovo stato.
  - **Stati UI**: idle, `isPending` (bottone in loading, disabilitato), error (messaggi distinti per 400/404/409/comando fallito, con possibilità di ritentare), e gestione dei casi idempotenti/no-op (es. "già bloccato" / "non è bloccato") con messaggio coerente, non un crash.
  - Coerenza stilistica con IF23/IF27 (card/badge/colori stato; riusa la label/colore di `BLOCKED` definiti in A.1).
  - Mobile-first che diventa desktop-like, come le altre pagine operatore.
- Route: `apps/web/src/app/operator/blocco/page.tsx` (o `operator/blocco-remoto`) che monta `RemoteBlock.page.tsx`. Scegli uno slug e usalo coerentemente.
- **Attiva la voce di nav "Blocco remoto"** nella shell operatore: da segnaposto disabilitato a link reale verso la nuova rotta. Ora tutte e tre le voci operatore (Mappa flotta, Registro guasti, Blocco remoto) sono attive.

---

## Verifica finale

- `pnpm typecheck` pulito su web e api (attenzione ai mapping esaustivi di `VehicleStatus` dopo l'aggiunta di `BLOCKED`).
- `pnpm build` (o build mirate) senza errori.
- Smoke test manuale:
  - login operatore (`flavio.demusso@mvp.local` / `password`) → `/operator`;
  - apri "Blocco remoto" → inserisci/seleziona l'ID di un veicolo `AVAILABLE` → conferma → esito di successo, stato del veicolo → `BLOCKED`;
  - sblocca lo stesso veicolo → conferma → esito di successo, stato del veicolo → `AVAILABLE`;
  - torna su "Mappa flotta" (IF23) → il veicolo bloccato non rompe mappa/lista/contatori;
  - ripeti il blocco sullo stesso veicolo bloccato → comportamento idempotente (nessun errore); prova a sbloccare un veicolo non bloccato → 409 chiaro (o no-op, secondo la scelta dichiarata);
  - ID inesistente → errore "not found" chiaro (404);
  - utente RIDER che apre la rotta operatore → redirect a `/` (guard di Sprint 17 invariato).
- Usa Graphify a fine lavoro per confermare:
  - zero import cross-slice (la nuova slice `RemoteBlock` non importa `FleetOverview`/`FaultRegistry`);
  - la slice dipende da `@mvp/contracts` (`IRemoteCommandService`, `IVehicleRepository`), non dall'adapter concreto;
  - l'adapter `MockRemoteCommandService` è fuori dalle slice;
  - nessun ciclo introdotto.

---

## Dati / demo

- Operatori demo: `flavio.demusso@mvp.local`, `gabriele.farigu@mvp.local` — password `password`.
- Veicoli seed esistenti (area Milano Duomo): sufficienti per scegliere un ID e dimostrare il blocco.

---

## Output finale richiesto

1. decisione architetturale presa e motivazione (nuova slice `RemoteBlock` API + web; nuovo stato `BLOCKED`; comandi remoti block/unblock come mock service coerente con `MockUnlockService`; riuso di `IVehicleRepository.updateStatus`);
2. elenco file creati/modificati;
3. sintesi delle scelte implementative (transizioni di stato block/unblock, conferma UI, idempotenza, gestione errori 400/404/409/502);
4. assunzioni fatte (estensione `unblock` non prevista dal requisito IF30 originale; sblocco ripristina sempre `AVAILABLE` perché non si persiste lo stato pre-blocco; comportamento su `IN_USE`; resa di `BLOCKED` in IF23; idempotenza/no-op su veicolo già bloccato o non bloccato);
5. check architetturale finale basato su Graphify;
6. TODO residui (es. filtro/badge dedicato "Bloccati" in IF23 se non implementato, audit log dei comandi remoti, ripristino dello stato esatto pre-blocco invece di `AVAILABLE`, collegamento futuro con segnalazioni IF27 → blocco).

---

## Importante — non fare

- non riusare `OFFLINE`/`MAINTENANCE` al posto del nuovo stato `BLOCKED`;
- non costruire un flusso di interruzione corsa per il caso `IN_USE` (nel MVP non si verifica): gestiscilo in modo minimo e dichiaralo;
- non estendere `IVehicleRepository` (bastano `findById` + `updateStatus`);
- non mettere l'adapter `MockRemoteCommandService` dentro la slice;
- non far dipendere la slice dall'implementazione concreta: dipendi da `IRemoteCommandService` via `@mvp/contracts`;
- non introdurre import tra slice (niente import di `FleetOverview`/`FaultRegistry`);
- non mettere business logic nel router né far istanziare repository/service concreti all'handler;
- non introdurre auth reale (JWT, sessioni server): resta nel modello demo client-side;
- non far comparire la `BottomNav` rider nella schermata operatore;
- non reimplementare Sprint 17/18: se mancano, fermati e segnalalo;
- non eseguire un blocco o uno sblocco senza conferma esplicita dell'operatore lato UI;
- se trovi un'ambiguità bloccante, fermati e produci domande precise invece di improvvisare.
