import { Component, ChangeDetectionStrategy, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { User, UserRole } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DropdownModule,
  ],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSave()" class="p-fluid grid gap-4">
      <!-- displayName -->
      <div class="field col-12">
        <label for="displayName" class="font-semibold">{{ 'translateUserName' | translate }}</label>
        <input pInputText id="displayName" formControlName="displayName" />
      </div>

      <!-- email -->
      <div class="field col-12">
        <label for="email" class="font-semibold">{{ 'translateAuthEmail' | translate }}</label>
        <input pInputText id="email" type="email" formControlName="email" />
      </div>

      <!-- phone (Optional based on your model) -->
      <div class="field col-12">
        <label for="phone" class="font-semibold">{{ 'translateUserPhone' | translate }}</label>
        <input pInputText id="phone" formControlName="phone" />
      </div>

      <!-- password (only for new users) -->
      @if (isNewUser()) {
        <div class="field col-12">
          <label for="password" class="font-semibold">{{ 'translateAuthPassword' | translate }}</label>
          <p-password id="password" formControlName="password" [toggleMask]="true" [feedback]="false"></p-password>
        </div>
      }

      <!-- role -->
      <div class="field col-12">
        <label for="role" class="font-semibold">{{ 'translateUserRole' | translate }}</label>
        <p-dropdown 
          id="role" 
          formControlName="role" 
          [options]="roleOptions" 
          optionLabel="label" 
          optionValue="value"
          [placeholder]="'translateSelectRole' | translate"
        ></p-dropdown>
      </div>
      
      <div class="col-12 flex justify-end gap-2 mt-4">
        <p-button [label]="'translateActionsCancel' | translate" styleClass="p-button-text" (onClick)="cancel.emit()" />
        <p-button [label]="'translateActionsSave' | translate" type="submit" [loading]="loading" />
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  user = input<User | null>(null);
  loading = input(false);
  save = output<any>();
  cancel = output<void>();

  isNewUser = signal(true);
  userForm!: FormGroup;

  roleOptions: { label: string, value: UserRole }[] = [
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Admin', value: 'admin' },
    { label: 'Viewer', value: 'viewer' },
  ];

  ngOnInit(): void {
    const userData = this.user();
    this.isNewUser.set(!userData);

    this.userForm = this.fb.group({
      displayName: [userData?.displayName || '', Validators.required],
      email: [userData?.email || '', [Validators.required, Validators.email]],
      phone: [userData?.phone || ''],
      role: [userData?.role || 'viewer', Validators.required],
    });

    if (this.isNewUser()) {
      this.userForm.addControl('password', this.fb.control('', [Validators.required, Validators.minLength(6)]));
    }
  }

  onSave(): void {
    if (this.userForm.valid) {
      this.save.emit({
        uid: this.user()?.uid,
        ...this.userForm.value
      });
    }
  }
}
