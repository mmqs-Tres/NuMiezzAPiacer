'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bike, Car, Zap } from 'lucide-react';
import { VehicleStatus, VehicleType, FleetVehicleItem } from '@mvp/contracts';
import { useFleetOverview } from './FleetOverview.hook';

const RELEVANT_STATUSES = [
  VehicleStatus.AVAILABLE,
  VehicleStatus.IN_USE,
  VehicleStatus.MAINTENANCE,
];

function statusColor(status: VehicleStatus) {
  switch (status) {
    case VehicleStatus.AVAILABLE: return 'bg-primary text-primary-foreground';
    case VehicleStatus.IN_USE: return 'bg-secondary text-secondary-foreground';
    case VehicleStatus.MAINTENANCE: return 'bg-destructive text-destructive-foreground';
    case VehicleStatus.BLOCKED: return 'bg-zinc-800 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
}

function statusBadge(status: VehicleStatus) {
  const config: Record<VehicleStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    [VehicleStatus.AVAILABLE]: { label: 'Disponibile', variant: 'default' },
    [VehicleStatus.IN_USE]: { label: 'In uso', variant: 'secondary' },
    [VehicleStatus.RESERVED]: { label: 'Riservato', variant: 'outline' },
    [VehicleStatus.MAINTENANCE]: { label: 'Manutenzione', variant: 'destructive' },
    [VehicleStatus.OFFLINE]: { label: 'Offline', variant: 'secondary' },
    [VehicleStatus.BLOCKED]: { label: 'Bloccato', variant: 'destructive' },
  };
  const c = config[status] || { label: status, variant: 'default' };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function batteryColor(level: number) {
  if (level > 50) return 'text-green-600';
  if (level > 20) return 'text-yellow-600';
  return 'text-red-600';
}

function vehicleIcon(type: VehicleType) {
  if (type === VehicleType.BIKE) return <Bike className="h-5 w-5" />;
  if (type === VehicleType.CAR) return <Car className="h-5 w-5" />;
  return <Zap className="h-5 w-5" />;
}

function vehicleTypeLabel(type: VehicleType) {
  const labels: Record<VehicleType, string> = {
    [VehicleType.SCOOTER]: 'Scooter',
    [VehicleType.BIKE]: 'Bici',
    [VehicleType.MOPED]: 'Moped',
    [VehicleType.CAR]: 'Auto',
  };
  return labels[type];
}

function SchematicMap({ vehicles }: { vehicles: FleetVehicleItem[] }) {
  const { minLat, maxLat, minLng, maxLng } = useMemo(() => {
    if (vehicles.length === 0) return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
    const lats = vehicles.map(v => v.position.lat);
    const lngs = vehicles.map(v => v.position.lng);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  }, [vehicles]);

  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  if (vehicles.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-muted/20 rounded-md border">
        <p className="text-muted-foreground text-sm">Nessun veicolo da mostrare sulla mappa.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] w-full bg-muted/10 rounded-md border overflow-hidden">
      {vehicles.map((v) => {
        // Normalizzazione + padding virtuale 5%
        const x = 5 + ((v.position.lng - minLng) / lngRange) * 90;
        const y = 5 + ((1 - (v.position.lat - minLat) / latRange)) * 90;
        
        return (
          <div
            key={v.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={`${v.plateOrCode} - ${v.status}`}
          >
            <div className={`w-3 h-3 rounded-full shadow-sm ring-2 ring-background ${statusColor(v.status)}`} />
          </div>
        );
      })}
    </div>
  );
}

export function FleetOverviewPage() {
  const { vehicles, isLoading, error, refetch } = useFleetOverview();
  
  const relevantVehicles = useMemo(() => {
    return vehicles.filter(v => RELEVANT_STATUSES.includes(v.status));
  }, [vehicles]);

  const [activeFilters, setActiveFilters] = useState<Set<VehicleStatus>>(new Set(RELEVANT_STATUSES));

  const toggleFilter = (status: VehicleStatus) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setActiveFilters(newFilters);
  };

  const filteredVehicles = useMemo(() => {
    return relevantVehicles.filter(v => activeFilters.has(v.status));
  }, [relevantVehicles, activeFilters]);

  const counts = useMemo(() => {
    return relevantVehicles.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {} as Record<VehicleStatus, number>);
  }, [relevantVehicles]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-lg font-medium">Errore di caricamento</p>
        <p className="text-muted-foreground text-sm mb-6">Impossibile recuperare i dati della flotta.</p>
        <Button onClick={() => refetch()}>Riprova</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Mappa Flotta</h1>
        <div className="flex items-center flex-wrap gap-2">
          {RELEVANT_STATUSES.map(status => {
            const isActive = activeFilters.has(status);
            const count = counts[status] || 0;
            const label = status === VehicleStatus.AVAILABLE ? 'Disponibili' :
                          status === VehicleStatus.IN_USE ? 'In uso' : 'In manutenzione';
                          
            return (
              <Button
                key={status}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(status)}
                className="gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-current opacity-70' : statusColor(status)}`} />
                {label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6">
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Mappa Schematica</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <SchematicMap vehicles={filteredVehicles} />
          </CardContent>
        </Card>

        <Card className="flex flex-col max-h-[600px] xl:max-h-[800px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lista Veicoli ({filteredVehicles.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2">
            {filteredVehicles.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nessun veicolo corrisponde ai filtri attivi.
              </p>
            ) : (
              filteredVehicles.map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {vehicleIcon(v.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{vehicleTypeLabel(v.type)}</span>
                        <span className="text-xs text-muted-foreground font-mono">{v.plateOrCode}</span>
                      </div>
                      <div className="mt-1">
                        {statusBadge(v.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className={`text-xs font-medium ${batteryColor(v.batteryLevel)}`}>
                      {v.batteryLevel}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
