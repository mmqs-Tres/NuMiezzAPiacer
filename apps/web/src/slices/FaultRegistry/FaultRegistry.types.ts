import { FaultCategory, FaultSeverity } from '@mvp/contracts';

export interface FaultRegistryFilters {
  severities: Set<FaultSeverity>;
  category: FaultCategory | 'ALL';
  search: string;
}
