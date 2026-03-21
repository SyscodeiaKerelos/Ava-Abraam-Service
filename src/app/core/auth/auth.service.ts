import { Injectable, inject, signal } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { User, UserRole } from '../../shared/models/user.model';
import { Observable, of } from 'rxjs';
import { switchMap, shareReplay, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private router: Router = inject(Router);

  // Expose the current user document from Firestore
  readonly currentUser$: Observable<User | null> = user(this.auth).pipe(
    switchMap(authUser => {
      if (authUser) {
        return docData(doc(this.firestore, `users/${authUser.uid}`)) as Observable<User>;
      } else {
        return of(null);
      }
    }),
    shareReplay(1)
  );

  // Expose user role and authentication status as signals
  public currentUserRole = signal<UserRole | null>(null);
  public isAuthenticated = signal(false);

  constructor() {
    this.currentUser$.subscribe(user => {
      this.currentUserRole.set(user?.role ?? null);
      this.isAuthenticated.set(!!user);
    });
  }

  async login(email: string, password: string): Promise<any> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(['/dashboard']);
      return userCredential;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/auth/login']);
  }
}
