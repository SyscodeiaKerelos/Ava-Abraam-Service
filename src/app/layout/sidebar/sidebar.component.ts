import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NavEntriesComponent } from '../nav-entries/nav-entries.component';
import {
  faSolidUser,
  faSolidArrowRightFromBracket,
} from '@ng-icons/font-awesome/solid';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, TranslateModule, NgIcon, NavEntriesComponent],
  providers: [
    provideIcons({
      faSolidUser,
      faSolidArrowRightFromBracket,
    }),
  ],
  template: `
    <aside
      id="app-sidebar"
      class="app-sidebar-shell fixed z-50 hidden overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex lg:flex-col glass-sidebar rounded-3xl shadow-xl"
      [class.top-3]="true"
      [class.bottom-3]="true"
      [class.right-3]="themeService.currentLang() === 'ar'"
      [class.left-3]="themeService.currentLang() !== 'ar'"
      [class.w-24]="isCollapsed()"
      [class.w-72]="!isCollapsed()"
      aria-label="Main navigation"
    >
      <div class="flex h-full min-h-0 flex-col p-4">
        <div
          class="mb-8 flex items-center gap-3 overflow-hidden px-1.5"
        >
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/35 ring-2 ring-white/25 dark:ring-white/10"
          >
            <ng-icon name="faSolidUser" size="1.25rem" aria-hidden="true" />
          </div>
          @if (!isCollapsed()) {
            <div class="min-w-0 flex-1">
              <h1 class="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {{ 'translate_app-name' | translate }}
              </h1>
            </div>
          }
        </div>

        <nav
          class="app-sidebar-nav custom-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
          aria-label="Main"
        >
          <app-nav-entries [isCollapsed]="isCollapsed()" />
        </nav>

        <div
          class="mt-auto overflow-hidden border-t border-slate-200/80 pt-4 dark:border-white/10"
        >
          <div class="flex items-center justify-between gap-2 px-1">
            <div class="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100/90 dark:border-slate-700 dark:bg-slate-800/90"
              >
                <ng-icon name="faSolidUser" size="1.1rem" class="text-slate-500 dark:text-slate-400" aria-hidden="true" />
              </div>
              @if (!isCollapsed()) {
                <div class="min-w-0 flex-1 text-end ltr:text-start">
                  <p class="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    {{
                      authService.currentUser()?.displayName ||
                        ('translate_common-user' | translate)
                    }}
                  </p>
                  <p class="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {{ getRoleLabel() }}
                  </p>
                </div>
              }
            </div>

            <button
              type="button"
              (click)="logout.emit()"
              class="shrink-0 rounded-xl p-2.5 text-red-500 transition-colors hover:bg-red-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:hover:bg-red-500/15"
              [title]="'translate_common-logout' | translate"
            >
              <ng-icon name="faSolidArrowRightFromBracket" size="1.1rem" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private translate = inject(TranslateService);
  protected themeService = inject(ThemeService);
  protected authService = inject(AuthService);

  isCollapsed = input.required<boolean>();
  logout = output<void>();

  getRoleLabel(): string {
    const role = this.authService.currentUserRole();
    switch (role) {
      case 'super_admin':
        return this.translate.instant('translate_role-super-admin');
      case 'admin':
        return this.translate.instant('translate_role-admin');
      case 'viewer':
        return this.translate.instant('translate_role-viewer');
      default:
        return this.translate.instant('translate_common-user');
    }
  }
}
