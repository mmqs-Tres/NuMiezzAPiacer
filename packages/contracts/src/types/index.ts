import { VehicleType, VehicleStatus, BookingStatus, RideStatus, FaultSeverity, FaultCategory } from '../enums';

export interface FleetZone {
  id: string;
  name: string;
  center: Coordinates;
  radiusKm: number;
}

export interface NearbyVehiclesItem {
  id: string;
  plateOrCode: string;
  type: VehicleType;
  status: VehicleStatus;
  batteryLevel: number;
  distanceMeters: number;
  estimatedWalkMinutes: number;
  currentPosition: Coordinates;
  zoneId?: string;
}

export interface NearbyVehiclesResponse {
  userPosition: Coordinates;
  radiusKm: number;
  vehicles: NearbyVehiclesItem[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface BatteryInfo {
  level: number;
  estimatedRangeKm: number;
}

export interface VehicleSpecs {
  maxSpeedKmh: number;
  weightKg: number;
  maxRangeKm: number;
}

export interface VehicleFeatures {
  hasGps: boolean;
  hasHelmetStorage: boolean;
  hasUsb: boolean;
  hasLock: boolean;
}

export interface PricingPlan {
  unlockFee: Money;
  perMinuteRate: Money;
  perKmRate?: Money;
  pauseRate?: Money;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  status: VehicleStatus;
  location: Coordinates;
  battery: BatteryInfo;
  specs: VehicleSpecs;
  features: VehicleFeatures;
  pricing: PricingPlan;
  licensePlate?: string;
  model: string;
  imageUrl?: string;
}

export interface VehicleSearchFilters {
  query?: string;
  type?: VehicleType;
  onlyAvailable?: boolean;
}

export interface SearchVehicleItem {
  id: string;
  plateOrCode: string;
  type: VehicleType;
  status: VehicleStatus;
  model: string;
  batteryLevel: number;
  estimatedRangeKm: number;
}

export interface SearchVehiclesResponse {
  vehicles: SearchVehicleItem[];
  total: number;
}

export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  status: BookingStatus;
  createdAt: Date;
  expiresAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
}

export interface Ride {
  id: string;
  userId: string;
  vehicleId: string;
  bookingId?: string;
  status: RideStatus;
  startedAt: Date;
  endedAt?: Date;
  startLocation: Coordinates;
  endLocation?: Coordinates;
  distanceKm?: number;
  durationMinutes?: number;
  totalCost?: Money;
}

export interface FleetVehicleItem {
  id: string;
  plateOrCode: string;
  type: VehicleType;
  status: VehicleStatus;
  model: string;
  batteryLevel: number;
  position: Coordinates;
}

export interface FleetOverviewResponse {
  vehicles: FleetVehicleItem[];
  total: number;
}

export interface FaultReport {
  id: string;
  vehicleId: string;
  reportedAt: Date;
  category: FaultCategory;
  severity: FaultSeverity;
  notes?: string;
  images: string[];
}

export interface FaultReportItem {
  id: string;
  vehicleId: string;
  plateOrCode: string;
  vehicleType: VehicleType;
  reportedAt: string;
  category: FaultCategory;
  severity: FaultSeverity;
  notesPreview?: string;
  notes?: string;
  images: string[];
  imagesCount: number;
}

export interface FaultRegistryResponse {
  reports: FaultReportItem[];
  total: number;
}

export interface RemoteCommandResult {
  vehicleId: string;
  plateOrCode: string;
  previousStatus: VehicleStatus;
  status: VehicleStatus;
  executedAt: string;
}

// --- PA (UserRole.ADMIN) scaffolding ---

export interface DailyRidesByType {
  date: string; // ISO date YYYY-MM-DD
  countsByType: Partial<Record<VehicleType, number>>;
  total: number;
}

export interface RideAnalyticsResponse {
  days: DailyRidesByType[];
  from: string;
  to: string;
}

export interface WorkZone {
  id: string;
  name: string;
  active: boolean;
  polygon: Coordinates[]; // vertici ordinati
  createdAt: Date;
  notes?: string;
}
