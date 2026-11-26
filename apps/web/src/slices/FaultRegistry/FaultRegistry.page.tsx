'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertCircle, Camera, ClipboardList } from 'lucide-react';
import { FaultCategory, FaultSeverity, FaultReportItem, VehicleType } from '@mvp/contracts';
import { useFaultRegistry } from './FaultRegistry.hook';

const ALL_SEVERITIES = [
  FaultSeverity.CRITICAL,
  FaultSeverity.HIGH,
  FaultSeverity.MEDIUM,
  FaultSeverity.LOW,
];

const ALL_CATEGORIES = [
  FaultCategory.MECHANICAL,
  FaultCategory.ELECTRICAL,
  FaultCategory.BRAKES,
  FaultCategory.TIRE,
  FaultCategory.BATTERY,
  FaultCategory.BODY,
  FaultCategory.OTHER,
];

const SEVERITY_LABELS: Record<FaultSeverity, string> = {
  [FaultSeverity.CRITICAL]: 'Critica',
  [FaultSeverity.HIGH]: 'Alta',
  [FaultSeverity.MEDIUM]: 'Media',
  [FaultSeverity.LOW]: 'Bassa',
};

const CATEGORY_LABELS: Record<FaultCategory, string> = {
  [FaultCategory.MECHANICAL]: 'Meccanico',
  [FaultCategory.ELECTRICAL]: 'Elettrico',
  [FaultCategory.BRAKES]: 'Freni',
  [FaultCategory.TIRE]: 'Pneumatici',
  [FaultCategory.BATTERY]: 'Batteria',
  [FaultCategory.BODY]: 'Carrozzeria',
  [FaultCategory.OTHER]: 'Altro',
};

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  [VehicleType.SCOOTER]: 'Scooter',
  [VehicleType.BIKE]: 'Bici',
  [VehicleType.MOPED]: 'Moped',
  [VehicleType.CAR]: 'Auto',
};

function severityBadgeClass(severity: FaultSeverity): string {
  switch (severity) {
    case FaultSeverity.CRITICAL:
      return 'bg-destructive text-destructive-foreground';
    case FaultSeverity.HIGH:
      return 'bg-orange-500 text-white';
    case FaultSeverity.MEDIUM:
      return 'bg-yellow-500 text-black';
    case FaultSeverity.LOW:
    default:
      return 'bg-muted text-muted-foreground';
  }
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

export function FaultRegistryPage() {
  const { reports, isLoading, error, refetch } = useFaultRegistry();

  const [activeSeverities, setActiveSeverities] = useState<Set<FaultSeverity>>(new Set(ALL_SEVERITIES));
  const [activeCategory, setActiveCategory] = useState<FaultCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FaultReportItem | null>(null);

  const counts = useMemo(() => {
    return reports.reduce((acc, r) => {
      acc[r.severity] = (acc[r.severity] || 0) + 1;
      return acc;
    }, {} as Record<FaultSeverity, number>);
  }, [reports]);

  const toggleSeverity = (severity: FaultSeverity) => {
    const next = new Set(activeSeverities);
    if (next.has(severity)) {
      next.delete(severity);
    } else {
      next.add(severity);
    }
    setActiveSeverities(next);
  };

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (!activeSeverities.has(r.severity)) return false;
      if (activeCategory !== 'ALL' && r.category !== activeCategory) return false;
      if (q) {
        const target = `${r.plateOrCode} ${r.vehicleId}`.toLowerCase();
        if (!target.includes(q)) return false;
      }
      return true;
    });
  }, [reports, activeSeverities, activeCategory, search]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-lg font-medium">Errore di caricamento</p>
        <p className="text-muted-foreground text-sm mb-6">Impossibile recuperare il registro guasti.</p>
        <Button onClick={() => refetch()}>Riprova</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registro guasti</h1>
        <p className="text-muted-foreground text-sm">Registro centralizzato delle segnalazioni di condizione veicolo</p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Totale</p>
            <p className="text-2xl font-bold">{reports.length}</p>
          </CardContent>
        </Card>
        {ALL_SEVERITIES.map((severity) => (
          <Card key={severity}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{SEVERITY_LABELS[severity]}</p>
              <p className="text-2xl font-bold">{counts[severity] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {ALL_SEVERITIES.map((severity) => {
              const isActive = activeSeverities.has(severity);
              return (
                <Button
                  key={severity}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSeverity(severity)}
                  className="gap-2"
                >
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-current opacity-70' : severityBadgeClass(severity)}`} />
                  {SEVERITY_LABELS[severity]}
                </Button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('ALL')}
            >
              Tutte le categorie
            </Button>
            {ALL_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category)}
              >
                {CATEGORY_LABELS[category]}
              </Button>
            ))}
          </div>
          <Input
            placeholder="Cerca per veicolo (targa o codice)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Segnalazioni ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                {reports.length === 0 ? 'Nessuna segnalazione presente nel registro.' : 'Nessuna segnalazione corrisponde ai filtri attivi.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelected(report)}
                  className="w-full text-left flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{report.plateOrCode}</span>
                        <span className="text-xs text-muted-foreground">{VEHICLE_TYPE_LABELS[report.vehicleType]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTime(report.reportedAt)}</p>
                      {report.notesPreview && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{report.notesPreview}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{CATEGORY_LABELS[report.category]}</Badge>
                    <Badge className={severityBadgeClass(report.severity)}>{SEVERITY_LABELS[report.severity]}</Badge>
                    {report.imagesCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Camera className="h-3.5 w-3.5" /> {report.imagesCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail */}
      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.plateOrCode}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{VEHICLE_TYPE_LABELS[selected.vehicleType]}</Badge>
                  <Badge variant="outline">{CATEGORY_LABELS[selected.category]}</Badge>
                  <Badge className={severityBadgeClass(selected.severity)}>{SEVERITY_LABELS[selected.severity]}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data segnalazione</p>
                  <p className="text-sm font-medium">{formatDateTime(selected.reportedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Note</p>
                  <p className="text-sm">{selected.notes || 'Nessuna nota disponibile.'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Immagini ({selected.imagesCount})</p>
                  {selected.images.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nessuna immagine allegata.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {selected.images.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`Allegato ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-md border bg-muted"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
