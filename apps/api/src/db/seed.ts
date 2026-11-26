import { VehicleType, VehicleStatus, UserRole, RideStatus, FaultCategory, FaultSeverity } from '@mvp/contracts';
import type { Db } from './index';
import { vehicles, users, vehicleConditionRepo, rides, zoneRoles, areas, zoneVertexes, areaVertexes } from './schema';
import { eq, and } from 'drizzle-orm';

const DEMO_VEHICLES = [
  {
    id: 'v1',
    type: VehicleType.SCOOTER,
    status: VehicleStatus.AVAILABLE,
    lat: 45.467,
    lng: 9.1865,
    batteryLevel: 85,
    batteryRangeKm: 51,
    model: 'Niu N1S',
    licensePlate: 'EL-001',
    specsJson: JSON.stringify({ maxSpeedKmh: 45, weightKg: 28, maxRangeKm: 60 }),
    featuresJson: JSON.stringify({ hasGps: true, hasHelmetStorage: false, hasUsb: false, hasLock: true }),
    pricingJson: JSON.stringify({ unlockFee: { amount: 1, currency: 'EUR' }, perMinuteRate: { amount: 0.25, currency: 'EUR' } }),
  },
  {
    id: 'v2',
    type: VehicleType.BIKE,
    status: VehicleStatus.AVAILABLE,
    lat: 45.4638,
    lng: 9.1872,
    batteryLevel: 100,
    batteryRangeKm: 60,
    model: 'Trek FX3',
    licensePlate: null,
    specsJson: JSON.stringify({ maxSpeedKmh: 30, weightKg: 12, maxRangeKm: 60 }),
    featuresJson: JSON.stringify({ hasGps: true, hasHelmetStorage: false, hasUsb: false, hasLock: true }),
    pricingJson: JSON.stringify({ unlockFee: { amount: 0.5, currency: 'EUR' }, perMinuteRate: { amount: 0.15, currency: 'EUR' } }),
  },
  {
    id: 'v3',
    type: VehicleType.SCOOTER,
    status: VehicleStatus.AVAILABLE,
    lat: 45.4665,
    lng: 9.1835,
    batteryLevel: 62,
    batteryRangeKm: 37,
    model: 'Niu N1S',
    licensePlate: 'EL-003',
    specsJson: JSON.stringify({ maxSpeedKmh: 45, weightKg: 28, maxRangeKm: 60 }),
    featuresJson: JSON.stringify({ hasGps: true, hasHelmetStorage: false, hasUsb: false, hasLock: true }),
    pricingJson: JSON.stringify({ unlockFee: { amount: 1, currency: 'EUR' }, perMinuteRate: { amount: 0.25, currency: 'EUR' } }),
  },
  {
    id: 'v4',
    type: VehicleType.MOPED,
    status: VehicleStatus.AVAILABLE,
    lat: 45.4628,
    lng: 9.1895,
    batteryLevel: 78,
    batteryRangeKm: 58,
    model: 'Honda PCX',
    licensePlate: 'EL-004',
    specsJson: JSON.stringify({ maxSpeedKmh: 60, weightKg: 130, maxRangeKm: 75 }),
    featuresJson: JSON.stringify({ hasGps: true, hasHelmetStorage: true, hasUsb: true, hasLock: true }),
    pricingJson: JSON.stringify({ unlockFee: { amount: 1.5, currency: 'EUR' }, perMinuteRate: { amount: 0.3, currency: 'EUR' } }),
  },
  {
    id: 'v5',
    type: VehicleType.SCOOTER,
    status: VehicleStatus.IN_USE,
    lat: 45.468,
    lng: 9.182,
    batteryLevel: 45,
    batteryRangeKm: 27,
    model: 'Niu N1S',
    licensePlate: 'EL-005',
    specsJson: JSON.stringify({ maxSpeedKmh: 45, weightKg: 28, maxRangeKm: 60 }),
    featuresJson: JSON.stringify({ hasGps: true, hasHelmetStorage: false, hasUsb: false, hasLock: true }),
    pricingJson: JSON.stringify({ unlockFee: { amount: 1, currency: 'EUR' }, perMinuteRate: { amount: 0.25, currency: 'EUR' } }),
  },
  {
    id: 'v6',
    type: VehicleType.BIKE,
    status: VehicleStatus.AVAILABLE,
    lat: 45.47,
    lng: 9.186,
    batteryLevel: 100,
    batteryRangeKm: 60,
    model: 'Trek FX3',
    licensePlate: null,
    specsJson: JSON.stringify({ maxSpeedKmh: 30, weightKg: 12, maxRangeKm: 60 }),
    featuresJson: JSON.stringify({ hasGps: true, hasHelmetStorage: false, hasUsb: false, hasLock: true }),
    pricingJson: JSON.stringify({ unlockFee: { amount: 0.5, currency: 'EUR' }, perMinuteRate: { amount: 0.15, currency: 'EUR' } }),
  },
  {
    id: 'v7',
    type: VehicleType.SCOOTER,
    status: VehicleStatus.MAINTENANCE,
    lat: 45.461,
    lng: 9.1845,
    batteryLevel: 10,
    batteryRangeKm: 6,
    model: 'Niu N1S',
    licensePlate: 'EL-007',
    specsJson: JSON.stringify({ maxSpeedKmh: 45, weightKg: 28, maxRangeKm: 60 }),
    featuresJson: JSON.stringify({ hasGps: true, hasHelmetStorage: false, hasUsb: false, hasLock: true }),
    pricingJson: JSON.stringify({ unlockFee: { amount: 1, currency: 'EUR' }, perMinuteRate: { amount: 0.25, currency: 'EUR' } }),
  },
  {
    id: 'v8',
    type: VehicleType.CAR,
    status: VehicleStatus.AVAILABLE,
    lat: 45.4715,
    lng: 9.187,
    batteryLevel: 88,
    batteryRangeKm: 211,
    model: 'Fiat 500e',
    licensePlate: 'EL-008',
    specsJson: JSON.stringify({ maxSpeedKmh: 150, weightKg: 1360, maxRangeKm: 240 }),
    featuresJson: JSON.stringify({ hasGps: true, hasHelmetStorage: false, hasUsb: true, hasLock: true }),
    pricingJson: JSON.stringify({ unlockFee: { amount: 2, currency: 'EUR' }, perMinuteRate: { amount: 0.5, currency: 'EUR' } }),
  },
];

