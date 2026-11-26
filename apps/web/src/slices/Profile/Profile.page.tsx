'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CreditCard, Mail, Shield, Calendar, LogOut } from 'lucide-react';
import { UserRole } from '@mvp/contracts';
import { useProfile } from './Profile.hook';
import { useAppStore, DEFAULT_USER_ID } from '@/stores/app.store';

function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.RIDER]: 'Rider',
    [UserRole.OPERATOR]: 'Operatore',
    [UserRole.ADMIN]: 'Admin',
  };
  return labels[role] ?? role;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

export function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setCurrentUserId = useAppStore((s) => s.setCurrentUserId);
  const clearSession = useAppStore((s) => s.clearSession);
  const { profile, isLoading, error } = useProfile();

  function handleLogout() {
    clearSession();
    setCurrentUserId('');
    queryClient.clear();
    router.push('/login');
  }

  return (
    <AppLayout title="Profilo">
      <div className="p-4 space-y-4">
        {isLoading && <ProfileSkeleton />}

        {!isLoading && error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Impossibile caricare il profilo. Riprova.
            </p>
          </div>
        )}

        {!isLoading && !error && profile && (
          <>
            {/* Demo banner */}
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Account demo
            </div>

            {/* Profile card */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                    {profile.firstName ? profile.firstName.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : profile.email}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {roleLabel(profile.role)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Email</span>
                    <span className="ml-auto font-medium truncate max-w-[55%]">{profile.email}</span>
                  </div>
                  {profile.firstName && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-4 h-4 shrink-0" />
                      <span className="text-muted-foreground">Nome</span>
                      <span className="ml-auto font-medium truncate">{profile.firstName}</span>
                    </div>
                  )}
                  {profile.lastName && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-4 h-4 shrink-0" />
                      <span className="text-muted-foreground">Cognome</span>
                      <span className="ml-auto font-medium truncate">{profile.lastName}</span>
                    </div>
                  )}
                  {profile.city && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-4 h-4 shrink-0" />
                      <span className="text-muted-foreground">Città</span>
                      <span className="ml-auto font-medium truncate">{profile.city}</span>
                    </div>
                  )}
                  {profile.arcBorn && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Data di Nascita</span>
                      <span className="ml-auto font-medium">{formatDate(profile.arcBorn)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Registrato</span>
                    <span className="ml-auto font-medium">{formatDate(profile.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments placeholder */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagamenti
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground">
                  Gestione metodi di pagamento non ancora disponibile in questa versione demo.
                </p>
              </CardContent>
            </Card>

            <Button variant="destructive" className="w-full" size="lg" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
