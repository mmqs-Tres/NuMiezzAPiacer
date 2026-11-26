import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env['DATABASE_URL'] ?? './data/mvp.db';

function createTables(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      battery_level INTEGER NOT NULL DEFAULT 100,
      battery_range_km REAL NOT NULL DEFAULT 0,
      model TEXT NOT NULL,
      license_plate TEXT,
      image_url TEXT,
      specs_json TEXT NOT NULL DEFAULT '{}',
      features_json TEXT NOT NULL DEFAULT '{}',
      pricing_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'RIDER',
      created_at INTEGER NOT NULL,
      first_name TEXT,
      last_name TEXT,
      city TEXT,
      arc_born INTEGER
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      confirmed_at INTEGER,
      cancelled_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      booking_id TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      start_lat REAL NOT NULL,
      start_lng REAL NOT NULL,
      end_lat REAL,
      end_lng REAL,
      distance_km REAL,
      duration_minutes REAL,
      total_cost_amount REAL,
      total_cost_currency TEXT
    );
  `);

  // ============================================================
  // Schema reale (prompt/schema.sql) - tabelle dimostrative.
  // Le 4 tabelle MVP sopra (vehicles, users, bookings, rides)
  // mantengono la definizione MVP (id TEXT) e NON vengono ridefinite.
  // Le FK delle tabelle nuove verso vehicles/users/rides usano TEXT.
  // ============================================================
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS zone_vertexes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sequence_order INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS zone_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      color TEXT,
      action TEXT,
      max_vehicles_qty INTEGER,
      extra_bonus REAL,
      user_driven INTEGER NOT NULL DEFAULT 0,
      radio_with TEXT
    );

    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_role_id INTEGER NOT NULL,
      name TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at INTEGER,
      FOREIGN KEY (zone_role_id) REFERENCES zone_roles(id)
    );

    CREATE TABLE IF NOT EXISTS area_vertexes (
      area_id INTEGER NOT NULL,
      vertex_id INTEGER NOT NULL,
      PRIMARY KEY (area_id, vertex_id),
      FOREIGN KEY (area_id) REFERENCES areas(id),
      FOREIGN KEY (vertex_id) REFERENCES zone_vertexes(id)
    );

    CREATE TABLE IF NOT EXISTS fleet_names (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parking_bonus_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_id INTEGER,
      area TEXT,
      extra REAL,
      extra_parking REAL,
      valid_from INTEGER,
      valid_to INTEGER,
      FOREIGN KEY (zone_id) REFERENCES areas(id)
    );

    CREATE TABLE IF NOT EXISTS operators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_code TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      api_key TEXT
    );

    CREATE TABLE IF NOT EXISTS cars (
      vehicle_id TEXT PRIMARY KEY,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS bicycles (
      vehicle_id TEXT PRIMARY KEY,
      has_child_seat INTEGER NOT NULL DEFAULT 0,
      has_basket INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS scooters (
      vehicle_id TEXT PRIMARY KEY,
      vehicle_battery_fc INTEGER,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS vehicle_position_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      logged_at INTEGER NOT NULL,
      accuracy_m REAL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS vehicle_condition_repo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT NOT NULL,
      reported_at INTEGER NOT NULL,
      category TEXT,
      severity TEXT,
      notes TEXT,
      images TEXT,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_vehicle_id TEXT,
      related_ride_id TEXT,
      assigned_operator INTEGER,
      category TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      closed_at INTEGER,
      FOREIGN KEY (related_vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (related_ride_id) REFERENCES rides(id),
      FOREIGN KEY (assigned_operator) REFERENCES operators(id)
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      code TEXT UNIQUE,
      valid_from INTEGER,
      valid_to INTEGER,
      discount_type TEXT,
      discount_value REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      la_prova TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      customer_subscription_id INTEGER,
      driving_license_code TEXT,
      driving_license_expiry INTEGER,
      FOREIGN KEY (id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      type TEXT,
      token TEXT,
      provider TEXT,
      expires_at INTEGER,
      is_default INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS public_administration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      department TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mobility_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      generated_by_admin INTEGER,
      generated_at INTEGER NOT NULL,
      period_from INTEGER,
      period_to INTEGER,
      file_name TEXT,
      FOREIGN KEY (generated_by_admin) REFERENCES public_administration(id)
    );

    CREATE INDEX IF NOT EXISTS idx_position_history_vid ON vehicle_position_history(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_condition_repo_vid ON vehicle_condition_repo(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
  `);

  // Sprint 22 — migrazione colonne per database già esistenti (ALTER TABLE ... ADD COLUMN è idempotente
  // solo se si gestisce l'errore "duplicate column name" di SQLite).
  const sprint22AlterColumns = [
    'ALTER TABLE areas ADD COLUMN name TEXT',
    'ALTER TABLE areas ADD COLUMN active INTEGER NOT NULL DEFAULT 1',
    'ALTER TABLE areas ADD COLUMN notes TEXT',
    'ALTER TABLE areas ADD COLUMN created_at INTEGER',
    'ALTER TABLE users ADD COLUMN first_name TEXT',
    'ALTER TABLE users ADD COLUMN last_name TEXT',
    'ALTER TABLE users ADD COLUMN city TEXT',
    'ALTER TABLE users ADD COLUMN arc_born INTEGER',
  ];
  for (const sql of sprint22AlterColumns) {
    try {
      sqlite.exec(sql);
    } catch {
      // Colonna già presente — ignorato.
    }
  }
}

function createDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  createTables(sqlite);

  return drizzle(sqlite, { schema });
}

export const db = createDb();
export type Db = typeof db;

export async function initDb(): Promise<void> {
  const { seedDemoData } = await import('./seed');
  await seedDemoData(db);
}
