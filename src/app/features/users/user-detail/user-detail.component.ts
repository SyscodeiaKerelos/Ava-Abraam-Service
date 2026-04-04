import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { map, switchMap } from 'rxjs/operators';
import { concat, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { NgIcon } from '@ng-icons/core';
import { UsersService } from '../services/users.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-detail',
  imports: [CommonModule, TranslateModule, ButtonModule, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-5 sm:p-8">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p-button
          type="button"
          (click)="onBack()"
          [label]="'translate_user-back-to-list' | translate"
          severity="secondary"
          [outlined]="true"
          styleClass="shrink-0"
        >
          <ng-template pTemplate="icon" let-iconClass="class">
            <ng-icon
              name="faSolidArrowLeft"
              [class]="(iconClass || '') + ' shrink-0 rtl:scale-x-[-1]'"
              size="1rem"
              aria-hidden="true"
            />
          </ng-template>
        </p-button>
      </div>

      @if (user() === undefined) {
        <p class="text-muted-color">{{ 'translate_common-loading' | translate }}</p>
      } @else if (user() === null) {
        <p class="text-muted-color">{{ 'translate_user-not-found' | translate }}</p>
      } @else {
        <div class="space-y-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {{ user()!.displayName || '—' }}
            </h1>
            <p class="mt-1 text-sm text-muted-color">
              {{ 'translate_user-detail-subtitle' | translate }}
            </p>
          </div>

          <dl class="grid gap-4 sm:grid-cols-2">
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_auth-email' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium text-color">{{ user()!.email }}</dd>
            </div>
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_user-phone' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium text-color">{{ user()!.phone || '—' }}</dd>
            </div>
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_user-role' | translate }}
              </dt>
              <dd class="mt-1">
                <span [class]="roleBadgeClass(user()!.role)">{{
                  roleLabelKey(user()!.role) | translate
                }}</span>
              </dd>
            </div>
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_user-status' | translate }}
              </dt>
              <dd class="mt-1">
                <span [class]="statusBadgeClass(user()!.isActive)">{{
                  user()!.isActive
                    ? ('translate_user-active' | translate)
                    : ('translate_user-inactive' | translate)
                }}</span>
              </dd>
            </div>
            <div
              class="sm:col-span-2 rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_user-assigned-zones' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium text-color">
                @if (user()!.assignedZoneIds.length === 0) {
                  {{ 'translate_user-all-zones' | translate }}
                } @else {
                  {{ user()!.assignedZoneIds.join(', ') }}
                }
              </dd>
            </div>
          </dl>
        </div>
      }
    </div>
  `,
})
export class UserDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(UsersService);

  readonly user = toSignal<User | null | undefined>(
    this.route.paramMap.pipe(
      map((p) => p.get('uid')),
      switchMap((uid) => {
        if (!uid) {
          return of<User | null>(null);
        }
        return concat(
          of<User | null | undefined>(undefined),
          this.usersService.getUserById(uid),
        );
      }),
    ),
    { initialValue: undefined },
  );

  private readonly badgeBase =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums';

  private readonly roleLabelKeys: Record<string, string> = {
    super_admin: 'translate_role-super-admin',
    admin: 'translate_role-admin',
    viewer: 'translate_role-viewer',
  };

  onBack(): void {
    void this.router.navigate(['/users']);
  }

  roleLabelKey(role: string): string {
    return this.roleLabelKeys[role] ?? role;
  }

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
}
