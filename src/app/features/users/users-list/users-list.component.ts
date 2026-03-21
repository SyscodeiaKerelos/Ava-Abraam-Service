import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { UsersService } from '../services/users.service';
import { UserFormComponent } from '../user-form/user-form.component';
import { User } from '../../../shared/models/user.model';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    DialogModule,
    UserFormComponent,
    NgIcon,
  ],
  template: `
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ 'translate_nav-users' | translate }}
          </h1>
          <p class="text-slate-500 dark:text-slate-400">
            {{ 'translate_manage-users-subtitle' | translate }}
          </p>
        </div>
        <p-button
          (click)="onAddNewUser()"
          [label]="'translate_user-add' | translate"
          icon="pi pi-plus"
        />
      </div>

      <p-table [value]="users()" [tableStyle]="{ 'min-width': '50rem' }" responsiveLayout="scroll">
        <ng-template pTemplate="header">
          <tr>
            <th class="text-slate-700 dark:text-slate-200">
              {{ 'translate_user-name' | translate }}
            </th>
            <th class="text-slate-700 dark:text-slate-200">
              {{ 'translate_auth-email' | translate }}
            </th>
            <th class="text-slate-700 dark:text-slate-200">
              {{ 'translate_user-phone' | translate }}
            </th>
            <th class="text-slate-700 dark:text-slate-200">
              {{ 'translate_user-role' | translate }}
            </th>
            <th class="text-slate-700 dark:text-slate-200">
              {{ 'translate_user-status' | translate }}
            </th>
            <th class="w-32"></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-user>
          <tr class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <td class="text-slate-900 dark:text-white">{{ user.displayName }}</td>
            <td class="text-slate-600 dark:text-slate-300">{{ user.email }}</td>
            <td class="text-slate-600 dark:text-slate-300">{{ user.phone || 'N/A' }}</td>
            <td>
              <span class="px-2 py-1 text-xs rounded-full" [ngClass]="getRoleClass(user.role)">
                {{ user.role }}
              </span>
            </td>
            <td>
              <span
                class="px-2 py-1 text-xs rounded-full"
                [ngClass]="
                  user.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                "
              >
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button
                (click)="onEditUser(user)"
                class="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              >
                <ng-icon name="faSolidPen" size="0.9rem" />
              </button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="text-center p-8 text-slate-500 dark:text-slate-400">
              {{ 'translate_no-users-found' | translate }}
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog
      [(visible)]="showUserForm"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false"
      styleClass="dark:bg-slate-800"
    >
      <ng-template pTemplate="header">
        <span class="text-lg font-semibold text-slate-900 dark:text-white px-6 pt-4 block">
          {{
            isNewUser() ? ('translate_user-add' | translate) : ('translate_user-edit' | translate)
          }}
        </span>
      </ng-template>
      <ng-template pTemplate="content">
        <div class="px-6 pb-6 bg-white dark:bg-slate-800">
          <app-user-form
            [user]="selectedUser()"
            [loading]="isSaving()"
            (save)="handleSave($event)"
            (cancel)="showUserForm = false"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
  private usersService = inject(UsersService);

  users = toSignal(this.usersService.getAllUsers(), { initialValue: [] });

  selectedUser = signal<User | null>(null);
  showUserForm = false;
  isNewUser = signal(false);
  isSaving = signal(false);

  onAddNewUser() {
    this.selectedUser.set(null);
    this.isNewUser.set(true);
    this.showUserForm = true;
  }

  onEditUser(user: User) {
    this.selectedUser.set(user);
    this.isNewUser.set(false);
    this.showUserForm = true;
  }

  async handleSave(userData: any) {
    this.isSaving.set(true);
    try {
      if (this.isNewUser()) {
        const { email, password, displayName, role, phone } = userData;
        const result = await this.usersService.createUser({
          email,
          password,
          displayName,
          role,
          phone,
        });

        if (result?.uid) {
          const { password: _, ...firestoreData } = userData;
          await this.usersService.addUserDoc(result.uid, firestoreData);
        }
      } else {
        const { password: _, ...updateData } = userData;
        await this.usersService.updateUser(userData.uid, updateData);
      }
      this.showUserForm = false;
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-700';
      case 'admin':
        return 'bg-blue-100 text-blue-700';
      case 'viewer':
        return 'bg-slate-100 text-slate-700';
      default:
        return '';
    }
  }
}
