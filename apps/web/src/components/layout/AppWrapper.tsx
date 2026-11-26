'use client';

import { usePathname } from 'next/navigation';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDesktopRoute = pathname?.startsWith('/operator') || pathname?.startsWith('/admin');

  if (isDesktopRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-muted/30">
      <div className="relative flex w-full max-w-mobile flex-col bg-background shadow-xl min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
