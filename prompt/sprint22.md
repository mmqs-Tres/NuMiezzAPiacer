Devi implementare la **seconda e ultima funzione della fase Pubblica Amministrazione (PA)** del nostro MVP vehicle sharing, seguendo rigorosamente la Vertical Slice Architecture già presente nel monorepo.

Questo è lo **sprint conclusivo del piano PA** (e dell'MVP): trasforma il secondo segnaposto PA (predisposto dallo Sprint 20) in una funzione end-to-end:

- **IF19 - AP.04.1**: La PA può **creare aree geografiche delimitate (Geofence)** per segnalare i **cantieri stradali**.
- **IF21 - AP.04.3**: Dentro queste aree è **impedita la conclusione del noleggio** (`EndRide`), così che un rider non possa lasciare il mezzo dentro un cantiere.

Le due funzioni sono parte dello stesso flusso e si implementano insieme in questo sprint: senza i geofence (IF19) l'enforcement (IF21) non avrebbe dati su cui operare.

In questo sprint la voce di nav **"Aree cantiere (Geofence)" smette di essere un segnaposto** e diventa una pagina reale. Con essa la shell PA completa entrambe le funzioni pianificate (IF18 già attiva dallo Sprint 21, IF19/IF21 qui). Non c'è una terza funzione PA in scope.

---

## Premessa importante: dipendenza da Sprint 17, 18, 19, 20 e 21

Questo sprint **presuppone che Sprint 17 (IF23), Sprint 18 (IF27 + schema reale), Sprint 19 (IF30 + `VehicleStatus.BLOCKED`), Sprint 20 (init PA) e Sprint 21 (IF18 analytics) siano già stati implementati**, quindi assume che esistano:

- la **shell PA desktop-first** (Sprint 20): `AdminLayout` (+ `AdminHeader`/sidebar leggera) in `apps/web/src/components/layout/`, distinta da `OperatorLayout` e dalla `BottomNav` rider;
- la rotta `apps/web/src/app/admin/page.tsx` (home/overview PA), il redirect post-login `ADMIN → /admin` e il guard di ruolo (`/admin` accessibile solo ad `ADMIN`, altrimenti redirect a `/`), basati sull'helper di risoluzione utente/ruolo corrente (`apps/web/src/lib/use-current-user.ts` o equivalente). NON duplicarlo;
- la nav PA con le due voci: **"Analisi corse" (IF18, ora attiva dallo Sprint 21)** e **"Aree cantiere (Geofence)" (IF19/IF21, oggi ancora segnaposto disabilitato)**;
- il namespace API PA **`/api/admin` già attivo** (Sprint 21 lo ha montato per `GET /api/admin/analytics/rides`);
- lo **scaffolding di contratti IF19/IF21 introdotto in Sprint 20** (VERIFICA che esista davvero, vedi sotto):
  - il tipo di dominio `WorkZone` in `packages/contracts/src/types/index.ts`: `{ id: string; name: string; active: boolean; polygon: Coordinates[]; createdAt: Date; notes?: string }`;
  - l'interfaccia `IWorkZoneRepository` in `packages/contracts/src/interfaces/index.ts` con `findAll()`, `findActive()`, `create(data: Omit<WorkZone, 'id' | 'createdAt'>)`;
  - il punto di estensione enforcement `isInBlockedArea(coords: Coordinates): Promise<{ blocked: boolean; zoneId?: string }>` su `IZoneValidator`;
  - lo stub `apps/api/src/adapters/db/InMemoryWorkZoneRepository.ts` (1 geofence demo area Milano Duomo) e l'implementazione stub `MockZoneValidator.isInBlockedArea` (ritorna sempre `{ blocked: false }`);
  - lo schema reale Sprint 18 con le tabelle `areas`, `area_vertexes`, `zone_vertexes`, `zone_roles` in `apps/api/src/db/schema.ts` + `createTables`.

Se, aprendo il codice, scopri che Sprint 17/18/19/20/21 NON sono ancora stati implementati (manca `AdminLayout`, manca `/admin`, manca il guard `ADMIN`, **mancano `WorkZone` / `IWorkZoneRepository` / `isInBlockedArea` / `InMemoryWorkZoneRepository`**, mancano le tabelle `areas`/`area_vertexes`/`zone_vertexes`/`zone_roles`), **fermati e segnalalo**: non reimplementarli dentro questo sprint, non improvvisare shell, contratti o schema parziali. Produci una nota chiara e attendi indicazioni.

---

## Contesto verificato (confermato via Graphify + lettura codebase)

- monorepo Turborepo + pnpm
- frontend: `apps/web` — Next.js 14 App Router, React, Tailwind, shadcn/ui, TanStack Query, zustand
- backend: `apps/api` — Express + TypeScript
- shared kernel / contratti: `packages/contracts`
- database: SQLite + Drizzle ORM

Stato dominio rilevante (VERIFICATO):

- **Ruolo PA = `UserRole.ADMIN`** (Sprint 20). Utenti demo ADMIN: `u4` → `marco.dipalma@mvp.local`, `u5` → `giuseppe.dicosola@mvp.local` (password `password`).
- **Geometria**: `Coordinates` (`packages/contracts/src/types/index.ts`) = `{ lat: number; lng: number }`. Un geofence cantiere è un **poligono** = lista ordinata di `Coordinates` (≥ 3 vertici). Non esistono ancora poligoni in codice: `FleetZone`/`InMemoryFleetZoneRepository` usano cerchi (`center` + `radiusKm`); le aree poligonali vivono solo a schema (`areas` + `area_vertexes` + `zone_vertexes` + `zone_roles`).
- **Hook enforcement**: `EndRide` (`apps/api/src/slices/EndRide/EndRide.handler.ts`) **è oggi un handler Express `(req, res)`**, non un handler puro. Già esegue un check `zoneValidator.isInParkingZone(...)` → 422 se non valido. Il nuovo blocco cantiere è un check **distinto e aggiuntivo**, basato su `zoneValidator.isInBlockedArea(...)`.
- **Tabelle reali per i poligoni** (Sprint 18): `zone_vertexes` (id, sequence_order, latitude, longitude), `area_vertexes` (junction area↔vertex), `areas` (id, zone_role_id → `zone_roles`), `zone_roles` (type, color, action, ...). Per il cantiere: una riga `zone_roles` con `type = 'cantiere'` e `action = 'block'`, un `areas` che la referenzia, e i vertici del poligono in `zone_vertexes` collegati via `area_vertexes`.

Convenzioni VSA (già in uso, non negoziabili):

- Slice API: `Slice.types.ts` + `Slice.handler.ts` + `Slice.router.ts`. Handler puro `createXHandler(deps)`, router solo HTTP, wiring nel composition root, mount in `app.ts`.
- Adapter concreti (repository/service) in `apps/api/src/adapters`, MAI dentro le slice.
- Slice web: `Slice.types.ts` + `Slice.hook.ts` + `Slice.page.tsx`, route in `apps/web/src/app/<route>/page.tsx`.
- Web e API condividono tipi SOLO via `@mvp/contracts`.

---

## Decisioni MVP già fissate (NON rimetterle in discussione)

Le seguenti scelte sono state decise per questo sprint e non vanno rinegoziate:

1. **Enforcement inline su `EndRide`, senza refactor della slice.**
   - `EndRide.handler.ts` resta un handler Express `(req, res)` come oggi: **non** lo si converte al pattern handler puro in questo sprint.
   - Si aggiunge **solo** il check geofence cantiere (`isInBlockedArea`) dentro l'handler esistente, come secondo controllo distinto dal `isInParkingZone`.
   - Il debito VSA (handler Express invece di puro) resta **TODO dichiarato**, non risolto qui. Motivazione: è una slice rider collaudata; minimizziamo il rischio nello sprint finale.

2. **Persistenza Drizzle reale sulle 4 tabelle.**
   - I geofence cantiere si persistono davvero su `areas` + `area_vertexes` + `zone_vertexes` + `zone_roles` (schema Sprint 18) tramite un nuovo adapter `DrizzleWorkZoneRepository`.
   - Lo stub `InMemoryWorkZoneRepository` (Sprint 20) viene **rimpiazzato** nel wiring dal repository Drizzle (vedi Parte D). Non eliminare il file in-memory se altro codice lo referenzia, ma il composition root deve usare la versione Drizzle.

3. **Disegno del poligono via mappa schematica (click), niente mappe reali.**
   - Coerente con `CLAUDE.md` (niente mappe reali / GeoJSON / librerie geospaziali pesanti) e con la "mappa schematica leggera" già usata lato rider/operatore (Sprint 17): la PA disegna il poligono **cliccando** su una mappa schematica in div/CSS, che aggiunge vertici in ordine. Niente Leaflet/Mapbox/Google Maps.

4. **Scope CRUD minimo: crea + elenca.**
   - In questo sprint la PA può **creare** un nuovo geofence cantiere e **vederne l'elenco**. Nessun update/delete/toggle: coerente con IF19 ("creare aree") e con `IWorkZoneRepository` (`findAll`/`findActive`/`create`). Eventuale gestione (disattiva/elimina cantieri chiusi) resta TODO.

5. **Point-in-polygon leggero, calcolato in-app.**
   - L'appartenenza di un punto a un poligono si calcola con un **algoritmo ray-casting** semplice (nessuna libreria geospaziale). È l'unica "geometria" introdotta e vive nell'adapter validator, non nelle slice.

6. **Auth invariata.** Resta il modello demo client-side (Sprint 17/20). Niente JWT/sessioni server.

---

## Vincoli architetturali non negoziabili

1. Nessun import tra slice. In particolare `WorkZones` **non** importa `RideAnalytics`/`FleetOverview`/`FaultRegistry`/`RemoteBlock` né le slice rider, e `EndRide` non importa `WorkZones`.
2. La nuova slice backend rispetta il pattern `WorkZones.types.ts` / `WorkZones.handler.ts` / `WorkZones.router.ts` (handler puro `createWorkZonesHandler(deps)`).
3. Il router Express fa solo lavoro HTTP (parse → handler → response); l'handler è puro e tipizzato in input/output, senza dipendenze da Express. La validazione del poligono vive nell'handler.
4. Le dipendenze concrete (repository, validator) si risolvono nel composition root; l'handler dipende da `IWorkZoneRepository`, mai dall'implementazione concreta.
5. La nuova slice web rispetta `WorkZones.types.ts` / `WorkZones.hook.ts` / `WorkZones.page.tsx`.
6. Web e API condividono tipi SOLO via `@mvp/contracts` (`WorkZone`, `Coordinates`).
7. Nessun adapter concreto dentro la slice: `DrizzleWorkZoneRepository` e la logica point-in-polygon stanno in `apps/api/src/adapters`.
8. L'enforcement su `EndRide` consuma `IZoneValidator.isInBlockedArea` via `deps`, mai un repository concreto direttamente.
9. Nessuna dipendenza circolare. Usa Graphify all'inizio e alla fine per confermarlo.

---

## PARTE A — Contracts (`packages/contracts`)

Lo scaffolding IF19/IF21 **è già completo dallo Sprint 20** (`WorkZone`, `IWorkZoneRepository`, `isInBlockedArea`). Quindi:

- **Non ridefinire** ciò che già esiste. Verifica solo che `WorkZone` e `IWorkZoneRepository` siano esportati da `packages/contracts/src/index.ts` e che `isInBlockedArea` sia presente in `IZoneValidator`.
- Se serve un tipo input/output di trasporto minimale per la creazione (es. `CreateWorkZoneInput = { name: string; polygon: Coordinates[]; notes?: string }`), **preferisci tenerlo locale alla slice**; aggiungilo a `@mvp/contracts` solo se davvero condiviso tra web e api e non già coperto da `WorkZone`/`Omit<WorkZone, ...>`.
- Se `WorkZone` / `IWorkZoneRepository` / `isInBlockedArea` **non esistono** (Sprint 20 non fatto), **fermati e segnalalo** (vedi premessa): non introdurli qui improvvisando lo Sprint 20.

---

## PARTE B — Backend: slice `WorkZones` (CRUD minimo: crea + elenca)

### B.1 Struttura

Crea `apps/api/src/slices/WorkZones/`:

- `WorkZones.types.ts`:
  - `WorkZonesDeps`: `{ workZoneRepo: IWorkZoneRepository }`.
  - `CreateWorkZoneInput`: `{ name: string; polygon: Coordinates[]; notes?: string }` (locale alla slice).
  - output lista = `WorkZone[]`; output create = `WorkZone` (da `@mvp/contracts`).

### B.2 Handler

`WorkZones.handler.ts`: `createWorkZonesHandler(deps)` che espone due operazioni:

- **`list()`**: ritorna `workZoneRepo.findAll()` (tutti i geofence, attivi e non). Nessuna logica oltre la lettura.
- **`create(input)`**:
  - **valida l'input** (errore di validazione tipizzato → il router lo traduce in 400):
    - `name` non vuoto (trim);
    - `polygon` con **almeno 3 vertici**;
    - ogni vertice con `lat`/`lng` numerici e in range plausibile (`lat ∈ [-90,90]`, `lng ∈ [-180,180]`);
  - chiama `workZoneRepo.create({ name, active: true, polygon, notes })` — un cantiere appena creato è **attivo** di default (dichiaralo);
  - ritorna il `WorkZone` creato.
- L'handler NON istanzia repository concreti: tutto via `deps`. Nessuna persistenza diretta qui (è responsabilità dell'adapter).

