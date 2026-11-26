export enum UserRole {
  RIDER = 'RIDER',
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN',
}

export enum VehicleType {
  SCOOTER = 'SCOOTER',
  BIKE = 'BIKE',
  MOPED = 'MOPED',
  CAR = 'CAR',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
  OFFLINE = 'OFFLINE',
  BLOCKED = 'BLOCKED',
}

export enum RideStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  CONVERTED_TO_RIDE = 'CONVERTED_TO_RIDE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum FaultSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum FaultCategory {
  MECHANICAL = 'MECHANICAL',
  ELECTRICAL = 'ELECTRICAL',
  BRAKES = 'BRAKES',
  TIRE = 'TIRE',
  BATTERY = 'BATTERY',
  BODY = 'BODY',
  OTHER = 'OTHER',
}
