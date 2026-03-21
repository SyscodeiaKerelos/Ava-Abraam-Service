import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from '@angular/fire/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Observable } from 'rxjs';
import { User, UserRole } from '../../../shared/models/user.model';
import {
  UserPermissions,
  DEFAULT_PERMISSIONS,
} from '../../../shared/models/user-permissions.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private firestore: Firestore = inject(Firestore);
  private usersCollection = collection(this.firestore, 'users');

  public permissions = signal<UserPermissions | null>(null);

  getAllUsers(): Observable<User[]> {
    return collectionData(this.usersCollection, { idField: 'uid' }) as Observable<User[]>;
  }

  getUserById(uid: string): Observable<User | null> {
    return docData(doc(this.firestore, 'users', uid)) as Observable<User | null>;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(this.usersCollection, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return { uid: docSnap.id, ...docSnap.data() } as User;
  }

  async getUserPermissionsByEmail(email: string): Promise<UserPermissions | null> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }
    return this.getPermissionsForRole(user.role);
  }

  getPermissionsForRole(role: UserRole): UserPermissions {
    return DEFAULT_PERMISSIONS[role] ?? DEFAULT_PERMISSIONS['viewer'];
  }

  /**
   * Creates a new user in Firebase Auth using a secondary app instance.
   * This prevents the current Admin from being logged out.
   */
  async createUser(userData: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    phone?: string;
  }): Promise<{ uid: string }> {
    const secondaryAppName = `UserCreation_${Date.now()}`;
    const secondaryApp = initializeApp(environment.firebase, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. Create Auth User
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        userData.email,
        userData.password
      );

      // 2. Set Display Name
      await updateProfile(credential.user, {
        displayName: userData.displayName
      });

      return { uid: credential.user.uid };
    } finally {
      // 3. Clean up the secondary app instance
      await deleteApp(secondaryApp);
    }
  }

  async addUserDoc(uid: string, userData: Partial<User>): Promise<void> {
    const userDoc = doc(this.firestore, 'users', uid);
    await setDoc(userDoc, {
      ...userData,
      uid,
      email: userData.email?.toLowerCase(),
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  async updateUser(uid: string, userData: Partial<User>): Promise<void> {
    const userDoc = doc(this.firestore, 'users', uid);
    await updateDoc(userDoc, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteUser(uid: string): Promise<void> {
    const userDoc = doc(this.firestore, 'users', uid);
    await deleteDoc(userDoc);
  }

  async isEmailRegistered(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }
}
