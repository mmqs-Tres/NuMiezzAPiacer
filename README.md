# Vehicle Sharing MVP

Mobile-first vehicle sharing app. Vertical Slice Architecture in a Turborepo monorepo.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + React + Tailwind + shadcn/ui |
| State server | TanStack Query |
| State client | Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via Drizzle ORM |
| Shared types | `@mvp/contracts` |
| Monorepo | Turborepo + pnpm workspaces |

## 🚀 Quick Start (Docker) - Consigliato

Il modo più semplice per avviare il progetto in un ambiente pulito e sempre funzionante è utilizzare **Docker**. L'ambiente si occuperà di installare le dipendenze, compilare il codice, resettare e popolare il database e avviare l'app.

1. **Clona il repository:**
   ```bash
   git clone https://github.com/fdemusso/nu-miezz-a-piacer.git
   ```
2. **Entra nella cartella del progetto:**
   ```bash
   cd nu-miezz-a-piacer
   ```
3. **Avvia tutto con Docker Compose:**
   ```bash
   docker compose up --build
   ```

Una volta terminato l'avvio, avrai:
- **Web App (Frontend):** http://localhost:3000
- **API (Backend):** http://localhost:3001

---

## Repo structure

```
mvp/
├── apps/
│   ├── web/              # Next.js frontend (port 3000)
│   │   └── src/
│   │       ├── app/          # Next.js App Router
│   │       ├── slices/       # One folder per VSA slice
│   │       ├── components/
│   │       │   ├── ui/       # shadcn components
│   │       │   └── layout/   # AppLayout, Header, BottomNav
│   │       ├── lib/          # utils, api client, query-client
│   │       └── providers/    # AppProviders (QueryClient)
│   └── api/              # Express backend (port 3001)
│       └── src/
│           ├── slices/       # One folder per VSA slice
│           ├── adapters/     # Concrete repo/service implementations
│           ├── db/           # Drizzle schema + bootstrap + seed
│           ├── shared/       # Middleware, error handler
│           ├── composition-root.ts  # Wires adapters → slices
│           ├── app.ts        # Express app factory
│           └── server.ts     # Entry point
└── packages/
    ├── contracts/        # Enums, types, repository/service interfaces
    └── config/           # Shared constants, env helpers
```

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js**: Version 18.x or higher is recommended.
- **pnpm**: The package manager used for this monorepo. If you don't have it, install it globally:
  ```bash
  npm install -g pnpm
  ```

## Environment Configuration

Sensible default configurations are built into the app, meaning it works out of the box without manual environment configuration. 

However, if you need to override any defaults (e.g., changing ports or DB location), you can configure them:

### Backend Configuration (`apps/api`)
Copy `apps/api/.env.example` to `apps/api/.env`:
```bash
cp apps/api/.env.example apps/api/.env
```
Key variables:
- `PORT`: The port on which the Express API server runs (default: `3001`).
- `DATABASE_URL`: Path to the SQLite database file (default: `./data/mvp.db`).
- `NODE_ENV`: Application environment (`development`, `production`, `test`).

### Frontend Configuration (`apps/web`)
If you change the backend port, configure the frontend to point to the correct URL by creating a `.env.local` file under `apps/web`:
```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```
Key variables:
- `NEXT_PUBLIC_API_URL`: The URL of the API backend (default: `http://localhost:3001`).

## Getting Started

Follow these steps to set up and run the project locally:

### 1. Install Dependencies
Install all package dependencies from the root directory:
```bash
pnpm install
```

### 2. Start the Development Environment
Run the Turborepo development script to start all apps in watch mode:
```bash
pnpm dev
```

