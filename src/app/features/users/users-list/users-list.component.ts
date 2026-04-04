import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { UsersService } from '../services/users.service';
import { NgIcon } from '@ng-icons/core';
import { UserFormComponent } from '../user-form/user-form.component';
import { User, UserRole } from '../../../shared/models/user.model';

@Component({
  selector: 'app-users-list',
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    DialogModule,
    Menu,
    NgIcon,
    UserFormComponent,
  ],
  template: `
    <div class="glass-card p-5 sm:p-8">
      <div class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {{ 'translate_nav-users' | translate }}
          </h1>
          <p class="mt-1 text-sm text-muted-color sm:text-base">
            {{ 'translate_manage-users-subtitle' | translate }}
          </p>
        </div>
        <p-button
          (click)="onAddNewUser()"
          [label]="'translate_user-add' | translate"
          styleClass="shrink-0"
        >
          <ng-template pTemplate="icon" let-iconClass="class">
            <ng-icon name="faSolidPlus" [class]="(iconClass || '') + ' shrink-0'" size="1rem" aria-hidden="true" />
          </ng-template>
        </p-button>
      </div>

      <div class="overflow-x-auto rounded-2xl">
        <p-table
          [value]="users()"
          [tableStyle]="{ 'min-width': '48rem' }"
          [stripedRows]="true"
          [rowHover]="true"
          responsiveLayout="scroll"
          styleClass="app-data-table w-full text-sm"
        >
          <ng-template pTemplate="header">
            <tr>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_user-name' | translate }}
              </th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_auth-email' | translate }}
              </th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_user-phone' | translate }}
              </th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_user-role' | translate }}
              </th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_user-status' | translate }}
              </th>
              <th scope="col" class="app-users-actions-col w-24 min-w-14 text-center">
                <span class="sr-only">{{ 'translate_user-actions' | translate }}</span>
              </th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-user>
            <tr class="transition-colors duration-200">
              <td class="font-medium text-color">{{ user.displayName || '—' }}</td>
              <td class="text-muted-color">{{ user.email }}</td>
              <td class="text-muted-color">{{ user.phone || 'N/A' }}</td>
              <td>
                <span [class]="roleBadgeClass(user.role)">{{ user.role }}</span>
              </td>
              <td>
                <span [class]="statusBadgeClass(user.isActive)">{{
                  user.isActive ? 'Active' : 'Inactive'
                }}</span>
              </td>
              <td class="app-users-actions-cell text-center">
                <p-button
                  type="button"
                  (click)="openRowMenu($event, user)"
                  [outlined]="true"
                  severity="secondary"
                  styleClass="shrink-0 !min-h-10 !min-w-10 !border-surface-400 !text-color hover:!bg-emphasis dark:!border-surface-500"
                  [attr.aria-label]="'translate_user-actions' | translate"
                  [attr.aria-haspopup]="'menu'"
                >
                  <ng-template pTemplate="icon" let-iconClass="class">
                    <ng-icon
                      name="faSolidEllipsisVertical"
                      [class]="(iconClass || '') + ' shrink-0'"
                      size="1.1rem"
                      aria-hidden="true"
                    />
                  </ng-template>
                </p-button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="p-10 text-center text-muted-color">
                {{ 'translate_no-users-found' | translate }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-menu
      #rowMenu
      [model]="rowMenuModel()"
      [popup]="true"
      appendTo="body"
      [baseZIndex]="12000"
      styleClass="min-w-[14rem] app-users-row-menu"
    >
      <ng-template pTemplate="item" let-item>
        <span class="flex items-center gap-2">
          @switch (item.id) {
            @case ('edit') {
              <ng-icon name="faSolidPen" size="0.875rem" class="shrink-0" aria-hidden="true" />
            }
            @case ('view') {
              <ng-icon name="faSolidEye" size="0.875rem" class="shrink-0" aria-hidden="true" />
            }
          }
          <span class="flex-1">{{ item.label }}</span>
        </span>
      </ng-template>
    </p-menu>

    <p-dialog
      [(visible)]="showUserForm"
      [modal]="true"
      [closable]="true"
      [style]="{ width: 'min(480px, 92vw)' }"
      [draggable]="false"
      [resizable]="false"
      styleClass="app-user-dialog border-0 shadow-2xl"
    >
      <ng-template pTemplate="header">
        <span class="block px-2 pt-1 text-lg font-semibold text-color">
          {{
            isNewUser() ? ('translate_user-add' | translate) : ('translate_user-edit' | translate)
          }}
        </span>
      </ng-template>
      <ng-template pTemplate="content">
        @if (showUserForm) {
          <div class="px-2 pb-2">
            <app-user-form
              [user]="selectedUser()"
              [loading]="isSaving()"
              (save)="handleSave($event)"
              (cancel)="showUserForm = false"
            />
          </div>
        }
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
  private usersService = inject(UsersService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  private rowMenu = viewChild<Menu>('rowMenu');

  users = toSignal(this.usersService.getAllUsers(), { initialValue: [] });

  selectedUser = signal<User | null>(null);
  showUserForm = false;
  isNewUser = signal(false);
  isSaving = signal(false);
  rowMenuModel = signal<MenuItem[]>([]);

  private readonly badgeBase =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums';

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'super_admin':
        return `${this.badgeBase} bg-rose-100 text-rose-800 dark:bg-rose-950/55 dark:text-rose-200`;
      case 'admin':
        return `${this.badgeBase} bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200`;
      case 'viewer':
        return `${this.badgeBase} bg-slate-200/90 text-slate-800 dark:bg-slate-700/80 dark:text-slate-100`;
      default:
        return `${this.badgeBase} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`;
    }
  }

  statusBadgeClass(isActive: boolean): string {
    if (isActive) {
      return `${this.badgeBase} bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-300`;
    }
    return `${this.badgeBase} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`;
  }

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

  openRowMenu(event: Event, user: User): void {
    event.stopPropagation();
    this.rowMenuModel.set(this.buildRowMenuItems(user));
    // Defer toggle so the menu reads the updated `model` after signal/CD refresh.
    queueMicrotask(() => this.rowMenu()?.toggle(event));
  }

  private buildRowMenuItems(user: User): MenuItem[] {
    const t = (key: string) => this.translate.instant(key);
    return [
      {
        id: 'edit',
        label: t('translate_actions-edit'),
        command: () => this.onEditUser(user),
      },
      {
        id: 'view',
        label: t('translate_user-view-detail'),
        command: () => void this.router.navigate(['/users', user.uid]),
      },
    ];
  }

  async handleSave(userData: Partial<User> & { password?: string }) {
    this.isSaving.set(true);
    try {
      if (this.isNewUser()) {
        const { email, password, displayName, role, phone } = userData;
        if (!email || !password || !displayName || !role) {
          return;
        }
        const result = await this.usersService.createUser({
          email,
          password,
          displayName,
          role: role as UserRole,
          ...(phone != null && phone !== '' ? { phone } : {}),
        });

        if (result?.uid) {
          const { password: _, ...firestoreData } = userData;
          await this.usersService.addUserDoc(result.uid, firestoreData);
        }
      } else if (userData.uid) {
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
}
