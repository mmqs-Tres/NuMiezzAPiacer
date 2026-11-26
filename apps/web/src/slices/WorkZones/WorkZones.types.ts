import { Coordinates, WorkZone } from '@mvp/contracts';

export type { WorkZone, Coordinates };

/** Stato del form di creazione cantiere */
export interface WorkZoneFormState {
  name: string;
  notes: string;
  polygon: Coordinates[];
}

/** Bounds della mappa schematica (in gradi lat/lng) */
export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Dimensioni pixel della mappa schematica */
export interface MapSize {
  width: number;
  height: number;
}
