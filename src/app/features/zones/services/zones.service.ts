import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Zone } from '../../../shared/models/zone.model';

@Injectable()
export class ZonesService {
  private firestore: Firestore = inject(Firestore);
  private zonesCollection = collection(this.firestore, 'zones');

  getAllZones(): Observable<Zone[]> {
    return collectionData(query(this.zonesCollection), { idField: 'id' }) as Observable<Zone[]>;
  }
}
