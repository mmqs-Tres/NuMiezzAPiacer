import { IRemoteCommandService, IVehicleRepository, RemoteCommandResult } from '@mvp/contracts';

export interface RemoteBlockDeps {
  vehicleRepo: IVehicleRepository;
  remoteCommandService: IRemoteCommandService;
}

export interface RemoteBlockInput {
  vehicleId: string;
}

export type RemoteBlockOutput = RemoteCommandResult;

export class RemoteBlockValidationError extends Error {}
export class RemoteBlockNotFoundError extends Error {}
export class RemoteBlockConflictError extends Error {}
export class RemoteBlockCommandFailedError extends Error {}
