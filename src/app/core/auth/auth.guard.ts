import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserRole } from '../../shared/models/user.model';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (user) {
        const requiredRoles = route.data['roles'] as UserRole[] | undefined;

        if (requiredRoles && requiredRoles.length > 0) {
          if (requiredRoles.includes(user.role)) {
            return true;
          }
          router.navigate(['/dashboard']);
          return false;
        }

        return true;
      }

      router.navigate(['/auth/login']);
      return false;
    }),
  );
};

export const SuperAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (user?.role === 'super_admin') {
        return true;
      }
      router.navigate(['/dashboard']);
      return false;
    }),
  );
};

export const AdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (user?.role === 'super_admin' || user?.role === 'admin') {
        return true;
      }
      router.navigate(['/dashboard']);
      return false;
    }),
  );
};

export const GuestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (!user) {
        return true;
      }

      const role = authService.currentUserRole();
      if (role === 'super_admin') {
        router.navigate(['/users']);
      } else {
        router.navigate(['/dashboard']);
      }
      return false;
    }),
  );
};
