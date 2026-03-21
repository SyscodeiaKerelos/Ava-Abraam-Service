import { inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, from, map, catchError, of, timer, switchMap, first } from 'rxjs';
import { UsersService } from '../services/users.service';

/**
 * Async validator to check if an email is already registered in the system.
 */
export function emailTakenValidator(originalEmail?: string): AsyncValidatorFn {
  const usersService = inject(UsersService);

  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = control.value?.toLowerCase();

    // If empty or same as original email (in edit mode), it's valid
    if (!email || email === originalEmail?.toLowerCase()) {
      return of(null);
    }

    // Debounce the API call by 500ms using timer
    return timer(500).pipe(
      switchMap(() => from(usersService.isEmailRegistered(email))),
      map((isTaken) => (isTaken ? { emailTaken: true } : null)),
      catchError(() => of(null)),
      first()
    );
  };
}
