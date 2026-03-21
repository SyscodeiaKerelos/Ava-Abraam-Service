import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  faSolidUser,
  faSolidEnvelope,
  faSolidLock,
  faSolidPhone,
  faSolidShield,
  faSolidMapPin,
} from '@ng-icons/font-awesome/solid';
import { User, UserRole } from '../../../shared/models/user.model';
import { ZonesService } from '../../zones/services/zones.service';
import { TranslateService } from '@ngx-translate/core';
import { emailTakenValidator } from './email-taken.validator';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgIcon],
  providers: [
    provideIcons({
      faSolidUser,
      faSolidEnvelope,
      faSolidLock,
      faSolidPhone,
      faSolidShield,
      faSolidMapPin,
    }),
    ZonesService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSave()" class="space-y-4">
      <div class="space-y-2">
        <label
          class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
        >
          <ng-icon name="faSolidUser" size="0.875rem" />
          {{ 'translate_user-name' | translate }}
        </label>
        <input
          type="text"
          formControlName="displayName"
          [placeholder]="'translate_user-name' | translate"
          class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        @if (userForm.get('displayName')?.invalid && userForm.get('displayName')?.touched) {
          <p class="text-xs text-red-500">{{ 'translate_errors-required' | translate }}</p>
        }
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
        >
          <ng-icon name="faSolidEnvelope" size="0.875rem" />
          {{ 'translate_auth-email' | translate }}
        </label>
        <input
          type="email"
          formControlName="email"
          [placeholder]="'translate_auth-email' | translate"
          class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {
          @if (userForm.get('email')?.errors?.['required']) {
            <p class="text-xs text-red-500">{{ 'translate_errors-required' | translate }}</p>
          } @else if (userForm.get('email')?.errors?.['email']) {
            <p class="text-xs text-red-500">{{ 'translate_errors-invalid-email' | translate }}</p>
          } @else if (userForm.get('email')?.errors?.['emailTaken']) {
            <p class="text-xs text-red-500">{{ 'Email is already taken' | translate }}</p>
          }
        }
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
        >
          <ng-icon name="faSolidPhone" size="0.875rem" />
          {{ 'translate_user-phone' | translate }}
        </label>
        <input
          type="tel"
          formControlName="phone"
          [placeholder]="'translate_user-phone' | translate"
          class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
        >
          <ng-icon name="faSolidMapPin" size="0.875rem" />
          {{ 'translate_zone-name' | translate }} ({{ 'translate_common-optional' | translate }})
        </label>
        <select
          formControlName="assignedZoneId"
          class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        >
          <option value="">{{ 'translate_select-zone' | translate }}</option>
          @for (zone of zones(); track zone.id) {
            <option [value]="zone.id">{{ getZoneName(zone) }}</option>
          }
        </select>
      </div>

      @if (isNewUser()) {
        <div class="space-y-2">
          <label
            class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
          >
            <ng-icon name="faSolidLock" size="0.875rem" />
            {{ 'translate_auth-password' | translate }}
          </label>
          <input
            type="password"
            formControlName="password"
            [placeholder]="'translate_auth-password' | translate"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          @if (userForm.get('password')?.invalid && userForm.get('password')?.touched) {
            <p class="text-xs text-red-500">{{ 'translate_errors-min-chars' | translate }}</p>
          }
        </div>
      }

      <div class="space-y-2">
        <label
          class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
        >
          <ng-icon name="faSolidShield" size="0.875rem" />
          {{ 'translate_user-role' | translate }}
        </label>
        <div class="grid grid-cols-3 gap-2">
          @for (role of roleOptions; track role.value) {
            <button
              type="button"
              (click)="selectRole(role.value)"
              class="px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1"
              [class]="getRoleButtonClass(role.value)"
            >
              <span class="text-base">{{ role.icon }}</span>
              <span>{{ role.label }}</span>
            </button>
          }
        </div>
      </div>

      <div class="flex gap-3 pt-4">
        <button
          type="button"
          (click)="cancel.emit()"
          class="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {{ 'translate_actions-cancel' | translate }}
        </button>
        <button
          type="submit"
          [disabled]="userForm.invalid || loading()"
          class="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          @if (loading()) {
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
                fill="none"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          }
          {{ 'translate_actions-save' | translate }}
        </button>
      </div>
    </form>
  `,
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  private zonesService = inject(ZonesService);
  private translate = inject(TranslateService);

  user = input<User | null>(null);
  loading = input(false);
  save = output<any>();
  cancel = output<void>();

  zones = toSignal(this.zonesService.getAllZones(), { initialValue: [] });
  isNewUser = signal(true);
  userForm!: FormGroup;

  roleOptions: { label: string; value: UserRole; icon: string }[] = [
    { label: 'Super Admin', value: 'super_admin', icon: '👑' },
    { label: 'Admin', value: 'admin', icon: '🛡️' },
    { label: 'Viewer', value: 'viewer', icon: '👁️' },
  ];

  constructor() {
    const userData = this.user();
    const assignedZoneId = userData?.assignedZoneIds?.[0] || '';

    this.isNewUser.set(!userData);

    this.userForm = this.fb.group({
      displayName: [userData?.displayName || '', Validators.required],
      email: [
        userData?.email || '',
        [Validators.required, Validators.email],
        [emailTakenValidator(userData?.email)],
      ],
      phone: [userData?.phone || ''],
      assignedZoneId: [assignedZoneId],
      role: [userData?.role || 'viewer', Validators.required],
    });

    if (this.isNewUser()) {
      this.userForm.addControl(
        'password',
        this.fb.control('', [Validators.required, Validators.minLength(6)]),
      );
    }
  }

  selectRole(role: UserRole): void {
    this.userForm.patchValue({ role });
  }

  getRoleButtonClass(role: UserRole): string {
    const selected = this.userForm.get('role')?.value === role;
    const base = selected
      ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500';
    return `${base} cursor-pointer`;
  }

  getZoneName(zone: any): string {
    const lang = this.translate.currentLang || 'ar';
    return lang === 'ar' ? zone.nameAr : zone.nameEn;
  }

  onSave(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const userData: any = {
        uid: this.user()?.uid,
        displayName: formValue.displayName,
        email: formValue.email,
        phone: formValue.phone,
        role: formValue.role,
        assignedZoneIds: formValue.assignedZoneId ? [formValue.assignedZoneId] : [],
      };

      if (this.isNewUser()) {
        userData.password = formValue.password;
      }

      this.save.emit(userData);
    }
  }
}
