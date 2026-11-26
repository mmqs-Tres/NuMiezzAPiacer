import { RemoteCommandResult } from '@mvp/contracts';

export type RemoteBlockAction = 'BLOCK' | 'UNBLOCK';

export interface RemoteBlockState {
  vehicleId: string;
  pendingAction: RemoteBlockAction | null;
  result: RemoteCommandResult | null;
}
