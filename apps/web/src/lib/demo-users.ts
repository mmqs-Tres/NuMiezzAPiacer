import { UserRole } from '@mvp/contracts';

export interface DemoUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  city?: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'u1', email: 'demo@mvp.local', role: UserRole.RIDER, firstName: 'Demo', lastName: 'User', city: 'Milano' },
  { id: 'u2', email: 'flavio.demusso@mvp.local', role: UserRole.OPERATOR, firstName: 'Flavio', lastName: 'Demusso', city: 'Milano' },
  { id: 'u3', email: 'gabriele.farigu@mvp.local', role: UserRole.OPERATOR, firstName: 'Gabriele', lastName: 'Farigu', city: 'Roma' },
  { id: 'u4', email: 'marco.dipalma@mvp.local', role: UserRole.ADMIN, firstName: 'Marco', lastName: 'Di Palma', city: 'Napoli' },
  { id: 'u5', email: 'giuseppe.dicosola@mvp.local', role: UserRole.ADMIN, firstName: 'Giuseppe', lastName: 'Dicosola', city: 'Bari' },
];
