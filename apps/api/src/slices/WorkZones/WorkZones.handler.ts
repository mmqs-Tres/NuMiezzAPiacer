import { WorkZone } from '@mvp/contracts';
import { WorkZonesDeps, CreateWorkZoneInput, WorkZonesValidationError } from './WorkZones.types';

export const createWorkZonesHandler = (deps: WorkZonesDeps) => {
  async function list(): Promise<WorkZone[]> {
    return deps.workZoneRepo.findAll();
  }

  async function create(input: CreateWorkZoneInput): Promise<WorkZone> {
    const name = input.name?.trim() ?? '';
    if (!name) {
      throw new WorkZonesValidationError('Il nome del cantiere è obbligatorio');
    }

    if (!Array.isArray(input.polygon) || input.polygon.length < 3) {
      throw new WorkZonesValidationError('Il poligono deve avere almeno 3 vertici');
    }

    for (const [i, vertex] of input.polygon.entries()) {
      if (
        typeof vertex.lat !== 'number' ||
        typeof vertex.lng !== 'number' ||
        vertex.lat < -90 ||
        vertex.lat > 90 ||
        vertex.lng < -180 ||
        vertex.lng > 180
      ) {
        throw new WorkZonesValidationError(
          `Il vertice ${i + 1} ha coordinate non valide (lat ∈ [-90,90], lng ∈ [-180,180])`
        );
      }
    }

    return deps.workZoneRepo.create({
      name,
      active: true,
      polygon: input.polygon,
      notes: input.notes,
    });
  }

  return { list, create };
};
