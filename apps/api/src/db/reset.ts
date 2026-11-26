import { db } from './index';
import { sql } from 'drizzle-orm';
import {
  vehicles,
  users,
  bookings,
  rides,
  zoneVertexes,
  zoneRoles,
  areas,
  areaVertexes,
  fleetNames,
  parkingBonusRules,
  operators,
  cars,
  bicycles,
  scooters,
  vehiclePositionHistory,
  vehicleConditionRepo,
  supportTickets,
  promotions,
  customers,
  paymentMethods,
  publicAdministration,
  mobilityReports,
} from './schema';
import { seedDemoData } from './seed';

async function reset() {
  console.log('[reset] Resetting database...');
  try {
    // Disable foreign keys to clear everything safely
    await db.run(sql`PRAGMA foreign_keys = OFF`);

    // Delete all records from all tables
    await db.delete(rides);
    await db.delete(bookings);
    await db.delete(vehicles);
    await db.delete(users);
    await db.delete(zoneVertexes);
    await db.delete(zoneRoles);
    await db.delete(areas);
    await db.delete(areaVertexes);
    await db.delete(fleetNames);
    await db.delete(parkingBonusRules);
    await db.delete(operators);
    await db.delete(cars);
    await db.delete(bicycles);
    await db.delete(scooters);
    await db.delete(vehiclePositionHistory);
    await db.delete(vehicleConditionRepo);
    await db.delete(supportTickets);
    await db.delete(promotions);
    await db.delete(customers);
    await db.delete(paymentMethods);
    await db.delete(publicAdministration);
    await db.delete(mobilityReports);

    await db.run(sql`PRAGMA foreign_keys = ON`);
    console.log('[reset] Database tables cleared.');

    // Seed data
    // We pass db to seedDemoData, which will populate vehicles and users.
    // In seedDemoData, it checks:
    // const existing = await db.select({ id: vehicles.id }).from(vehicles).limit(1);
    // if (existing.length > 0) return;
    // Since we just deleted them, it will run.
    await seedDemoData(db);
    console.log('[reset] Database re-seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[reset] Failed to reset database:', error);
    process.exit(1);
  }
}

reset();
