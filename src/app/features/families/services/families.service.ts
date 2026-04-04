import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  collectionData,
  docData,
  updateDoc,
  addDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Family } from '../../../shared/models/family.model';
import type { ParsedFamilyRow } from '../../../shared/excel/excel-zone-sheet.types';

/** Payload for create/update from the family form (no timestamps or index on create). */
export interface FamilyFormPayload {
  zoneId: string;
  husbandName: string;
  wifeName: string;
  familyCode: string | null;
  phone: string;
  monthlyAid: 'ش' | 'س' | null;
  bagSize: 'large' | 'small' | null;
  familySize: number;
  educationAid: number | null;
  notes: string[];
  isDeceased: boolean;
  isHidden: boolean;
}

@Injectable({ providedIn: 'root' })
export class FamiliesService {
  private firestore = inject(Firestore);
  private familiesCol = collection(this.firestore, 'families');

  getFamiliesByZone(zoneId: string): Observable<Family[]> {
    const q = query(this.familiesCol, where('zoneId', '==', zoneId));
    return collectionData(q, { idField: 'id' }).pipe(
      map((rows) =>
        (rows as Family[]).slice().sort((a, b) => a.index - b.index),
      ),
    );
  }

  async getFamiliesByZoneOnce(zoneId: string): Promise<Family[]> {
    const q = query(this.familiesCol, where('zoneId', '==', zoneId));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Family));
    return list.sort((a, b) => a.index - b.index);
  }

  getFamilyById(id: string): Observable<Family | null> {
    return (docData(doc(this.firestore, 'families', id), { idField: 'id' }) as Observable<
      Family | undefined
    >).pipe(map((row) => (row ? row : null)));
  }

  async getNextIndexForZone(zoneId: string): Promise<number> {
    const families = await this.getFamiliesByZoneOnce(zoneId);
    if (families.length === 0) {
      return 1;
    }
    return Math.max(...families.map((f) => f.index)) + 1;
  }

  async createFamily(payload: FamilyFormPayload, uid: string): Promise<string> {
    const index = await this.getNextIndexForZone(payload.zoneId);
    const docRef = await addDoc(this.familiesCol, {
      zoneId: payload.zoneId,
      index,
      husbandName: payload.husbandName.trim(),
      wifeName: payload.wifeName.trim(),
      familyCode: payload.familyCode?.trim() ? payload.familyCode.trim() : null,
      phone: payload.phone,
      monthlyAid: payload.monthlyAid,
      bagSize: payload.bagSize,
      familySize: payload.familySize,
      educationAid: payload.educationAid,
      notes: payload.notes,
      isDeceased: payload.isDeceased,
      isHidden: payload.isHidden,
      createdAt: serverTimestamp(),
      createdBy: uid,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
    return docRef.id;
  }

  async updateFamily(id: string, payload: FamilyFormPayload, uid: string): Promise<void> {
    const ref = doc(this.firestore, 'families', id);
    await updateDoc(ref, {
      husbandName: payload.husbandName.trim(),
      wifeName: payload.wifeName.trim(),
      familyCode: payload.familyCode?.trim() ? payload.familyCode.trim() : null,
      phone: payload.phone,
      monthlyAid: payload.monthlyAid,
      bagSize: payload.bagSize,
      familySize: payload.familySize,
      educationAid: payload.educationAid,
      notes: payload.notes,
      isDeceased: payload.isDeceased,
      isHidden: payload.isHidden,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  }

  /**
   * Upserts families in zone keyed by `index` (row م). Batched writes (max 400 ops per batch).
   */
  async importParsedRows(
    zoneId: string,
    rows: ParsedFamilyRow[],
    noteIdsForRow: (row: ParsedFamilyRow) => string[],
    uid: string,
    options: { writeEducationAid: boolean; skipRowsWithoutWife: boolean },
  ): Promise<{ written: number; skipped: number }> {
    const existing = await this.getFamiliesByZoneOnce(zoneId);
    const byIndex = new Map<number, string>();
    for (const f of existing) {
      byIndex.set(f.index, f.id);
    }

    const byRowIndex = new Map<number, ParsedFamilyRow>();
    for (const row of rows) {
      byRowIndex.set(row.index, row);
    }
    const uniqueRows = [...byRowIndex.values()].sort((a, b) => a.index - b.index);

    let written = 0;
    let skipped = 0;

    const ops: {
      type: 'set' | 'update';
      ref: ReturnType<typeof doc>;
      data: Record<string, unknown>;
    }[] = [];

    for (const row of uniqueRows) {
      if (options.skipRowsWithoutWife && !row.wifeName.trim()) {
        skipped++;
        continue;
      }

      const notes = noteIdsForRow(row);
      const educationAid =
        options.writeEducationAid && row.educationAid != null ? row.educationAid : null;

      const payload: Record<string, unknown> = {
        zoneId,
        index: row.index,
        husbandName: row.husbandName,
        wifeName: row.wifeName,
        familyCode: row.familyCode,
        phone: row.phone,
        monthlyAid: row.monthlyAid,
        bagSize: null,
        familySize: row.familySize,
        educationAid,
        notes,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      };

      const existingId = byIndex.get(row.index);
      if (existingId) {
        ops.push({
          type: 'update',
          ref: doc(this.firestore, 'families', existingId),
          data: payload,
        });
      } else {
        ops.push({
          type: 'set',
          ref: doc(this.familiesCol),
          data: {
            ...payload,
            isDeceased: false,
            isHidden: false,
            createdAt: serverTimestamp(),
            createdBy: uid,
          },
        });
      }
    }

    const chunkSize = 400;
    for (let i = 0; i < ops.length; i += chunkSize) {
      const chunk = ops.slice(i, i + chunkSize);
      const batch = writeBatch(this.firestore);
      for (const op of chunk) {
        if (op.type === 'update') {
          batch.update(op.ref, op.data);
        } else {
          batch.set(op.ref, op.data);
        }
      }
      await batch.commit();
      written += chunk.length;
    }

    return { written, skipped };
  }
}
