'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/use-current-user';
import { UserRole } from '@mvp/contracts';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Construction } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && user.role !== UserRole.ADMIN) {
      router.push('/');
    }
  }, [user, router, mounted]);

  if (!mounted || !user || user.role !== UserRole.ADMIN) {
    return null; // Don't render anything while redirecting or mounting
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Benvenuto/a</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Panoramica della mobilità urbana condivisa per il tuo ente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/analisi-corse" className="block hover:no-underline">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Analisi corse
                  </CardTitle>
                </div>
                <CardDescription>
                  Numero giornaliero di corse avviate, suddivise per tipologia di veicolo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitora l&apos;andamento giornaliero delle corse per tipo di veicolo,
                  utile a monitorare l&apos;uso della mobilità condivisa in città.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/cantieri" className="block hover:no-underline">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Construction className="h-4 w-4 text-orange-500" />
                    Aree cantiere (Geofence)
                  </CardTitle>
                </div>
                <CardDescription>
                  Gestione delle aree cantiere e impedimento di fine corsa al loro interno.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Delimita aree di cantiere stradale: i noleggi non potranno
                  essere conclusi al loro interno.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
