import { VehicleStatus } from '@mvp/contracts';
import {
  RemoteBlockDeps,
  RemoteBlockInput,
  RemoteBlockOutput,
  RemoteBlockValidationError,
  RemoteBlockNotFoundError,
  RemoteBlockConflictError,
  RemoteBlockCommandFailedError,
} from './RemoteBlock.types';

function toPlateOrCode(vehicle: { id: string; type: string; licensePlate?: string }): string {
  return vehicle.licensePlate ?? `${vehicle.type}-${vehicle.id.slice(-3).toUpperCase()}`;
}

export const createRemoteBlockHandler = (deps: RemoteBlockDeps) => {
  const block = async (input: RemoteBlockInput): Promise<RemoteBlockOutput> => {
    const vehicleId = input.vehicleId?.trim();
    if (!vehicleId) {
      throw new RemoteBlockValidationError('vehicleId is required');
    }

    const vehicle = await deps.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw new RemoteBlockNotFoundError(`Vehicle ${vehicleId} not found`);
    }

    const plateOrCode = toPlateOrCode(vehicle);

    // Idempotente: un veicolo gia' bloccato resta bloccato senza errore.
    if (vehicle.status === VehicleStatus.BLOCKED) {
      return {
        vehicleId,
        plateOrCode,
        previousStatus: VehicleStatus.BLOCKED,
        status: VehicleStatus.BLOCKED,
        executedAt: new Date().toISOString(),
      };
    }

    // Assunzione MVP: nel caso IN_USE il blocco da remoto e' rifiutato
    // (nessun flusso di interruzione corsa in questo sprint).
    if (vehicle.status === VehicleStatus.IN_USE) {
      throw new RemoteBlockConflictError('Veicolo attualmente in uso, impossibile bloccare da remoto in questa fase');
    }

    const result = await deps.remoteCommandService.block(vehicleId);
    if (!result.success) {
      throw new RemoteBlockCommandFailedError('Comando di blocco remoto non riuscito');
    }

    await deps.vehicleRepo.updateStatus(vehicleId, VehicleStatus.BLOCKED);

    return {
      vehicleId,
      plateOrCode,
      previousStatus: vehicle.status,
      status: VehicleStatus.BLOCKED,
      executedAt: new Date().toISOString(),
    };
  };

  const unblock = async (input: RemoteBlockInput): Promise<RemoteBlockOutput> => {
    const vehicleId = input.vehicleId?.trim();
    if (!vehicleId) {
      throw new RemoteBlockValidationError('vehicleId is required');
    }

    const vehicle = await deps.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      throw new RemoteBlockNotFoundError(`Vehicle ${vehicleId} not found`);
    }

    const plateOrCode = toPlateOrCode(vehicle);

    if (vehicle.status !== VehicleStatus.BLOCKED) {
      throw new RemoteBlockConflictError('Il veicolo non e\' bloccato');
    }

    const result = await deps.remoteCommandService.unblock(vehicleId);
    if (!result.success) {
      throw new RemoteBlockCommandFailedError('Comando di sblocco remoto non riuscito');
    }

    // Assunzione MVP: lo sblocco ripristina sempre AVAILABLE, lo stato
    // pre-blocco non viene persistito.
    await deps.vehicleRepo.updateStatus(vehicleId, VehicleStatus.AVAILABLE);

    return {
      vehicleId,
      plateOrCode,
      previousStatus: VehicleStatus.BLOCKED,
      status: VehicleStatus.AVAILABLE,
      executedAt: new Date().toISOString(),
    };
  };

  return { block, unblock };
};
