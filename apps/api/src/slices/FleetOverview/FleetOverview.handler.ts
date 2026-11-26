import { FleetOverviewDeps, FleetOverviewInput, FleetOverviewOutput } from './FleetOverview.types';

export const createFleetOverviewHandler = (deps: FleetOverviewDeps) => {
  return async (_input: FleetOverviewInput): Promise<FleetOverviewOutput> => {
    const vehicles = await deps.vehicleRepo.search({});

    const fleetVehicles = vehicles.map((v) => ({
      id: v.id,
      plateOrCode: v.licensePlate ?? `${v.type}-${v.id.slice(-3).toUpperCase()}`,
      type: v.type,
      status: v.status,
      model: v.model,
      batteryLevel: v.battery.level,
      position: {
        lat: v.location.lat,
        lng: v.location.lng,
      },
    }));

    return {
      vehicles: fleetVehicles,
      total: fleetVehicles.length,
    };
  };
};
