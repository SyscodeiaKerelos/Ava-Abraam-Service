import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { NoteTag } from '../models/note-tag.model';

@Injectable({ providedIn: 'root' })
export class NoteTagsService {
  private firestore = inject(Firestore);
  private noteTagsCol = collection(this.firestore, 'noteTags');

  /** Sorted client-side to avoid composite index on `noteTags`. */
  getAllOrdered(): Observable<NoteTag[]> {
    return collectionData(this.noteTagsCol, { idField: 'id' }).pipe(
      map((tags) => (tags as NoteTag[]).slice().sort((a, b) => a.order - b.order)),
    );
  }
}
