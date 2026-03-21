import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { faSolidLock, faSolidEnvelope } from '@ng-icons/font-awesome/solid';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    NgIcon,
  ],
  providers: [provideIcons({ faSolidLock, faSolidEnvelope })],
  template: `
    <div
      class="rounded-3xl border border-slate-200/70 bg-white/70 p-8 text-slate-900 shadow-2xl backdrop-blur-2xl dark:border-white/15 dark:bg-slate-900/55 dark:text-slate-50"
    >
      <div class="flex flex-col items-center mb-8">
        <div
          class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30"
        >
          <ng-icon name="faSolidLock" size="2rem" class="text-white" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight">{{ 'translate_auth-login' | translate }}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          {{ 'translate_auth-subtitle' | translate }}
        </p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300 block">
            {{ 'translate_auth-email' | translate }}
          </label>
          <div class="relative w-full">
            <i
              class="pi pi-envelope absolute z-10 top-1/2 -translate-y-1/2 left-3 text-slate-400"
            ></i>
            <input
              pInputText
              type="email"
              formControlName="email"
              class="w-full pl-10 rounded-xl border-slate-200 bg-white/50 focus:bg-white dark:border-white/10 dark:bg-slate-800/50"
              [placeholder]="'translate_auth-email' | translate"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300 block">
            {{ 'translate_auth-password' | translate }}
          </label>
          <p-password
            formControlName="password"
            [toggleMask]="true"
            [feedback]="false"
            styleClass="w-full"
            inputStyleClass="w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white dark:border-white/10 dark:bg-slate-800/50"
            [placeholder]="'translate_auth-password' | translate"
          ></p-password>
        </div>

        <p-button
          type="submit"
          [label]="'translate_auth-login' | translate"
          styleClass="w-full rounded-xl py-3 font-semibold shadow-lg shadow-primary/20"
          [loading]="loading"
          [disabled]="loginForm.invalid"
        ></p-button>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    try {
      const result = await this.authService.login(email!, password!);

      if (!result.success) {
        this.showAuthError(result.error || 'AUTH_GENERIC_ERROR');
      }
    } catch (error) {
      console.error('Login failed:', error);
      this.toastService.error('Error', 'Login failed. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  private showAuthError(errorCode: string): void {
    let message = 'Login failed. Please check your credentials.';

    switch (errorCode) {
      case 'USER_NOT_FOUND':
        message = 'User not found. Please check your email or contact administrator.';
        break;
      case 'USER_INACTIVE':
        message = 'Your account is inactive. Please contact administrator.';
        break;
      case 'AUTH_USER_NOT_FOUND':
        message = 'No account found with this email address.';
        break;
      case 'AUTH_WRONG_PASSWORD':
        message = 'Incorrect password. Please try again.';
        break;
      case 'AUTH_INVALID_EMAIL':
        message = 'Please enter a valid email address.';
        break;
      case 'AUTH_TOO_MANY_REQUESTS':
        message = 'Too many attempts. Please try again later.';
        break;
      case 'AUTH_INVALID_CREDENTIAL':
        message = 'Invalid email or password.';
        break;
    }

    this.toastService.error('Login Failed', message);
  }
}
