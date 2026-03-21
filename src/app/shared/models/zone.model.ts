import { Timestamp } from '@angular/fire/firestore';

export interface Zone {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  deacons: string[];
  isHidden: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
