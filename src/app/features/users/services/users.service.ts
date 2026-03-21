import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  setDoc,
  updateDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { User } from '../../shared/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private firestore: Firestore = inject(Firestore);
  private functions: Functions = inject(Functions);
  private usersCollection = collection(this.firestore, 'users');

  getUsers(): Observable<User[]> {
    return collectionData(this.usersCollection, { idField: 'uid' }) as Observable<User[]>;
  }

  async addUser(userData: { email: string, password: string, displayName: string, role: string }): Promise<any> {
    // For security, user creation should be handled by a Cloud Function
    // that validates the request came from an authenticated admin.
    const createUser = httpsCallable(this.functions, 'createUser');
    return createUser(userData);
  }

  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return updateDoc(userDocRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }
}
