'use client';

import { useState, useRef, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useWorkZones } from './WorkZones.hook';
import { Coordinates, WorkZone } from '@mvp/contracts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Construction,
  MapPin,
  Trash2,
  Undo2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Map,
} from 'lucide-react';

// ----------------------------
// Bounds della mappa schematica (area Milano)
// Corrisponde all'area dei veicoli seed
// ----------------------------
const MAP_BOUNDS = {
  minLat: 45.455,
  maxLat: 45.480,
  minLng: 9.175,
  maxLng: 9.200,
};

/** Converte coordinate geo → pixel sulla mappa schematica */
function geoToPixel(
  coord: Coordinates,
  mapW: number,
  mapH: number
): { x: number; y: number } {
  const x = ((coord.lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * mapW;
  const y = (1 - (coord.lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * mapH;
  return { x, y };
}

/** Converte click pixel → coordinate geo */
function pixelToGeo(
  px: number,
  py: number,
  mapW: number,
  mapH: number
): Coordinates {
  const lng = MAP_BOUNDS.minLng + (px / mapW) * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  const lat = MAP_BOUNDS.minLat + (1 - py / mapH) * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
  return { lat: Math.round(lat * 100000) / 100000, lng: Math.round(lng * 100000) / 100000 };
}

// ----------------------------
// Componente mappa schematica
// ----------------------------
interface SchematicMapProps {
  polygon: Coordinates[];
  existingZones: WorkZone[];
  onAddVertex: (coord: Coordinates) => void;
  mapW: number;
  mapH: number;
}

function SchematicMap({ polygon, existingZones, onAddVertex, mapW, mapH }: SchematicMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      // Scala per adattarsi al viewBox
      const scaledX = (px / rect.width) * mapW;
      const scaledY = (py / rect.height) * mapH;
      onAddVertex(pixelToGeo(scaledX, scaledY, mapW, mapH));
    },
    [onAddVertex, mapW, mapH]
  );

  const polygonPoints = polygon.map((c) => {
    const { x, y } = geoToPixel(c, mapW, mapH);
    return `${x},${y}`;
  });

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${mapW} ${mapH}`}
      className="w-full border rounded-lg cursor-crosshair bg-slate-900"
      style={{ aspectRatio: `${mapW}/${mapH}`, maxHeight: 340 }}
      onClick={handleClick}
    >
      {/* Griglia */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={mapW} height={mapH} fill="url(#grid)" />

      {/* Label area */}
      <text x="8" y="18" fill="#475569" fontSize="10" fontFamily="monospace">
        Milano — mappa schematica
      </text>
      <text x={mapW - 8} y={mapH - 6} fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">
        {MAP_BOUNDS.minLat.toFixed(3)}°N {MAP_BOUNDS.minLng.toFixed(3)}°E → {MAP_BOUNDS.maxLat.toFixed(3)}°N {MAP_BOUNDS.maxLng.toFixed(3)}°E
      </text>

      {/* Cantieri esistenti (sfondo) */}
      {existingZones.map((zone) => {
        if (zone.polygon.length < 3) return null;
        const pts = zone.polygon.map((c) => {
          const { x, y } = geoToPixel(c, mapW, mapH);
          return `${x},${y}`;
        });
        return (
          <g key={zone.id}>
            <polygon
              points={pts.join(' ')}
              fill="rgba(239,68,68,0.15)"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4,2"
            />
            {/* Label zona */}
            {(() => {
              const cx = zone.polygon.reduce((s, c) => s + c.lng, 0) / zone.polygon.length;
              const cy = zone.polygon.reduce((s, c) => s + c.lat, 0) / zone.polygon.length;
              const { x, y } = geoToPixel({ lat: cy, lng: cx }, mapW, mapH);
              return (
                <text x={x} y={y} textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="monospace">
                  {zone.name.slice(0, 20)}
                </text>
              );
            })()}
          </g>
        );
      })}

      {/* Poligono in costruzione */}
      {polygon.length >= 2 && (
        <polyline
          points={polygonPoints.join(' ')}
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {polygon.length >= 3 && (
        <>
          <polygon
            points={polygonPoints.join(' ')}
            fill="rgba(249,115,22,0.2)"
            stroke="#f97316"
            strokeWidth="2"
          />
          {/* Linea di chiusura punteggiata */}
          <line
            x1={geoToPixel(polygon[polygon.length - 1]!, mapW, mapH).x}
            y1={geoToPixel(polygon[polygon.length - 1]!, mapW, mapH).y}
            x2={geoToPixel(polygon[0]!, mapW, mapH).x}
            y2={geoToPixel(polygon[0]!, mapW, mapH).y}
            stroke="#f97316"
            strokeWidth="1.5"
            strokeDasharray="5,3"
            opacity="0.6"
          />
        </>
      )}

      {/* Vertici del poligono in costruzione */}
      {polygon.map((c, i) => {
        const { x, y } = geoToPixel(c, mapW, mapH);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill="#f97316" stroke="white" strokeWidth="1.5" />
            <text x={x + 7} y={y + 4} fill="#fdba74" fontSize="9" fontFamily="monospace">
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Hint clic */}
      {polygon.length === 0 && (
        <text x={mapW / 2} y={mapH / 2} textAnchor="middle" fill="#475569" fontSize="12" fontFamily="sans-serif">
          Clicca per aggiungere il primo vertice
        </text>
      )}
    </svg>
  );
}

// ----------------------------
// Componente card cantiere
// ----------------------------
function WorkZoneCard({ zone }: { zone: WorkZone }) {
  const createdAt = zone.createdAt ? new Date(zone.createdAt) : null;
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Construction className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="truncate">{zone.name}</span>
          </CardTitle>
          <Badge
            variant={zone.active ? 'default' : 'secondary'}
            className={zone.active ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' : ''}
          >
            {zone.active ? 'Attivo' : 'Inattivo'}
          </Badge>
        </div>
        {zone.notes && (
          <CardDescription className="text-xs mt-1 line-clamp-2">{zone.notes}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {zone.polygon.length} vertici
          </span>
          {createdAt && (
            <span>Creato il {createdAt.toLocaleDateString('it-IT')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------
// Pagina principale
// ----------------------------
const MAP_W = 600;
const MAP_H = 360;

export function WorkZonesPage() {
  const { zones, isLoading, listError, refetch, createWorkZone, isPending, createError } =
    useWorkZones();

  const [polygon, setPolygon] = useState<Coordinates[]>([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddVertex = useCallback((coord: Coordinates) => {
    setPolygon((prev) => [...prev, coord]);
    setSuccessMsg(null);
  }, []);

  const handleUndo = () => setPolygon((prev) => prev.slice(0, -1));
  const handleClear = () => setPolygon([]);

  const canCreate = name.trim().length > 0 && polygon.length >= 3 && !isPending;

  const handleCreate = async () => {
    if (!canCreate) return;
    try {
      await createWorkZone({ name: name.trim(), polygon, notes: notes.trim() || undefined });
      setName('');
      setNotes('');
      setPolygon([]);
      setSuccessMsg('Cantiere creato con successo!');
    } catch {
      // errore gestito da createError
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Intestazione */}
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Construction className="h-5 w-5 text-orange-500" />
            Aree cantiere (Geofence)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Segnala cantieri stradali e blocca la riconsegna al loro interno.
          </p>
        </div>

        {/* Form di creazione */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" />
              Disegna un nuovo cantiere
            </CardTitle>
            <CardDescription>
              Clicca sulla mappa per aggiungere i vertici del poligono (minimo 3). Poi compila il nome e salva.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mappa schematica */}
            <SchematicMap
              polygon={polygon}
              existingZones={zones}
              onAddVertex={handleAddVertex}
              mapW={MAP_W}
              mapH={MAP_H}
            />

            {/* Azioni poligono */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {polygon.length === 0
                  ? 'Nessun vertice aggiunto'
                  : `${polygon.length} ${polygon.length === 1 ? 'vertice' : 'vertici'} — ${polygon.length < 3 ? `ancora ${3 - polygon.length} necessari` : 'poligono valido ✓'}`}
              </span>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={polygon.length === 0}
                  title="Annulla ultimo vertice"
                >
                  <Undo2 className="h-3.5 w-3.5 mr-1" />
                  Annulla
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={polygon.length === 0}
                  title="Pulisci poligono"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Pulisci
                </Button>
              </div>
            </div>

            {/* Form nome + note */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cantiere-name">Nome cantiere *</Label>
                <Input
                  id="cantiere-name"
                  placeholder="es. Cantiere Corso Buenos Aires"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cantiere-notes">Note (opzionale)</Label>
                <Textarea
                  id="cantiere-notes"
                  placeholder="Descrizione o motivazione del cantiere"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isPending}
                  rows={2}
                />
              </div>
            </div>

            {/* Riepilogo e azione */}
            <div className="flex flex-wrap items-center gap-3">
              {polygon.length >= 3 && name.trim() && (
                <span className="text-xs text-muted-foreground">
                  Poligono: {polygon.length} vertici · Cantiere attivo di default
                </span>
              )}
              <Button
                id="btn-crea-cantiere"
                className="ml-auto bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleCreate}
                disabled={!canCreate}
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea cantiere
                  </>
                )}
              </Button>
            </div>

            {/* Feedback */}
            {successMsg && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-md px-3 py-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}
            {createError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {createError.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Elenco cantieri */}
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            Cantieri registrati
            {!isLoading && (
              <Badge variant="secondary" className="font-normal">
                {zones.length}
              </Badge>
            )}
          </h2>

          {isLoading && (
            <div className="grid gap-3 sm:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          )}

          {listError && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{listError.message}</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto h-7">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Riprova
              </Button>
            </div>
          )}

          {!isLoading && !listError && zones.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
              <Construction className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nessun cantiere registrato.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Disegna il primo poligono sulla mappa qui sopra.
              </p>
            </div>
          )}

          {!isLoading && zones.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {zones.map((zone) => (
                <WorkZoneCard key={zone.id} zone={zone} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
