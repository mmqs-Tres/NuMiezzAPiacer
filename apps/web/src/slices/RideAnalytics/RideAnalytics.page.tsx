'use client';

import { useState } from 'react';
import { VehicleType, DailyRidesByType } from '@mvp/contracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRideAnalytics } from './RideAnalytics.hook';
import { RangePreset, RANGE_PRESETS } from './RideAnalytics.types';

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  [VehicleType.SCOOTER]: 'Scooter',
  [VehicleType.BIKE]: 'Bici',
  [VehicleType.MOPED]: 'Moped',
  [VehicleType.CAR]: 'Auto',
};

const VEHICLE_TYPE_COLORS: Record<VehicleType, string> = {
  [VehicleType.SCOOTER]: 'bg-blue-500',
  [VehicleType.BIKE]: 'bg-green-500',
  [VehicleType.MOPED]: 'bg-amber-500',
  [VehicleType.CAR]: 'bg-purple-500',
};

const VEHICLE_TYPES = Object.values(VehicleType);

function formatDayLabel(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

export function RideAnalyticsPage() {
  const [preset, setPreset] = useState<RangePreset>(7);
  const { data, isLoading, error, refetch } = useRideAnalytics(preset);

  const days: DailyRidesByType[] = data?.days ?? [];
  const total = days.reduce((sum, d) => sum + d.total, 0);
  const totalsByType = VEHICLE_TYPES.reduce((acc, type) => {
    acc[type] = days.reduce((sum, d) => sum + (d.countsByType[type] ?? 0), 0);
    return acc;
  }, {} as Record<VehicleType, number>);

  const maxTotal = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Analisi corse</h1>
        <p className="text-sm text-muted-foreground mt-1">Corse avviate per tipologia di veicolo</p>
      </div>

      <div className="flex items-center gap-2">
        {RANGE_PRESETS.map((p) => (
          <Button key={p} variant={p === preset ? 'default' : 'outline'} size="sm" onClick={() => setPreset(p)}>
            {p} giorni
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {error && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Errore nel caricamento dei dati: {error.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Riprova
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riepilogo intervallo</CardTitle>
              <CardDescription>
                {data?.from} – {data?.to}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="default">Totale: {total}</Badge>
              {VEHICLE_TYPES.map((type) => (
                <Badge key={type} variant="secondary">
                  {VEHICLE_TYPE_LABELS[type]}: {totalsByType[type]}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {total === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nessuna corsa avviata nell&apos;intervallo selezionato.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Corse giornaliere</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                  {days.map((day) => (
                    <div key={day.date} className="flex flex-col items-center gap-1 min-w-[2.5rem]">
                      <div className="flex flex-col-reverse w-6 bg-muted rounded-sm overflow-hidden" style={{ height: '160px' }}>
                        {day.total > 0 ? (
                          VEHICLE_TYPES.map((type) => {
                            const count = day.countsByType[type] ?? 0;
                            if (count === 0) return null;
                            return (
                              <div
                                key={type}
                                className={VEHICLE_TYPE_COLORS[type]}
                                style={{ height: `${(count / maxTotal) * 160}px` }}
                                title={`${VEHICLE_TYPE_LABELS[type]}: ${count}`}
                              />
                            );
                          })
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDayLabel(day.date)}</span>
                      <span className="text-xs font-medium">{day.total}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                  {VEHICLE_TYPES.map((type) => (
                    <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`h-3 w-3 rounded-sm ${VEHICLE_TYPE_COLORS[type]}`} />
                      {VEHICLE_TYPE_LABELS[type]}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dettaglio giornaliero</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Giorno</th>
                    {VEHICLE_TYPES.map((type) => (
                      <th key={type} className="py-2 pr-4 font-medium text-right">
                        {VEHICLE_TYPE_LABELS[type]}
                      </th>
                    ))}
                    <th className="py-2 pr-4 font-medium text-right">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.date} className="border-b last:border-0">
                      <td className="py-2 pr-4">{formatDayLabel(day.date)}</td>
                      {VEHICLE_TYPES.map((type) => (
                        <td key={type} className="py-2 pr-4 text-right">
                          {day.countsByType[type] ?? 0}
                        </td>
                      ))}
                      <td className="py-2 pr-4 text-right font-medium">{day.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
