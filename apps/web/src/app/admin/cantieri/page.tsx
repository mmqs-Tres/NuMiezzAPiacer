import { WorkZonesPage } from '@/slices/WorkZones/WorkZones.page';

export const metadata = {
  title: 'Aree cantiere (Geofence) — PA',
  description: 'Crea e gestisci aree cantiere per bloccare la riconsegna al loro interno.',
};

export default function CantieriPage() {
  return <WorkZonesPage />;
}
