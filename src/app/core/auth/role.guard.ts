import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserRole } from '../../shared/models/user.model';

export const RoleGuard = (allowedRoles: UserRole[]) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && allowedRoles.includes(user.role)) {
        return true;
      } else {
        // Redirect to dashboard or an 'unauthorized' page if the user is logged in but has the wrong role
        router.navigate(['/dashboard']);
        return false;
      }
    })
  );
};
