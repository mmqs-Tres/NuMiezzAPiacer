import { IZoneValidator, IWorkZoneRepository, Coordinates } from '@mvp/contracts';
import { pointInPolygon } from './geo';

export class MockZoneValidator implements IZoneValidator {
  constructor(private readonly workZoneRepo: IWorkZoneRepository) {}

  async isInServiceZone(_coords: Coordinates): Promise<boolean> {
    return true;
  }

  async isInParkingZone(_coords: Coordinates): Promise<{ valid: boolean; zoneId?: string }> {
    return { valid: true, zoneId: 'zone-default' };
  }

  /**
   * IF21 — enforcement reale: controlla se le coordinate cadono dentro
   * un geofence cantiere attivo usando l'algoritmo ray-casting.
   */
  async isInBlockedArea(coords: Coordinates): Promise<{ blocked: boolean; zoneId?: string }> {
    const activeZones = await this.workZoneRepo.findActive();

    for (const zone of activeZones) {
      if (zone.polygon.length >= 3 && pointInPolygon(coords, zone.polygon)) {
        return { blocked: true, zoneId: zone.id };
      }
    }

    return { blocked: false };
  }
}
