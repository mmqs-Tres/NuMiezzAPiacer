import { desc, eq } from 'drizzle-orm';
import { IFaultReportRepository, FaultReport, FaultCategory, FaultSeverity } from '@mvp/contracts';
import { Db } from '../../db';
import { vehicleConditionRepo } from '../../db/schema';

function toFaultCategory(value: string | null): FaultCategory {
  if (value && (Object.values(FaultCategory) as string[]).includes(value)) {
    return value as FaultCategory;
  }
  return FaultCategory.OTHER;
}

function toFaultSeverity(value: string | null): FaultSeverity {
  if (value && (Object.values(FaultSeverity) as string[]).includes(value)) {
    return value as FaultSeverity;
  }
  return FaultSeverity.MEDIUM;
}

function rowToFaultReport(row: typeof vehicleConditionRepo.$inferSelect): FaultReport {
  return {
    id: String(row.id),
    vehicleId: row.vehicleId,
    reportedAt: row.reportedAt,
    category: toFaultCategory(row.category),
    severity: toFaultSeverity(row.severity),
    notes: row.notes ?? undefined,
    images: row.images ? JSON.parse(row.images) : [],
  };
}

export class DrizzleFaultReportRepository implements IFaultReportRepository {
  constructor(private readonly db: Db) {}

  async findAll(): Promise<FaultReport[]> {
    const rows = await this.db
      .select()
      .from(vehicleConditionRepo)
      .orderBy(desc(vehicleConditionRepo.reportedAt));
    return rows.map(rowToFaultReport);
  }

  async findById(id: string): Promise<FaultReport | null> {
    const rows = await this.db
      .select()
      .from(vehicleConditionRepo)
      .where(eq(vehicleConditionRepo.id, Number(id)))
      .limit(1);
    return rows[0] ? rowToFaultReport(rows[0]) : null;
  }
}