Once started, the following services will be available:
- **Frontend (Web)**: [http://localhost:3000](http://localhost:3000)
- **API Backend**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

> [!NOTE]
> **Automatic Database Setup:** You do not need to run manual database migrations or seeding. On the first API startup, the SQLite database is automatically created, the tables are migrated using Drizzle ORM, and the seed data is populated.

## Demo Accounts

You can log in to the application using any of the following demo accounts. The password for all accounts is `password`.

| Email | Role |
|---|---|
| `demo@mvp.local` | RIDER |
| `flavio.demusso@mvp.local` | OPERATOR |
| `gabriele.farigu@mvp.local` | OPERATOR |
| `marco.dipalma@mvp.local` | ADMIN |
| `giuseppe.dicosola@mvp.local` | ADMIN |

## Database Management

If you make modifications to the Drizzle schema (`apps/api/src/db/schema.ts`), you can manage migrations using the following commands:

- **Generate Migrations**:
  ```bash
  cd apps/api && pnpm drizzle-kit generate
  ```
- **Push Schema Changes Direct to DB (during prototyping)**:
  ```bash
  cd apps/api && pnpm drizzle-kit push
  ```

## Additional Monorepo Commands

These commands can be run from the root directory using Turborepo:

- **Build**: Compiles all packages and Next.js/Express apps.
  ```bash
  pnpm build
  ```
- **Lint**: Lints the codebase for code style and errors.
  ```bash
  pnpm lint
  ```
- **Typecheck**: Validates TypeScript types across the entire project.
  ```bash
  pnpm typecheck
  ```
- **Format**: Formats all files using Prettier.
  ```bash
  pnpm format
  ```

## Test NearbyVehicles

```bash
# Start API only
cd apps/api && pnpm dev

# Query nearby vehicles (demo coords: Milan Duomo)
curl "http://localhost:3001/api/vehicles/nearby?lat=45.4654&lng=9.1859&radiusKm=2"
```

Response shape:
```json
{
  "userPosition": { "lat": 45.4654, "lng": 9.1859 },
  "radiusKm": 2,
  "vehicles": [
    {
      "id": "v1",
      "plateOrCode": "EL-001",
      "type": "SCOOTER",
      "status": "AVAILABLE",
      "batteryLevel": 85,
      "distanceMeters": 184,
      "estimatedWalkMinutes": 3,
      "currentPosition": { "lat": 45.467, "lng": 9.1865 }
    }
  ]
}
```

**Frontend geolocation:** the web app tries `navigator.geolocation`. If denied or unavailable, it falls back silently to Milan Duomo coordinates and shows a small banner.

## VSA conventions

Each slice is self-contained. No cross-slice imports.

**Frontend slice** (`apps/web/src/slices/<SliceName>/`):
- `<Slice>.page.tsx` — React component (route entry point)
- `<Slice>.hook.ts` — data-fetching / mutation logic (TanStack Query)
- `<Slice>.types.ts` — local types, can re-export from `@mvp/contracts`

**Backend slice** (`apps/api/src/slices/<SliceName>/`):
- `<Slice>.router.ts` — Express Router, declares routes
- `<Slice>.handler.ts` — request handler, returns factory that accepts deps
- `<Slice>.types.ts` — request/response types + deps interface

**Rules:**
- Slices depend only on `@mvp/contracts`, never on each other
- Concrete adapters live in `apps/api/src/adapters/`
- Dependency injection happens only in `composition-root.ts`

## Implemented slices

| Slice | Status | Frontend | API |
|---|---|---|---|
| NearbyVehicles | ✅ Done | `GET /` | `GET /api/vehicles/nearby` |
| VehicleDetails | ✅ Done | `GET /vehicles/[id]` | `GET /api/vehicles/:vehicleId` |
| BookVehicle | ✅ Done | `GET /vehicles/[id]/book` | `POST /api/bookings` |
| UnlockVehicle | ✅ Done | `GET /vehicles/[id]/unlock` | `POST /api/rides/unlock` |
| EndRide | ✅ Done | `GET /rides/end` | `POST /api/rides/:rideId/end` |

## Test VehicleDetails

```bash
# Start all apps
pnpm dev

# Test API directly
curl http://localhost:3001/api/vehicles/v1
curl http://localhost:3001/api/vehicles/v8
curl http://localhost:3001/api/vehicles/nonexistent  # → 404

# Frontend flow
# 1. Open http://localhost:3000
# 2. Click "Vedi dettagli" on any available vehicle card
# 3. Lands on http://localhost:3000/vehicles/v1 (or v2, v4, v6, v8)
```

Response shape:
```json
{
  "vehicle": {
    "id": "v1",
    "type": "SCOOTER",
    "status": "AVAILABLE",
    "model": "Niu N1S",
    "licensePlate": "EL-001",
    "battery": { "level": 85, "estimatedRangeKm": 51 },
    "specs": { "maxSpeedKmh": 45, "weightKg": 28, "maxRangeKm": 60 },
    "features": { "hasGps": true, "hasHelmetStorage": false, "hasUsb": false, "hasLock": true },
    "pricing": {
      "unlockFee": { "amount": 1, "currency": "EUR" },
      "perMinuteRate": { "amount": 0.25, "currency": "EUR" }
    },
    "location": { "lat": 45.467, "lng": 9.1865 }
  }
}
```

## Test BookVehicle

```bash
# Start all apps
pnpm dev

# Test API directly (demo user u1, vehicle v1)
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","vehicleId":"v1"}'

# → 201 { booking: { id, userId, vehicleId, status: "CONFIRMED", expiresAt, ... } }

# Error cases:
# vehicle not found       → 404 { error: "Vehicle not found" }  [if vehicleId invalid]
# vehicle not available   → 409 { error: "Vehicle not available" }
# user has active booking → 409 { error: "User already has an active booking" }
# missing fields          → 400 { error: "userId and vehicleId are required" }
```

**Frontend flow:**
1. Open http://localhost:3000
2. Click "Vedi dettagli" on any AVAILABLE vehicle card
3. Click "Prenota" (sticky CTA) → navigates to `/vehicles/[id]/book`
4. Review vehicle summary + pricing
5. Click "Conferma prenotazione"
6. See booking confirmation with ID, expiry time, next-step hint

**What happens on booking:**
- Vehicle status → `RESERVED` in DB
- Booking created with `status: CONFIRMED`, expiry = now + 10 min
- Demo user `u1` (demo@mvp.local) used as requester (no auth in MVP)
- `setActiveBooking` called in Zustand store for future slices

## Test UnlockVehicle

```bash
# Start all apps
pnpm dev

# 1. Book a vehicle (get bookingId from response)
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","vehicleId":"v1"}'
# → { booking: { id: "<bookingId>", status: "CONFIRMED", ... } }

# 2. Unlock vehicle (use bookingId from step 1)
curl -X POST http://localhost:3001/api/rides/unlock \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","bookingId":"<bookingId>","startLat":45.4654,"startLng":9.1859}'
# → 201 { ride: { id, userId, vehicleId, status: "ACTIVE", startedAt, startLocation }, unlockCode: "MOCK-UNLOCK-001" }
```

**Frontend flow:**
1. Open http://localhost:3000
2. Click any AVAILABLE vehicle → `VehicleDetails`
3. Click "Prenota" → `BookVehicle` page
4. Click "Conferma prenotazione" → booking confirmed
5. Click **"Vai allo sblocco →"** → `/vehicles/[id]/unlock?bookingId=...`
6. Review booking summary + mock unlock method (QR / Mock)
7. Click **"Sblocca & Avvia corsa"**
8. See ride confirmation: ID, start time, position, status badge "In corso"

**What happens on unlock:**
- Booking validated: must be `CONFIRMED` and belong to demo user `u1`
- Zone check via `MockZoneValidator` (always passes)
- `Ride` created in DB with `status: ACTIVE`, `startedAt: now`
- `MockUnlockService.unlock()` called → returns `{ success: true, unlockCode: "MOCK-UNLOCK-001" }`
- Booking status → `ACTIVE`
- Vehicle status → `IN_USE`

**MVP assumptions:**
- Demo user hardcoded: `u1`
- Start coordinates: hardcoded Milan Duomo (`45.4654, 9.1859`) — no real GPS
- Unlock method: mock/QR label shown in UI, no real BLE/QR scanning
- `MockUnlockService` always returns success

## Test EndRide

```bash
# Start all apps
pnpm dev

# 1. Book a vehicle
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","vehicleId":"v1"}'
# → { booking: { id: "<bookingId>", ... } }

# 2. Unlock (get rideId from response)
curl -X POST http://localhost:3001/api/rides/unlock \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","bookingId":"<bookingId>","startLat":45.4654,"startLng":9.1859}'
# → { ride: { id: "<rideId>", status: "ACTIVE", ... } }

# 3. End ride
curl -X POST http://localhost:3001/api/rides/<rideId>/end \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","endLat":45.4661,"endLng":9.1872,"distanceKm":2.3}'
# → { ride: { id, status: "ENDED", endedAt, endLocation, distanceKm, durationMinutes, totalCost }, totalCost: { amount, currency } }
```

**Frontend flow:**
1. Open http://localhost:3000
2. Click any AVAILABLE vehicle → `VehicleDetails`
3. Click "Prenota" → `BookVehicle`
4. Click "Conferma prenotazione"
5. Click "Vai allo sblocco →" → `UnlockVehicle`
6. Click "Sblocca & Avvia corsa" → ride started, `activeRide` saved in Zustand
7. Click **"Termina corsa"** → `/rides/end`
8. Review active ride info (start time, ID, status badge)
9. Click **"Termina corsa"** → calls `POST /api/rides/:rideId/end`
10. See summary: duration, distance, total cost, parking badge, vehicle status

**What happens on end ride:**
- Handler fetches ride by ID, verifies `userId` and `status: ACTIVE`
- `MockZoneValidator.isInParkingZone()` called → always returns `{ valid: true, zoneId: "zone-1" }`
- `MockBillingService.calculateRideCost()` → `unlockFee + minutes × perMinuteRate`
- Ride updated in DB: `status: ENDED`, `endedAt`, `endLocation`, `distanceKm`, `durationMinutes`, `totalCost`
- Vehicle status → `AVAILABLE`, location updated to end coords
- Zustand `clearSession()` called on success

**MVP assumptions:**
- Demo user: `u1` (hardcoded)
- End coordinates: mock Milan coords (`45.4661, 9.1872`) — no real GPS
- Distance: hardcoded `2.3 km` (demo value)
- Parking validation: mock, always valid
- Billing: `unlockFee (1 EUR) + minutes × 0.25 EUR/min`
- No real billing, notifications, or incentives

**Known limits:**
- No real GPS end position
- No geofencing or zone enforcement (mock always passes)
- Billing is simplified (time-based only, no pause/km split)
- No push notification to user
