import { FaultReportItem, VehicleType } from '@mvp/contracts';
import { FaultRegistryDeps, FaultRegistryInput, FaultRegistryOutput } from './FaultRegistry.types';

export const createFaultRegistryHandler = (deps: FaultRegistryDeps) => {
  return async (_input: FaultRegistryInput): Promise<FaultRegistryOutput> => {
    const reports = await deps.faultReportRepo.findAll();

    const items: FaultReportItem[] = await Promise.all(
      reports.map(async (report) => {
        const vehicle = await deps.vehicleRepo.findById(report.vehicleId);

        const plateOrCode = vehicle
          ? vehicle.licensePlate ?? `${vehicle.type}-${vehicle.id.slice(-3).toUpperCase()}`
          : `VEICOLO-${report.vehicleId.slice(-3).toUpperCase()}`;

        return {
          id: report.id,
          vehicleId: report.vehicleId,
          plateOrCode,
          // fallback se il veicolo referenziato non esiste piu' nel seed
          vehicleType: vehicle?.type ?? VehicleType.SCOOTER,
          reportedAt: report.reportedAt.toISOString(),
          category: report.category,
          severity: report.severity,
          notesPreview: report.notes ? report.notes.slice(0, 80) : undefined,
          notes: report.notes,
          images: report.images,
          imagesCount: report.images.length,
        };
      })
    );

    return {
      reports: items,
      total: items.length,
    };
  };
};
