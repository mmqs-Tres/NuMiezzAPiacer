import { Coordinates } from '@mvp/contracts';

/**
 * Algoritmo ray-casting per point-in-polygon.
 * Verifica se `point` cade dentro il `polygon` (lista ordinata di vertici).
 * Funziona correttamente per poligoni semplici (non auto-intersecanti).
 */
export function pointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
  const { lat: px, lng: py } = point;
  const n = polygon.length;
  let inside = false;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i]!.lat;
    const yi = polygon[i]!.lng;
    const xj = polygon[j]!.lat;
    const yj = polygon[j]!.lng;

    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}
