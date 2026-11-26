'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, LogIn } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { UserRole } from '@mvp/contracts';
import { DEMO_USERS } from '@/lib/demo-users';

export function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setCurrentUserId = useAppStore((s) => s.setCurrentUserId);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      setError('Inserisci email e password.');
      return;
    }

    const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user || password !== 'password') {
      setError('Credenziali non valide. Controlla email e password.');
      return;
    }

    setError(null);
    setCurrentUserId(user.id);
    queryClient.clear();
    
    if (user.role === UserRole.OPERATOR) {
      router.push('/operator');
    } else if (user.role === UserRole.ADMIN) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  }

  return (
    <AppLayout title="Accedi">
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <h1 className="text-lg font-semibold">Bentornato</h1>
              <p className="text-sm text-muted-foreground">Accedi al tuo account per continuare</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg">
                <LogIn className="h-4 w-4 mr-2" />
                Accedi
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
