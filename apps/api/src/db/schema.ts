import { sqliteTable, text, real, integer, primaryKey } from 'drizzle-orm/sqlite-core';

// Minimal schema bootstrap — full schema added per slice in future prompts
//
// NOTE (Sprint 18 - Parte A): lo schema "reale" completo (prompt/schema.sql) e' stato
// introdotto qui a fini dimostrativi. Le 4 tabelle MVP in collisione con lo schema
// reale (vehicles, users, bookings, rides) mantengono la definizione MVP esistente
// (id TEXT) perche' sono quelle realmente usate dalle slice. Le tabelle nuove dello
// schema reale che referenziano veicoli/utenti/corse dichiarano le relative FK come
// `text(...)` per restare coerenti con gli id TEXT del MVP.

export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  status: text('status').notNull().default('AVAILABLE'),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  batteryLevel: integer('battery_level').notNull().default(100),
  batteryRangeKm: real('battery_range_km').notNull().default(0),
  model: text('model').notNull(),
  licensePlate: text('license_plate'),
  imageUrl: text('image_url'),
  specsJson: text('specs_json').notNull().default('{}'),
  featuresJson: text('features_json').notNull().default('{}'),
  pricingJson: text('pricing_json').notNull().default('{}'),
});

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  vehicleId: text('vehicle_id').notNull(),
  status: text('status').notNull().default('PENDING'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  confirmedAt: integer('confirmed_at', { mode: 'timestamp' }),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
});

export const rides = sqliteTable('rides', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  vehicleId: text('vehicle_id').notNull(),
  bookingId: text('booking_id'),
  status: text('status').notNull().default('ACTIVE'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  startLat: real('start_lat').notNull(),
  startLng: real('start_lng').notNull(),
  endLat: real('end_lat'),
  endLng: real('end_lng'),
  distanceKm: real('distance_km'),
  durationMinutes: real('duration_minutes'),
  totalCostAmount: real('total_cost_amount'),
  totalCostCurrency: text('total_cost_currency'),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('RIDER'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  city: text('city'),
  arcBorn: integer('arc_born', { mode: 'timestamp' }),
});

// ============================================================
// Schema reale (prompt/schema.sql) - tabelle dimostrative
// Convenzione: TIMESTAMP/DATE -> integer({ mode: 'timestamp' }),
// DECIMAL(p,s) -> real(...), BOOLEAN -> integer({ mode: 'boolean' }).
// ============================================================

export const zoneVertexes = sqliteTable('zone_vertexes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sequenceOrder: integer('sequence_order').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
});

export const zoneRoles = sqliteTable('zone_roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  color: text('color'),
  action: text('action'),
  maxVehiclesQty: integer('max_vehicles_qty'),
  extraBonus: real('extra_bonus'),
  userDriven: integer('user_driven', { mode: 'boolean' }).notNull().default(false),
  radioWith: text('radio_with'),
});

export const areas = sqliteTable('areas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  zoneRoleId: integer('zone_role_id').notNull().references(() => zoneRoles.id),
  // Sprint 22 — colonne aggiuntive per WorkZone (IF19/IF21)
  name: text('name'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

export const areaVertexes = sqliteTable('area_vertexes', {
  areaId: integer('area_id').notNull().references(() => areas.id),
  vertexId: integer('vertex_id').notNull().references(() => zoneVertexes.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.areaId, table.vertexId] }),
}));

export const fleetNames = sqliteTable('fleet_names', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const parkingBonusRules = sqliteTable('parking_bonus_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  zoneId: integer('zone_id').references(() => areas.id),
  area: text('area'),
  extra: real('extra'),
  extraParking: real('extra_parking'),
  validFrom: integer('valid_from', { mode: 'timestamp' }),
  validTo: integer('valid_to', { mode: 'timestamp' }),
});

export const operators = sqliteTable('operators', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  operatorCode: text('operator_code').notNull().unique(),
  password: text('password').notNull(),
  apiKey: text('api_key'),
});

// vehicle_id adattato a TEXT: nel MVP `vehicles.id` e' TEXT (vedi nota in testa al file)
export const cars = sqliteTable('cars', {
  vehicleId: text('vehicle_id').primaryKey().references(() => vehicles.id),
});

export const bicycles = sqliteTable('bicycles', {
  vehicleId: text('vehicle_id').primaryKey().references(() => vehicles.id),
  hasChildSeat: integer('has_child_seat', { mode: 'boolean' }).notNull().default(false),
  hasBasket: integer('has_basket', { mode: 'boolean' }).notNull().default(false),
});

export const scooters = sqliteTable('scooters', {
  vehicleId: text('vehicle_id').primaryKey().references(() => vehicles.id),
  vehicleBatteryFc: integer('vehicle_battery_fc'),
});

export const vehiclePositionHistory = sqliteTable('vehicle_position_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  loggedAt: integer('logged_at', { mode: 'timestamp' }).notNull(),
  accuracyM: real('accuracy_m'),
});

// Tabella che alimenta IF27 - "segnalazioni condizione veicolo"
export const vehicleConditionRepo = sqliteTable('vehicle_condition_repo', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  reportedAt: integer('reported_at', { mode: 'timestamp' }).notNull(),
  category: text('category'),
  severity: text('severity'),
  notes: text('notes'),
  images: text('images'), // JSON array of image URLs
});

export const supportTickets = sqliteTable('support_tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  relatedVehicleId: text('related_vehicle_id').references(() => vehicles.id),
  relatedRideId: text('related_ride_id').references(() => rides.id),
  assignedOperator: integer('assigned_operator').references(() => operators.id),
  category: text('category'),
  notes: text('notes'),
  status: text('status').notNull().default('open'),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
});

export const promotions = sqliteTable('promotions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title'),
  code: text('code').unique(),
  validFrom: integer('valid_from', { mode: 'timestamp' }),
  validTo: integer('valid_to', { mode: 'timestamp' }),
  discountType: text('discount_type'), // 'percent' | 'fixed'
  discountValue: real('discount_value'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  laProva: text('la_prova'),
});

// customer_id adattato a TEXT: estende users.id (TEXT nel MVP)
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().references(() => users.id),
  customerSubscriptionId: integer('customer_subscription_id'),
  drivingLicenseCode: text('driving_license_code'),
  drivingLicenseExpiry: integer('driving_license_expiry', { mode: 'timestamp' }),
});

export const paymentMethods = sqliteTable('payment_methods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: text('customer_id').notNull().references(() => customers.id),
  type: text('type'), // 'card' | 'paypal' | etc.
  token: text('token'),
  provider: text('provider'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
});

export const publicAdministration = sqliteTable('public_administration', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique().references(() => users.id),
  department: text('department'),
});

export const mobilityReports = sqliteTable('mobility_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  generatedByAdmin: integer('generated_by_admin').references(() => publicAdministration.id),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull(),
  periodFrom: integer('period_from', { mode: 'timestamp' }),
  periodTo: integer('period_to', { mode: 'timestamp' }),
  fileName: text('file_name'),
});
