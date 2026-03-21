import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'super_admin' | 'admin' | 'viewer';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  assignedZoneIds: string[]; // empty = all (super_admin)
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