### B.3 Router

`WorkZones.router.ts`: `createWorkZonesRouter(deps)`:

- `GET /work-zones` → `list()` → `WorkZone[]`;
- `POST /work-zones` → parse body in `CreateWorkZoneInput` → `create(input)` → `WorkZone` creato (201);
- gestione errori coerente con gli altri router (validazione → 400, errori interni → 500). Nessuna business logic nel router.

### B.4 Adapter concreto — `DrizzleWorkZoneRepository`

Crea `apps/api/src/adapters/db/DrizzleWorkZoneRepository.ts` che implementa `IWorkZoneRepository` persistendo sulle tabelle reali Sprint 18:

- **Mapping dominio → schema** (un `WorkZone` ⇒ una `area` "cantiere"):
  - assicura/ottieni una riga `zone_roles` per i cantieri (`type = 'cantiere'`, `action = 'block'`, eventuale `color` di allerta). Puoi crearne una per ogni area o riusarne una condivisa "cantiere": **scegli la soluzione minima e dichiarala** (consigliato: una `zone_roles` condivisa per tutti i cantieri, creata on-demand se assente);
  - inserisci una riga `areas` con `zone_role_id` del ruolo cantiere;
  - inserisci i vertici del poligono in `zone_vertexes` (con `sequence_order` crescente per preservare l'ordine) e collega ciascuno all'area via `area_vertexes`.
  - **Nome/active/notes/createdAt**: lo schema `areas` reale (Sprint 18) potrebbe non avere colonne per `name`/`active`/`notes`/`createdAt`. Se mancano, **aggiungile in modo minimale allo schema Drizzle** (`apps/api/src/db/schema.ts` + `createTables`) come colonne sulla tabella `areas` (es. `name TEXT`, `active INTEGER`, `notes TEXT`, `created_at TIMESTAMP`), oppure deriva `name` da una convenzione e `active` da un default — **scegli la soluzione minima, mantieni lo schema coerente e dichiarala**. Non introdurre tabelle nuove: usa `areas`/`area_vertexes`/`zone_vertexes`/`zone_roles`.
  - `findAll()`: legge le `areas` con `zone_role` cantiere, ricostruisce il `polygon` ordinando i `zone_vertexes` per `sequence_order`, mappa a `WorkZone`.
  - `findActive()`: come `findAll()` ma filtrando i soli `active`.
  - `create(data)`: esegue gli insert sopra in modo coerente e ritorna il `WorkZone` ricostruito (con `id` e `createdAt`).
- L'adapter NON sta dentro la slice. Niente business logic: solo accesso dati e mapping.

### B.5 Adapter concreto — enforcement `isInBlockedArea` (point-in-polygon)

Rendi **reale** l'enforcement (oggi stub `{ blocked: false }`):

- L'implementazione di `IZoneValidator.isInBlockedArea` deve consultare i geofence cantiere **attivi** e verificare se le coordinate passate cadono dentro uno di essi (ray-casting).
- Soluzione consigliata e minima: **inietta `IWorkZoneRepository` in `MockZoneValidator`** (`apps/api/src/adapters/services/MockZoneValidator.ts`) e implementa `isInBlockedArea(coords)`:
  - `const zones = await workZoneRepo.findActive();`
  - per ogni zona, applica point-in-polygon (ray-casting) sul `polygon`;
  - se il punto è dentro una zona → `{ blocked: true, zoneId: zone.id }`; altrimenti `{ blocked: false }`.
  - Mantieni invariati `isInServiceZone`/`isInParkingZone`.
- La funzione `pointInPolygon(point, polygon)` (ray-casting) vive in un piccolo helper negli adapter (es. `apps/api/src/adapters/services/geo.ts`), NON dentro una slice e NON in `@mvp/contracts`.
- Se preferisci non aggiungere dipendenze a `MockZoneValidator`, è accettabile creare un validator concreto dedicato che implementi `IZoneValidator` con il work zone repo: **scegli una soluzione e dichiarala**. (Preferenza: estendere `MockZoneValidator` con la dipendenza, per non moltiplicare gli adapter.)

### B.6 Wiring + mount

- In `apps/api/src/composition-root.ts`:
  - istanzia `const workZoneRepo = new DrizzleWorkZoneRepository(db);` (sostituisce, nel wiring, lo stub in-memory dello Sprint 20: rimuovi il `void workZoneRepo;` se presente);
  - passa `workZoneRepo` a `MockZoneValidator` (`new MockZoneValidator(workZoneRepo)`), così `EndRide` (che già riceve `zoneValidator`) ottiene l'enforcement reale **senza cambiare le sue deps**;
  - aggiungi `workZonesRouter: createWorkZonesRouter({ workZoneRepo })`.
- In `apps/api/src/app.ts` monta la slice sotto il prefisso PA già attivo: `app.use('/api/admin', root.workZonesRouter)` → endpoint `GET /api/admin/work-zones` e `POST /api/admin/work-zones`. Verifica che i path non collidano con `GET /api/admin/analytics/rides` (Sprint 21): prefisso uguale, path diversi → ok.

### B.7 Seed

- Garantisci almeno **1 geofence cantiere demo** persistito (area Milano Duomo, poligono 3–4 vertici coerente con le coordinate seed esistenti), così la lista PA e l'enforcement sono dimostrabili da subito.
- Inseriscilo in modo **idempotente** nel seed (`apps/api/src/db/seed.ts`), stessa strategia anti-duplicato già usata, sulle tabelle reali. Se lo Sprint 20 seedava il cantiere solo in-memory, **spostane l'equivalente nel seed Drizzle**. Dichiara nel report cosa hai seedato.

---

## PARTE C — Backend: enforcement IF21 su `EndRide` (inline)

In `apps/api/src/slices/EndRide/EndRide.handler.ts`, aggiungi il check cantiere **senza refactor** dell'handler:

- Subito **dopo** aver verificato che la corsa esista/sia attiva e **prima** (o accanto) al check `isInParkingZone`, aggiungi:
  - `const { blocked, zoneId } = await deps.zoneValidator.isInBlockedArea({ lat: endLat, lng: endLng });`
  - se `blocked` → rispondi con errore chiaro e distinto dal parking: status **422** con messaggio tipo `"Impossibile concludere il noleggio: ti trovi in un'area cantiere. Sposta il veicolo fuori dall'area segnalata."` (includi opzionalmente `zoneId`). **Non** concludere la corsa, **non** cambiare lo stato del veicolo.
- Il check cantiere è un divieto assoluto: se sei dentro un cantiere il noleggio non si chiude, indipendentemente dal parking. Tieni i due messaggi/errori distinti (cantiere ≠ "parcheggio non valido") per chiarezza UX.
- Non toccare il resto della logica `EndRide` (billing, `end`, `updateStatus`, `updateLocation`).
- `EndRide.types.ts` (deps) **non cambia**: `zoneValidator: IZoneValidator` già c'è; `isInBlockedArea` fa parte dell'interfaccia. Nessuna nuova dipendenza da iniettare.

> Nota debito tecnico (NON risolvere qui): `EndRide.handler.ts` resta un handler Express invece di un handler puro. È una scelta dichiarata di questo sprint (vedi Decisioni MVP §1). Lascialo come TODO esplicito.

---

## PARTE D — Frontend: slice `WorkZones` (UI PA crea + elenca)

Crea `apps/web/src/slices/WorkZones/`:

- `WorkZones.types.ts`: tipi locali (poligono in costruzione = `Coordinates[]`, stato del form: nome/note, vertici correnti). Riusa `WorkZone`, `Coordinates` da `@mvp/contracts`.
- `WorkZones.hook.ts`:
  - query TanStack verso `GET /api/admin/work-zones` (riusa `apiFetch`) → lista `WorkZone[]` (`data`, `isLoading`, `error`);
  - mutation TanStack verso `POST /api/admin/work-zones` per creare un geofence; on success **invalida** la query lista. Espone `createWorkZone(input)`, `isPending`, `error`.
- `WorkZones.page.tsx`: pagina IF19/IF21 **dentro `AdminLayout`** (desktop-first). Deve contenere:
  - **Intestazione**: "Aree cantiere (Geofence)" / "Segnala cantieri stradali e blocca la riconsegna al loro interno".
  - **Mappa schematica per disegnare il poligono** (div/CSS, niente librerie/mappe reali, coerente con la mappa schematica leggera dello Sprint 17): l'utente **clicca** per aggiungere vertici in ordine; mostra i vertici e il poligono in costruzione (linee/area riempita via CSS/SVG inline è accettabile, purché senza librerie esterne). Azioni: "Annulla ultimo vertice", "Pulisci". Richiede ≥ 3 vertici per salvare. Gestire la conversione click→coordinate in modo coerente con come la mappa schematica esistente mappa coordinate↔pixel (riusa l'helper se esiste; altrimenti definiscine uno locale alla slice, senza importare altre slice).
  - **Form di creazione**: campo nome (obbligatorio), note (opzionale), riepilogo numero vertici; bottone "Crea cantiere" (disabilitato finché nome valido + ≥ 3 vertici). Dopo il successo: reset del form/poligono e refresh lista.
  - **Elenco cantieri esistenti**: lista/card dei `WorkZone` con nome, stato attivo, numero vertici, eventuali note, data creazione. Mostra anche i geofence sulla mappa schematica (sovrapposti) se ragionevole, altrimenti basta la lista.
  - **Stati UI**: loading (skeleton), error (con retry) per la lista; pending/disabled + errori di validazione (400) per la creazione; empty (nessun cantiere: messaggio curato, non un crash).
  - Coerenza stilistica con la sezione PA (Card/Badge/Button shadcn) e con i colori di allerta già usati (es. `BLOCKED`). Degrada in modo decente su viewport stretti.
