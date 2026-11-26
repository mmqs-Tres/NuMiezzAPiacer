import { IWorkZoneRepository, Coordinates } from '@mvp/contracts';

export interface WorkZonesDeps {
  workZoneRepo: IWorkZoneRepository;
}

export interface CreateWorkZoneInput {
  name: string;
  polygon: Coordinates[];
  notes?: string;
}

export class WorkZonesValidationError extends Error {}