const DEMO_USERS = [
  {
    id: 'u1',
    email: 'demo@mvp.local',
    role: UserRole.RIDER,
    createdAt: new Date(),
    firstName: 'Demo',
    lastName: 'User',
    city: 'Milano',
    arcBorn: new Date('1990-01-01'),
  },
  {
    id: 'u2',
    email: 'flavio.demusso@mvp.local',
    role: UserRole.OPERATOR,
    createdAt: new Date(),
    firstName: 'Flavio',
    lastName: 'Demusso',
    city: 'Milano',
    arcBorn: new Date('1985-05-15'),
  },
  {
    id: 'u3',
    email: 'gabriele.farigu@mvp.local',
    role: UserRole.OPERATOR,
    createdAt: new Date(),
    firstName: 'Gabriele',
    lastName: 'Farigu',
    city: 'Roma',
    arcBorn: new Date('1988-10-20'),
  },
  {
    id: 'u4',
    email: 'marco.dipalma@mvp.local',
    role: UserRole.ADMIN,
    createdAt: new Date(),
    firstName: 'Marco',
    lastName: 'Di Palma',
    city: 'Napoli',
    arcBorn: new Date('1982-12-05'),
  },
  {
    id: 'u5',
    email: 'giuseppe.dicosola@mvp.local',
    role: UserRole.ADMIN,
    createdAt: new Date(),
    firstName: 'Giuseppe',
    lastName: 'Dicosola',
    city: 'Bari',
    arcBorn: new Date('1992-07-30'),
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// Corse seed distribuite su più giorni e tipi veicolo (per la futura analytics IF18).
const DEMO_RIDES = [
  // vehicleId determina il VehicleType: v1/v3 SCOOTER, v2/v6 BIKE, v4 MOPED, v8 CAR
  { id: 'ride-seed-1', vehicleId: 'v1', daysAgo: 0 },
  { id: 'ride-seed-2', vehicleId: 'v2', daysAgo: 0 },
  { id: 'ride-seed-3', vehicleId: 'v4', daysAgo: 0 },
  { id: 'ride-seed-4', vehicleId: 'v3', daysAgo: 1 },
  { id: 'ride-seed-5', vehicleId: 'v6', daysAgo: 1 },
  { id: 'ride-seed-6', vehicleId: 'v8', daysAgo: 1 },
  { id: 'ride-seed-7', vehicleId: 'v1', daysAgo: 2 },
  { id: 'ride-seed-8', vehicleId: 'v4', daysAgo: 2 },
  { id: 'ride-seed-9', vehicleId: 'v2', daysAgo: 3 },
  { id: 'ride-seed-10', vehicleId: 'v3', daysAgo: 3 },
  { id: 'ride-seed-11', vehicleId: 'v8', daysAgo: 4 },
  { id: 'ride-seed-12', vehicleId: 'v6', daysAgo: 4 },
];

const DEMO_FAULT_REPORTS = [
  {
    vehicleId: 'v1',
    reportedAt: new Date(Date.now() - 1 * DAY_MS),
    category: FaultCategory.BATTERY,
    severity: FaultSeverity.MEDIUM,
    notes: 'La batteria si scarica più velocemente del solito, possibile usura.',
    images: JSON.stringify([]),
  },
  {
    vehicleId: 'v3',
    reportedAt: new Date(Date.now() - 2 * DAY_MS),
    category: FaultCategory.TIRE,
    severity: FaultSeverity.HIGH,
    notes: 'Pneumatico posteriore visibilmente usurato, rischio foratura.',
    images: JSON.stringify(['/placeholder-damage.jpg']),
  },
  {
    vehicleId: 'v5',
    reportedAt: new Date(Date.now() - 3 * DAY_MS),
    category: FaultCategory.BRAKES,
    severity: FaultSeverity.CRITICAL,
    notes: 'Freno anteriore poco reattivo, segnalato da più utenti.',
    images: JSON.stringify(['/placeholder-damage.jpg', '/placeholder-damage.jpg']),
  },
  {
    vehicleId: 'v7',
    reportedAt: new Date(Date.now() - 10 * DAY_MS),
    category: FaultCategory.ELECTRICAL,
    severity: FaultSeverity.HIGH,
    notes: 'Display non si accende correttamente, possibile problema di alimentazione.',
    images: JSON.stringify([]),
  },
  {
    vehicleId: 'v4',
    reportedAt: new Date(Date.now() - 5 * DAY_MS),
    category: FaultCategory.MECHANICAL,
    severity: FaultSeverity.LOW,
    notes: 'Leggero rumore dal vano motore in fase di accelerazione.',
    images: JSON.stringify([]),
  },
  {
    vehicleId: 'v8',
    reportedAt: new Date(Date.now() - 7 * DAY_MS),
    category: FaultCategory.BODY,
    severity: FaultSeverity.LOW,
    notes: 'Piccolo graffio sulla portiera lato passeggero.',
    images: JSON.stringify([]),
  },
  {
    vehicleId: 'v2',
    reportedAt: new Date(Date.now() - 15 * DAY_MS),
    category: FaultCategory.OTHER,
    severity: FaultSeverity.MEDIUM,
    notes: 'Sella leggermente danneggiata, da verificare in officina.',
    images: JSON.stringify([]),
  },
  {
    vehicleId: 'v6',
    reportedAt: new Date(Date.now() - 20 * DAY_MS),
    category: FaultCategory.MECHANICAL,
    severity: FaultSeverity.MEDIUM,
    notes: 'Cambio marce duro, richiede regolazione.',
    images: JSON.stringify([]),
  },
];

export async function seedDemoData(db: Db): Promise<void> {
  const existing = await db.select({ id: vehicles.id }).from(vehicles).limit(1);

  if (existing.length === 0) {
    for (const v of DEMO_VEHICLES) {
      await db.insert(vehicles).values(v).onConflictDoNothing();
    }

    for (const u of DEMO_USERS) {
      await db.insert(users).values(u).onConflictDoNothing();
    }

    for (const r of DEMO_FAULT_REPORTS) {
      await db.insert(vehicleConditionRepo).values(r).onConflictDoNothing();
    }

    console.log('[seed] Demo data inserted');
  }

  // Corse seed indipendenti dal resto: garantiscono dati multi-giorno/multi-tipo per IF18.
  const existingRides = await db.select({ id: rides.id }).from(rides).limit(1);
  if (existingRides.length === 0) {
    for (const r of DEMO_RIDES) {
      const startedAt = new Date(Date.now() - r.daysAgo * DAY_MS - 60 * 60 * 1000);
      const endedAt = new Date(startedAt.getTime() + 20 * 60 * 1000);
      await db
        .insert(rides)
        .values({
          id: r.id,
          userId: 'u1',
          vehicleId: r.vehicleId,
          bookingId: null,
          status: RideStatus.ENDED,
          startedAt,
          endedAt,
          startLat: 45.4642,
          startLng: 9.19,
          endLat: 45.468,
          endLng: 9.187,
          distanceKm: 2.5,
          durationMinutes: 20,
          totalCostAmount: 5,
          totalCostCurrency: 'EUR',
        })
        .onConflictDoNothing();
    }
    console.log('[seed] Demo rides inserted');
  }

  // Sprint 22 — Seed cantiere demo (Milano Duomo) idempotente
  // Verifica se esiste già una zone_roles "cantiere"+"block"
  const existingRole = await db
    .select({ id: zoneRoles.id })
    .from(zoneRoles)
    .where(and(eq(zoneRoles.type, 'cantiere'), eq(zoneRoles.action, 'block')))
    .limit(1);

  // Seed solo se non esistono ancora aree cantiere (idempotente)
  let roleId: number;
  if (existingRole.length === 0) {
    const insertedRole = await db
      .insert(zoneRoles)
      .values({ type: 'cantiere', action: 'block', color: '#FF6B00', userDriven: false })
      .returning({ id: zoneRoles.id });
    roleId = insertedRole[0]!.id;
  } else {
    roleId = existingRole[0]!.id;
  }

  const existingAreas = await db
    .select({ id: areas.id })
    .from(areas)
    .where(eq(areas.zoneRoleId, roleId))
    .limit(1);

  if (existingAreas.length === 0) {
    // Cantiere demo: spostato lontano dai veicoli per non intralciare la presentazione MVP
    // I veicoli seed (v1-v8) sono in lat ~45.461-45.472, lng ~9.182-9.19
    // Il cantiere è stato spostato in zona Porta Romana
    const demoCantierePoly = [
      { lat: 45.4500, lng: 9.1950 }, // SW
      { lat: 45.4500, lng: 9.2050 }, // SE
      { lat: 45.4550, lng: 9.2050 }, // NE
      { lat: 45.4550, lng: 9.1950 }, // NW
    ];

    const insertedArea = await db
      .insert(areas)
      .values({
        zoneRoleId: roleId,
        name: 'Cantiere Piazza Duomo — Milano',
        active: true,
        notes: 'Area dimostrativa Sprint 22. Cantiere stradale intorno a Piazza del Duomo.',
        createdAt: new Date(),
      })
      .returning({ id: areas.id });

    const areaId = insertedArea[0]!.id;

    for (const [idx, v] of demoCantierePoly.entries()) {
      const insertedVertex = await db
        .insert(zoneVertexes)
        .values({ sequenceOrder: idx, latitude: v.lat, longitude: v.lng })
        .returning({ id: zoneVertexes.id });
      await db.insert(areaVertexes).values({ areaId, vertexId: insertedVertex[0]!.id });
    }

    console.log('[seed] Demo cantiere Milano Duomo inserted');
  }
}
