import { IRemoteCommandService } from '@mvp/contracts';

export class MockRemoteCommandService implements IRemoteCommandService {
  async block(vehicleId: string) {
    console.log(`[MockRemoteCommandService] block command sent to vehicle ${vehicleId}`);
    return { success: true };
  }

  async unblock(vehicleId: string) {
    console.log(`[MockRemoteCommandService] unblock command sent to vehicle ${vehicleId}`);
    return { success: true };
  }
}
