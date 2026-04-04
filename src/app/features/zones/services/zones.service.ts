import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Zone } from '../../../shared/models/zone.model';

@Injectable({ providedIn: 'root' })
export class ZonesService {
  private firestore: Firestore = inject(Firestore);
  private zonesCollection = collection(this.firestore, 'zones');

  getAllZones(): Observable<Zone[]> {
    return collectionData(query(this.zonesCollection), { idField: 'id' }) as Observable<Zone[]>;
  }

  /**
   * Returns an existing zone id (first by `order`), or creates a single default zone document.
   * Used when the app has no zones yet (e.g. zones UI not seeded) but families/import must proceed.
   */
  async getOrCreateDefaultZoneId(): Promise<string> {
    const snap = await getDocs(this.zonesCollection);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Zone));
      return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0].id;
    }
    const ref = await addDoc(this.zonesCollection, {
      nameAr: 'منطقة افتراضية',
      nameEn: 'Default zone',
      description: '',
      deacons: [],
      isHidden: false,
      order: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }
}
