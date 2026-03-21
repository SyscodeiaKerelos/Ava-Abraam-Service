import { Timestamp } from '@angular/fire/firestore';

export interface Family {
  id: string;
  zoneId: string;
  index: number;
  husbandName: string;
  wifeName: string;
  familyCode: string | null;
  phone: string;
  monthlyAid: 'ش' | 'س' | null;
  bagSize: 'large' | 'small' | null;
  familySize: number;
  educationAid: number | null;
  notes: string[]; // Array of noteTags IDs
  isDeceased: boolean;
  isHidden: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}
