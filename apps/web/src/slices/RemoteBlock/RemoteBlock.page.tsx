'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Radio, ShieldCheck, ShieldOff, Search as SearchIcon } from 'lucide-react';
import { FleetVehicleItem, VehicleStatus } from '@mvp/contracts';
import { useRemoteBlock, useRemoteBlockFleet } from './RemoteBlock.hook';
import { RemoteBlockAction } from './RemoteBlock.types';

const STATUS_LABELS: Record<VehicleStatus, string> = {
  [VehicleStatus.AVAILABLE]: 'Disponibile',
  [VehicleStatus.IN_USE]: 'In uso',
  [VehicleStatus.RESERVED]: 'Riservato',
  [VehicleStatus.MAINTENANCE]: 'Manutenzione',
  [VehicleStatus.OFFLINE]: 'Offline',
  [VehicleStatus.BLOCKED]: 'Bloccato',
};

function statusBadgeVariant(status: VehicleStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === VehicleStatus.BLOCKED) return 'destructive';
  if (status === VehicleStatus.AVAILABLE) return 'default';
  return 'secondary';
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RemoteBlockPage() {
  const { vehicles, isLoading: fleetLoading } = useRemoteBlockFleet();
  const { block, unblock, isPending, blockError, unblockError, blockData, unblockData, reset } = useRemoteBlock();

  const [vehicleId, setVehicleId] = useState('');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<RemoteBlockAction | null>(null);

  const selectedVehicle = useMemo<FleetVehicleItem | undefined>(
    () => vehicles.find((v) => v.id === vehicleId.trim()),
    [vehicles, vehicleId]
  );

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) => `${v.plateOrCode} ${v.id}`.toLowerCase().includes(q));
  }, [vehicles, search]);

  const result = blockData ?? unblockData;
  const error = blockError ?? unblockError;

  const handleSelectVehicle = (v: FleetVehicleItem) => {
    setVehicleId(v.id);
    reset();
  };

  const openConfirm = (action: RemoteBlockAction) => {
    if (!vehicleId.trim()) return;
    setConfirmAction(action);
  };

  const handleConfirm = () => {
    const id = vehicleId.trim();
    if (confirmAction === 'BLOCK') {
      block(id);
    } else if (confirmAction === 'UNBLOCK') {
      unblock(id);
    }
    setConfirmAction(null);
  };

  // Se non conosciamo lo stato del veicolo (id digitato a mano), mostriamo
  // entrambe le azioni e lasciamo che l'API rifiuti quella non valida (409).
  const showUnblock = !selectedVehicle || selectedVehicle.status === VehicleStatus.BLOCKED;
  const showBlock = !selectedVehicle || selectedVehicle.status !== VehicleStatus.BLOCKED;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blocco remoto</h1>
        <p className="text-muted-foreground text-sm">Invio comando remoto di interruzione (blocco/sblocco) a un veicolo identificato tramite ID</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Veicolo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Codice identificativo (ID) veicolo</label>
            <Input
              placeholder="Es. v1, v2..."
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                reset();
              }}
              className="font-mono"
            />
          </div>

          {selectedVehicle && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{selectedVehicle.plateOrCode}</span>
                  <span className="text-xs text-muted-foreground font-mono">{selectedVehicle.id}</span>
                </div>
                <div className="mt-1">
                  <Badge variant={statusBadgeVariant(selectedVehicle.status)}>
                    {STATUS_LABELS[selectedVehicle.status]}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {showBlock && (
              <Button
                variant="destructive"
                disabled={!vehicleId.trim() || isPending}
                onClick={() => openConfirm('BLOCK')}
                className="gap-2"
              >
                <ShieldOff className="h-4 w-4" />
                Blocca veicolo
              </Button>
            )}
            {showUnblock && (
              <Button
                variant="outline"
                disabled={!vehicleId.trim() || isPending}
                onClick={() => openConfirm('UNBLOCK')}
                className="gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Sblocca veicolo
              </Button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 border rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error.message}</span>
            </div>
          )}

          {result && (
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-primary/5">
              <Radio className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">{result.plateOrCode}</p>
                <p className="text-muted-foreground">
                  {STATUS_LABELS[result.previousStatus]} → {STATUS_LABELS[result.status]}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(result.executedAt)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Seleziona dalla flotta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per ID o targa/codice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {fleetLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredVehicles.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Nessun veicolo trovato.</p>
              ) : (
                filteredVehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVehicle(v)}
                    className={`w-full text-left flex items-center justify-between gap-2 p-3 border rounded-lg transition-colors ${
                      v.id === vehicleId.trim() ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{v.plateOrCode}</span>
                        <span className="text-xs text-muted-foreground font-mono">{v.id}</span>
                      </div>
                    </div>
                    <Badge variant={statusBadgeVariant(v.status)}>{STATUS_LABELS[v.status]}</Badge>
                  </button>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'BLOCK' ? 'Confermi il blocco remoto?' : 'Confermi lo sblocco remoto?'}
            </DialogTitle>
            <DialogDescription>
              Veicolo: <span className="font-mono">{selectedVehicle?.plateOrCode ?? vehicleId.trim()}</span>
              {' '}({vehicleId.trim()})
              <br />
              {confirmAction === 'BLOCK'
                ? 'Il mezzo verrà contrassegnato come bloccato e risulterà inutilizzabile fino a un successivo sblocco.'
                : 'Il mezzo verrà ripristinato come disponibile per i rider.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Annulla</Button>
            <Button
              variant={confirmAction === 'BLOCK' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={isPending}
            >
              {confirmAction === 'BLOCK' ? 'Blocca veicolo' : 'Sblocca veicolo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
