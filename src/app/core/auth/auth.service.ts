import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { User, UserRole } from '../../shared/models/user.model';
import { UserPermissions, DEFAULT_PERMISSIONS } from '../../shared/models/user-permissions.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

const AUTH_STORAGE_KEY = 'Ava-Abraam-Auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  private firestore: Firestore = inject(Firestore);

  private usersCollection = collection(this.firestore, 'users');

  private currentUserDoc$ = new BehaviorSubject<User | null>(null);

  public currentUserRole = signal<UserRole | null>(null);
  public isAuthenticated = signal(false);
  public isLoading = signal(true);
  public currentUser = signal<User | null>(null);
  public permissions = signal<UserPermissions | null>(null);

  readonly currentUser$: Observable<User | null> = this.currentUserDoc$.asObservable();

  constructor() {
    this.loadFromLocalStorage();
    this.setupAuthStateListener();
    this.initializeSuperAdmin();
  }

  private async initializeSuperAdmin(): Promise<void> {
    try {
      const q = query(this.usersCollection, where('email', '==', 'admin@admin.com'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(this.usersCollection, {
          email: 'admin@admin.com',
          displayName: 'Super Administrator',
          phone: '',
          role: 'super_admin',
          assignedZoneIds: [],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('Super admin user created: admin@admin.com');
      }
    } catch (e) {
      console.error('Failed to initialize super admin:', e);
    }
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    const q = query(this.usersCollection, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { uid: docSnap.id, ...docSnap.data() } as User;
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        this.setUserData(user);
      }
    } catch (e) {
      console.error('Failed to load auth from storage:', e);
    }
  }

  private saveToLocalStorage(user: User): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save auth to storage:', e);
    }
  }

  private clearLocalStorage(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  private setupAuthStateListener(): void {
    onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      this.isLoading.set(true);

      if (firebaseUser) {
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser) as User;
            this.setUserData(user);
          } catch {
            this.clearUserState();
          }
        } else {
          try {
            const userDoc = await this.getUserByEmail(firebaseUser.email || '');
            if (userDoc) {
              this.setUserData(userDoc);
              this.saveToLocalStorage(userDoc);
            } else {
              this.clearUserState();
            }
          } catch {
            this.clearUserState();
          }
        }
      } else {
        this.clearUserState();
      }

      this.isLoading.set(false);
    });
  }

  private setUserData(user: User): void {
    this.currentUserDoc$.next(user);
    this.currentUser.set(user);
    this.currentUserRole.set(user.role);
    const perms = DEFAULT_PERMISSIONS[user.role] ?? DEFAULT_PERMISSIONS['viewer'];
    this.permissions.set(perms);
    this.isAuthenticated.set(true);
  }

  private clearUserState(): void {
    this.currentUserDoc$.next(null);
    this.currentUser.set(null);
    this.currentUserRole.set(null);
    this.permissions.set(null);
    this.isAuthenticated.set(false);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    this.isLoading.set(true);

    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      const userDoc = await this.getUserByEmail(email);

      if (!userDoc) {
        await signOut(this.auth);
        return { success: false, error: 'USER_NOT_FOUND' };
      }

      if (!userDoc.isActive) {
        await signOut(this.auth);
        return { success: false, error: 'USER_INACTIVE' };
      }

      this.setUserData(userDoc);
      this.saveToLocalStorage(userDoc);
      this.navigateBasedOnRole(userDoc.role);

      return { success: true, user: userDoc };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { success: false, error: this.getAuthErrorMessage(error.code) };
    } finally {
      this.isLoading.set(false);
    }
  }

  private navigateBasedOnRole(role: UserRole): void {
    switch (role) {
      case 'super_admin':
        this.router.navigate(['/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/dashboard']);
        break;
      case 'viewer':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'AUTH_USER_NOT_FOUND';
      case 'auth/wrong-password':
        return 'AUTH_WRONG_PASSWORD';
      case 'auth/invalid-email':
        return 'AUTH_INVALID_EMAIL';
      case 'auth/too-many-requests':
        return 'AUTH_TOO_MANY_REQUESTS';
      case 'auth/invalid-credential':
        return 'AUTH_INVALID_CREDENTIAL';
      case 'auth/network-request-failed':
        return 'AUTH_NETWORK_ERROR';
      default:
        return 'AUTH_GENERIC_ERROR';
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearUserState();
      this.clearLocalStorage();
      this.router.navigate(['/auth/login']);
    }
  }

  hasPermission(permission: keyof UserPermissions): boolean {
    const perms = this.permissions();
    return perms ? perms[permission] : false;
  }

  hasAnyPermission(permissions: (keyof UserPermissions)[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  hasAllPermissions(permissions: (keyof UserPermissions)[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  isSuperAdmin(): boolean {
    return this.currentUserRole() === 'super_admin';
  }

  isAdmin(): boolean {
    const role = this.currentUserRole();
    return role === 'super_admin' || role === 'admin';
  }
}
