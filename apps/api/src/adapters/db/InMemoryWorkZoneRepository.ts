import { IWorkZoneRepository, WorkZone } from '@mvp/contracts';

// TODO (sprint 21+): persistere su schema reale (areas/area_vertexes/zone_vertexes/zone_roles) via Drizzle.
const DEMO_WORK_ZONES: WorkZone[] = [
  {
    id: 'wz1',
    name: 'Cantiere Piazza Duomo',
    active: true,
    polygon: [
      { lat: 45.4645, lng: 9.1895 },
      { lat: 45.4645, lng: 9.192 },
      { lat: 45.4625, lng: 9.192 },
      { lat: 45.4625, lng: 9.1895 },
    ],
    createdAt: new Date(),
    notes: 'Lavori stradali in corso, area temporaneamente non utilizzabile per fine corsa.',
  },
];

export class InMemoryWorkZoneRepository implements IWorkZoneRepository {
  private readonly zones: WorkZone[] = [...DEMO_WORK_ZONES];

  async findAll(): Promise<WorkZone[]> {
    return this.zones;
  }

  async findActive(): Promise<WorkZone[]> {
    return this.zones.filter((z) => z.active);
  }

  async create(data: Omit<WorkZone, 'id' | 'createdAt'>): Promise<WorkZone> {
    const zone: WorkZone = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.zones.push(zone);
    return zone;
  }
}