- Route: `apps/web/src/app/admin/cantieri/page.tsx` (o lo slug PA già fissato dallo Sprint 20 per questa funzione, es. `aree-cantiere`) che monta `WorkZones.page.tsx` dentro `AdminLayout`. Scegli lo slug coerente con il naming PA italiano e usalo uniformemente.
- **Attiva la voce di nav "Aree cantiere (Geofence)"** nella shell PA: da segnaposto disabilitato a link reale verso la nuova rotta. Ora entrambe le voci PA (Analisi corse, Aree cantiere) sono attive.

---

## Verifica finale

- `pnpm typecheck` pulito su web e api (attenzione: l'iniezione di `IWorkZoneRepository` in `MockZoneValidator` e l'uso reale di `isInBlockedArea` non devono lasciare implementazioni incomplete).
- `pnpm build` (o build mirate) senza errori.
- Smoke test manuale:
  - login con `marco.dipalma@mvp.local` / `password` → redirect a `/admin`;
  - dalla shell PA apri "Aree cantiere" → vedi il cantiere demo seedato in elenco;
  - disegna un nuovo poligono cliccando sulla mappa schematica (≥ 3 vertici), dai un nome, "Crea cantiere" → compare in elenco; ricaricando resta (persistenza Drizzle reale);
  - come rider, avvia/termina una corsa **fuori** da ogni cantiere → `EndRide` funziona come prima;
  - prova a concludere una corsa con coordinate **dentro** un cantiere attivo → `EndRide` risponde **422** con messaggio cantiere chiaro, la corsa NON si chiude e il veicolo NON cambia stato;
  - `GET /api/admin/work-zones` ritorna i geofence; `POST /api/admin/work-zones` con poligono < 3 vertici o nome vuoto → 400 chiaro;
  - utente non ADMIN che apre `/admin/cantieri` → redirect a `/` (guard Sprint 20 invariato);
  - i flussi rider/operatore e IF18 (Analisi corse) restano invariati.
