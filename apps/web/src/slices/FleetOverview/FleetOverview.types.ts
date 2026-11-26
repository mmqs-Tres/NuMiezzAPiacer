import { VehicleStatus } from '@mvp/contracts';

export interface FleetOverviewFilters {
  statuses: Set<VehicleStatus>;
}
