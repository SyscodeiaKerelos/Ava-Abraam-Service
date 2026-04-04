import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed,
  effect,
} from '@angular/core';
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
import { UsersService } from '../services/users.service';
import { TranslateService } from '@ngx-translate/core';
import { emailTakenValidator } from './email-taken.validator';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgIcon, InputText],
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
          pInputText
          fluid
          formControlName="displayName"
          [placeholder]="'translate_user-name' | translate"
          class="w-full"
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
          pInputText
          fluid
          formControlName="email"
          [placeholder]="'translate_auth-email' | translate"
          class="w-full"
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
          pInputText
          fluid
          formControlName="phone"
          [placeholder]="'translate_user-phone' | translate"
          class="w-full"
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
          class="p-inputtext p-component w-full"
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
            pInputText
            fluid
            formControlName="password"
            [placeholder]="'translate_auth-password' | translate"
            class="w-full"
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
  private usersService = inject(UsersService);
  private translate = inject(TranslateService);

  user = input<User | null>(null);
  loading = input(false);
  save = output<any>();
  cancel = output<void>();

  zones = toSignal(this.zonesService.getAllZones(), { initialValue: [] });
  /** Edit vs create — derived from input so it stays in sync (constructor cannot read `user()` reliably). */
  isNewUser = computed(() => !this.user());
  userForm!: FormGroup;

  roleOptions: { label: string; value: UserRole; icon: string }[] = [
    { label: 'Super Admin', value: 'super_admin', icon: '👑' },
    { label: 'Admin', value: 'admin', icon: '🛡️' },
    { label: 'Viewer', value: 'viewer', icon: '👁️' },
  ];

  constructor() {
    this.userForm = this.fb.group({
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email], [emailTakenValidator(this.usersService)]],
      phone: [''],
      assignedZoneId: [''],
      role: ['viewer', Validators.required],
    });

    effect(() => {
      const userData = this.user();
      const emailCtrl = this.userForm.get('email');

      if (userData) {
        if (this.userForm.contains('password')) {
          this.userForm.removeControl('password', { emitEvent: false });
        }
        emailCtrl?.clearAsyncValidators();
        emailCtrl?.setAsyncValidators([emailTakenValidator(this.usersService, userData.email)]);
        emailCtrl?.updateValueAndValidity({ emitEvent: false });

        this.userForm.patchValue(
          {
            displayName: userData.displayName ?? '',
            email: userData.email ?? '',
            phone: userData.phone ?? '',
            assignedZoneId: userData.assignedZoneIds?.[0] ?? '',
            role: userData.role ?? 'viewer',
          },
          { emitEvent: false },
        );
      } else {
        if (!this.userForm.contains('password')) {
          this.userForm.addControl(
            'password',
            this.fb.control('', [Validators.required, Validators.minLength(6)]),
          );
        } else {
          this.userForm.get('password')?.reset('', { emitEvent: false });
        }
        emailCtrl?.clearAsyncValidators();
        emailCtrl?.setAsyncValidators([emailTakenValidator(this.usersService)]);
        emailCtrl?.updateValueAndValidity({ emitEvent: false });

        this.userForm.patchValue(
          {
            displayName: '',
            email: '',
            phone: '',
            assignedZoneId: '',
            role: 'viewer',
          },
          { emitEvent: false },
        );
      }
    });
  }

  selectRole(role: UserRole): void {
    this.userForm.patchValue({ role });
  }

  getRoleButtonClass(role: UserRole): string {
    const selected = this.userForm.get('role')?.value === role;
    const base =
      'cursor-pointer rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors duration-150 flex flex-col items-center gap-1';
    if (selected) {
      return `${base} border-primary bg-primary/10 text-primary dark:bg-primary/25 dark:text-primary-200`;
    }
    return `${base} border-surface-300 bg-surface-0 text-muted-color hover:border-surface-400 hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-900 dark:hover:border-surface-500 dark:hover:bg-surface-800`;
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
