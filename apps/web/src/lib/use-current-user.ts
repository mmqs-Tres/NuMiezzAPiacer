import { useAppStore } from '@/stores/app.store';
import { DEMO_USERS, DemoUser } from './demo-users';

export function useCurrentUser(): DemoUser | undefined {
  const currentUserId = useAppStore((s) => s.currentUserId);
  return DEMO_USERS.find((u) => u.id === currentUserId);
}
