import { DailyRidesByType, VehicleType } from '@mvp/contracts';
import { RideAnalyticsDeps, RideAnalyticsInput, RideAnalyticsOutput, RideAnalyticsValidationError } from './RideAnalytics.types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 92;
const DEFAULT_RANGE_DAYS = 7;

// Convenzione: data locale del server in formato YYYY-MM-DD (coerente con il seed).
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: string, label: string): Date {
  if (!DATE_RE.test(value)) {
    throw new RideAnalyticsValidationError(`${label} deve essere una data valida nel formato YYYY-MM-DD`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new RideAnalyticsValidationError(`${label} non è una data valida`);
  }
  return date;
}

export const createRideAnalyticsHandler = (deps: RideAnalyticsDeps) => {
  return async (input: RideAnalyticsInput): Promise<RideAnalyticsOutput> => {
    let fromDate: Date;
    let toDate: Date;

    if (!input.from && !input.to) {
      toDate = new Date();
      toDate.setHours(0, 0, 0, 0);
      fromDate = new Date(toDate);
      fromDate.setDate(fromDate.getDate() - (DEFAULT_RANGE_DAYS - 1));
    } else {
      fromDate = parseDate(input.from ?? formatDate(new Date()), 'from');
      toDate = parseDate(input.to ?? formatDate(new Date()), 'to');
    }

    if (fromDate.getTime() > toDate.getTime()) {
      throw new RideAnalyticsValidationError('from non può essere successivo a to');
    }

    const rangeDays = Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (rangeDays > MAX_RANGE_DAYS) {
      throw new RideAnalyticsValidationError(`L'intervallo non può superare ${MAX_RANGE_DAYS} giorni`);
    }

    const fromStart = new Date(fromDate);
    fromStart.setHours(0, 0, 0, 0);
    const toEnd = new Date(toDate);
    toEnd.setHours(23, 59, 59, 999);

    const rides = await deps.rideRepo.findStartedBetween(fromStart, toEnd);

    // Mappa vehicleId -> VehicleType costruita con una sola lettura della flotta (evita N+1).
    const vehicles = await deps.vehicleRepo.search({});
    const vehicleTypeById = new Map<string, VehicleType>();
    for (const v of vehicles) {
      vehicleTypeById.set(v.id, v.type);
    }

    const daysByDate = new Map<string, DailyRidesByType>();
    for (let cursor = new Date(fromStart); cursor.getTime() <= toEnd.getTime(); cursor.setDate(cursor.getDate() + 1)) {
      const date = formatDate(cursor);
      daysByDate.set(date, { date, countsByType: {}, total: 0 });
    }

    for (const ride of rides) {
      const date = formatDate(new Date(ride.startedAt));
      const day = daysByDate.get(date);
      if (!day) continue;

      day.total += 1;

      // Fallback: veicoli non più presenti in flotta contano nel totale ma non nel breakdown per tipo.
      const type = vehicleTypeById.get(ride.vehicleId);
      if (type) {
        day.countsByType[type] = (day.countsByType[type] ?? 0) + 1;
      }
    }

    const days = Array.from(daysByDate.values()).sort((a, b) => a.date.localeCompare(b.date));

    return { days, from: formatDate(fromStart), to: formatDate(toEnd) };
  };
};
