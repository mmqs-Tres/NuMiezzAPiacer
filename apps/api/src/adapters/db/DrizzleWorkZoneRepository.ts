import { eq, and } from 'drizzle-orm';
import { IWorkZoneRepository, WorkZone, Coordinates } from '@mvp/contracts';
import type { Db } from '../../db';
import { areas, areaVertexes, zoneRoles, zoneVertexes } from '../../db/schema';

/**
 * DrizzleWorkZoneRepository
 *
 * Persiste i geofence cantiere (WorkZone) sulle tabelle reali Sprint 18:
 *   zone_roles (type='cantiere', action='block')
 *   areas      (zone_role_id, name, active, notes, created_at)
 *   zone_vertexes (sequence_order, latitude, longitude)
 *   area_vertexes (area_id, vertex_id)
 *
 * Strategia zone_roles: una singola riga condivisa per tutti i cantieri
 * (type='cantiere', action='block'), creata on-demand se assente.
 */
export class DrizzleWorkZoneRepository implements IWorkZoneRepository {
  constructor(private readonly db: Db) {}

  /** Assicura/ritorna l'id della zone_roles condivisa "cantiere". */
  private async ensureCantiereRole(): Promise<number> {
    const existing = await this.db
      .select({ id: zoneRoles.id })
      .from(zoneRoles)
      .where(and(eq(zoneRoles.type, 'cantiere'), eq(zoneRoles.action, 'block')))
      .limit(1);

    if (existing.length > 0) return existing[0]!.id;

    const inserted = await this.db
      .insert(zoneRoles)
      .values({
        type: 'cantiere',
        action: 'block',
        color: '#FF6B00',
        userDriven: false,
      })
      .returning({ id: zoneRoles.id });

    return inserted[0]!.id;
  }

  /** Ricostruisce un WorkZone da area + vertici. */
  private async buildWorkZone(area: typeof areas.$inferSelect): Promise<WorkZone | null> {
    // Carica i vertici ordinati per sequence_order
    const rows = await this.db
      .select({
        latitude: zoneVertexes.latitude,
        longitude: zoneVertexes.longitude,
        sequenceOrder: zoneVertexes.sequenceOrder,
      })
      .from(areaVertexes)
      .innerJoin(zoneVertexes, eq(areaVertexes.vertexId, zoneVertexes.id))
      .where(eq(areaVertexes.areaId, area.id));

    const polygon: Coordinates[] = rows
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .map((r) => ({ lat: r.latitude, lng: r.longitude }));

    return {
      id: String(area.id),
      name: area.name ?? `Cantiere #${area.id}`,
      active: area.active,
      polygon,
      createdAt: area.createdAt ?? new Date(0),
      notes: area.notes ?? undefined,
    };
  }

  async findAll(): Promise<WorkZone[]> {
    const cantiereRole = await this.db
      .select({ id: zoneRoles.id })
      .from(zoneRoles)
      .where(and(eq(zoneRoles.type, 'cantiere'), eq(zoneRoles.action, 'block')))
      .limit(1);

    if (cantiereRole.length === 0) return [];

    const cantiereRows = await this.db
      .select()
      .from(areas)
      .where(eq(areas.zoneRoleId, cantiereRole[0]!.id));

    const results: WorkZone[] = [];
    for (const area of cantiereRows) {
      const wz = await this.buildWorkZone(area);
      if (wz) results.push(wz);
    }
    return results;
  }

  async findActive(): Promise<WorkZone[]> {
    const cantiereRole = await this.db
      .select({ id: zoneRoles.id })
      .from(zoneRoles)
      .where(and(eq(zoneRoles.type, 'cantiere'), eq(zoneRoles.action, 'block')))
      .limit(1);

    if (cantiereRole.length === 0) return [];

    const cantiereRows = await this.db
      .select()
      .from(areas)
      .where(and(eq(areas.zoneRoleId, cantiereRole[0]!.id), eq(areas.active, true)));

    const results: WorkZone[] = [];
    for (const area of cantiereRows) {
      const wz = await this.buildWorkZone(area);
      if (wz) results.push(wz);
    }
    return results;
  }

  async create(data: Omit<WorkZone, 'id' | 'createdAt'>): Promise<WorkZone> {
    const roleId = await this.ensureCantiereRole();
    const now = new Date();

    // 1. Inserisci area
    const insertedArea = await this.db
      .insert(areas)
      .values({
        zoneRoleId: roleId,
        name: data.name,
        active: data.active,
        notes: data.notes ?? null,
        createdAt: now,
      })
      .returning({ id: areas.id });

    const areaId = insertedArea[0]!.id;

    // 2. Inserisci i vertici e collega via area_vertexes
    for (const [idx, vertex] of data.polygon.entries()) {
      const insertedVertex = await this.db
        .insert(zoneVertexes)
        .values({
          sequenceOrder: idx,
          latitude: vertex.lat,
          longitude: vertex.lng,
        })
        .returning({ id: zoneVertexes.id });

      await this.db.insert(areaVertexes).values({
        areaId,
        vertexId: insertedVertex[0]!.id,
      });
    }

    return {
      id: String(areaId),
      name: data.name,
      active: data.active,
      polygon: data.polygon,
      createdAt: now,
      notes: data.notes,
    };
  }
}