- Usa Graphify a fine lavoro per confermare:
  - zero import cross-slice (inclusa la nuova slice `WorkZones`; `EndRide` non importa `WorkZones`);
  - `WorkZones` dipende da `@mvp/contracts` (`IWorkZoneRepository`, `WorkZone`, `Coordinates`), non da implementazioni concrete;
  - `DrizzleWorkZoneRepository` e l'helper point-in-polygon sono fuori dalle slice;
  - l'enforcement `EndRide` consuma `IZoneValidator.isInBlockedArea` via deps;
  - nessun ciclo introdotto.

---

## Dati / demo

- Utenti PA demo: `marco.dipalma@mvp.local`, `giuseppe.dicosola@mvp.local` — password `password` (ADMIN).
- Almeno 1 geofence cantiere demo persistito (area Milano Duomo), `active: true`, per dimostrare elenco + enforcement.
- Veicoli/corse seed esistenti nell'area Duomo: sufficienti per provare una conclusione corsa dentro/fuori cantiere.

---

## Output finale richiesto

1. decisione architetturale presa e motivazione (slice `WorkZones` API + web; persistenza Drizzle reale su `areas`/`area_vertexes`/`zone_vertexes`/`zone_roles`; enforcement inline su `EndRide` via `isInBlockedArea`; point-in-polygon negli adapter; disegno poligono su mappa schematica);
2. elenco file creati/modificati;
3. sintesi delle scelte implementative (mapping `WorkZone` → schema reale, eventuali colonne aggiunte ad `areas`; ricostruzione poligono via `sequence_order`; iniezione `workZoneRepo` in `MockZoneValidator`; check cantiere distinto dal parking in `EndRide`; UI click-to-draw senza mappe reali);
4. assunzioni fatte (cantiere creato = `active: true`; `zone_roles` condivisa "cantiere"/`action='block'` vs per-area; colonne `name`/`active`/`notes`/`created_at` su `areas` o convenzione equivalente; status 422 per il blocco cantiere; slug rotta PA);
5. check architetturale finale basato su Graphify;
6. **TODO residui** (MVP completato; questi restano aperti come evoluzioni):
   - **allineamento di `EndRide.handler.ts` al pattern handler puro** (oggi è un handler Express — debito dichiarato e rimandato);
   - gestione geofence avanzata (disattiva/elimina cantieri chiusi → estendere `IWorkZoneRepository` con update/delete);
   - validità temporale dei cantieri (date inizio/fine), sovrapposizione poligoni, vincoli geometrici (poligoni semplici/non auto-intersecanti);
   - eventuale segnalazione del cantiere anche lato rider (avviso in mappa/durante la corsa) e/o blocco di altre azioni oltre `EndRide`;
   - migrazione del cantiere demo da seed a gestione interamente PA.

