'use client';

import { useCurrentUser } from '@/lib/use-current-user';
import { useAppStore } from '@/stores/app.store';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Landmark, BarChart3, Construction } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

export function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const clearSession = useAppStore((s) => s.clearSession);
  const setCurrentUserId = useAppStore((s) => s.setCurrentUserId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearSession();
    setCurrentUserId('');
    router.push('/login');
  };

  if (!mounted) return null;

  if (user?.role !== 'ADMIN') {
    return null; // Handled by page guard
  }

  const navItems = [
    { name: 'Panoramica', href: '/admin', icon: Landmark, active: pathname === '/admin', disabled: false },
    {
      name: 'Analisi corse',
      href: '/admin/analisi-corse',
      icon: BarChart3,
      active: pathname === '/admin/analisi-corse',
      disabled: false,
    },
    {
      name: 'Aree cantiere (Geofence)',
      href: '/admin/cantieri',
      icon: Construction,
      active: pathname === '/admin/cantieri',
      disabled: false,
    },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/30">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <div className="leading-none">
              <p className="text-sm font-semibold">Pannello Pubblica Amministrazione</p>
              <p className="text-xs text-muted-foreground">Mobilità urbana</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ente convenzionato {user.city ? `- ${user.city}` : ''}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Cambia account">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 container mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Navigation Sidebar */}
          <aside className="space-y-2">
            <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.disabled ? '#' : item.href}
                    onClick={(e) => item.disabled && e.preventDefault()}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all min-w-max',
                      item.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground',
                      item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </span>
                    {item.disabled && (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        Presto
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Page Content */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
