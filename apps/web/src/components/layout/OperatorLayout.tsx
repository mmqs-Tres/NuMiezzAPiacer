'use client';

import { useCurrentUser } from '@/lib/use-current-user';
import { useAppStore } from '@/stores/app.store';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Map, PenTool, Radio } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function OperatorLayout({ children }: { readonly children: React.ReactNode }) {
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

  if (user?.role !== 'OPERATOR') {
    return null; // Handled by page guard
  }

  const navItems = [
    { name: 'Mappa flotta', href: '/operator', icon: Map, active: pathname === '/operator', disabled: false },
    { name: 'Registro guasti', href: '/operator/guasti', icon: PenTool, active: pathname === '/operator/guasti', disabled: false },
    { name: 'Blocco remoto', href: '/operator/blocco', icon: Radio, active: pathname === '/operator/blocco', disabled: false },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/30">
      {/* Topbar */}
      <header className="safe-top sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold leading-none">Centro Operativo</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Operatore {user.city ? `- ${user.city}` : ''}
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
      <div className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-6">
          {/* Navigation Sidebar */}
          <aside className="space-y-4">
            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.disabled ? '#' : item.href}
                    onClick={(e) => item.disabled && e.preventDefault()}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all min-w-max",
                      item.active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
                      item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Page Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