---

## Importante — non fare

- non rifattorizzare `EndRide.handler.ts` al pattern handler puro: in questo sprint l'enforcement è **inline** (resta TODO dichiarato);
- non introdurre mappe reali / GeoJSON / librerie geospaziali: il disegno è su mappa schematica in div/CSS e il point-in-polygon è ray-casting fatto in casa;
- non aggiungere update/delete/toggle al CRUD geofence: scope = crea + elenca;
- non mettere la logica point-in-polygon né l'adapter `DrizzleWorkZoneRepository` dentro le slice;
- non far dipendere `EndRide` da un repository concreto: l'enforcement passa per `IZoneValidator.isInBlockedArea` via deps;
- non introdurre import tra slice; non mettere business logic nel router né far istanziare repository all'handler;
- non introdurre un nuovo ruolo: la PA è `UserRole.ADMIN`;
- non riusare `OperatorLayout` né far comparire la `BottomNav` rider nella sezione PA: usa `AdminLayout`;
- non introdurre nuove tabelle per i geofence: usa `areas`/`area_vertexes`/`zone_vertexes`/`zone_roles`;
- non introdurre auth reale (JWT, sessioni server): resta nel modello demo client-side;
- non reimplementare Sprint 17/18/19/20/21: se mancano i prerequisiti (shell PA, guard ADMIN, `WorkZone`/`IWorkZoneRepository`/`isInBlockedArea`, tabelle poligoni), **fermati e segnalalo**;
- se trovi un'ambiguità bloccante, fermati e produci domande precise invece di improvvisare.
