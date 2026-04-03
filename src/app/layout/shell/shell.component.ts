import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
  effect,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { visibleNavItems } from '../nav.config';
import {
  faSolidUser,
  faSolidXmark,
  faSolidBars,
  faSolidArrowRightFromBracket,
  faSolidHouse,
  faSolidUsers,
  faSolidBoxesPacking,
  faSolidGear,
} from '@ng-icons/font-awesome/solid';

@Component({
  selector: 'app-shell',
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    NgIcon,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
  ],
  providers: [
    provideIcons({
      faSolidUser,
      faSolidXmark,
      faSolidBars,
      faSolidArrowRightFromBracket,
      faSolidHouse,
      faSolidUsers,
      faSolidBoxesPacking,
      faSolidGear,
    }),
  ],
  template: `
    <div
      class="flex min-h-screen overflow-hidden bg-surface-0 font-sans text-slate-900 antialiased transition-colors duration-150 dark:bg-surface-900 dark:text-slate-50"
      [dir]="themeService.currentLang() === 'ar' ? 'rtl' : 'ltr'"
    >
      <app-sidebar [isCollapsed]="isCollapsed()" (logout)="onLogout()" />

      <main
        class="app-page-gradient relative flex min-h-screen flex-1 flex-col overflow-y-auto transition-[padding] duration-200 ease-out motion-reduce:transition-none"
        [class.lg:pr-28]="themeService.currentLang() === 'ar' && isCollapsed()"
        [class.lg:pr-80]="themeService.currentLang() === 'ar' && !isCollapsed()"
        [class.lg:pl-28]="themeService.currentLang() !== 'ar' && isCollapsed()"
        [class.lg:pl-80]="themeService.currentLang() !== 'ar' && !isCollapsed()"
      >
        <app-topbar
          [isCollapsed]="isCollapsed()"
          [isSidebarOpen]="isSidebarOpen()"
          (toggleCollapse)="isCollapsed.set(!isCollapsed())"
          (toggleMobileMenu)="isSidebarOpen.set(!isSidebarOpen())"
        />

        <div class="relative z-10 flex-1 p-4 sm:p-6 lg:p-10">
          <router-outlet />
        </div>

        <div
          class="pointer-events-none absolute left-[10%] top-32 z-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px] dark:bg-primary/20"
        ></div>
        <div
          class="pointer-events-none absolute bottom-24 right-[15%] z-0 h-80 w-80 rounded-full bg-indigo-400/10 blur-[100px] dark:bg-indigo-400/15"
        ></div>
      </main>

      @if (isSidebarOpen()) {
        <div
          class="fixed inset-0 z-50 flex bg-slate-950/40 backdrop-blur-sm lg:hidden"
          role="presentation"
          (click)="isSidebarOpen.set(false)"
        >
          <aside
            class="app-mobile-drawer glass-sidebar absolute bottom-3 top-3 w-[min(100%-1.5rem,18rem)] overflow-hidden rounded-3xl shadow-2xl"
            [class.right-3]="themeService.currentLang() === 'ar'"
            [class.left-3]="themeService.currentLang() !== 'ar'"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            (click)="$event.stopPropagation()"
          >
            <div class="flex h-full flex-col p-5">
              <div class="mb-8 flex items-center justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/35"
                  >
                    <ng-icon name="faSolidUser" size="1.2rem" aria-hidden="true" />
                  </div>
                  <h1 class="truncate text-base font-bold tracking-tight">
                    {{ 'translate_app-name' | translate }}
                  </h1>
                </div>
                <button
                  type="button"
                  class="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                  (click)="isSidebarOpen.set(false)"
                  aria-label="Close menu"
                >
                  <ng-icon name="faSolidXmark" size="1.15rem" aria-hidden="true" />
                </button>
              </div>

              <nav
                class="app-sidebar-nav custom-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto"
                aria-label="Main"
              >
                @for (item of visibleMenuItems(); track item.link) {
                  <a
                    [routerLink]="item.link"
                    routerLinkActive="nav-item-active"
                    [routerLinkActiveOptions]="{ exact: item.link === '/dashboard' }"
                    (click)="isSidebarOpen.set(false)"
                    class="nav-item"
                  >
                    <ng-icon [name]="item.icon" size="1.2rem" aria-hidden="true" />
                    <span class="truncate">{{ item.labelKey | translate }}</span>
                  </a>
                }
              </nav>

              <div
                class="mt-auto border-t border-slate-200/80 pt-5 dark:border-white/10"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
                    >
                      <ng-icon name="faSolidUser" size="1rem" class="text-slate-400" aria-hidden="true" />
                    </div>
                    <div class="min-w-0 text-end ltr:text-start">
                      <span class="block truncate text-xs font-bold">{{
                        authService.currentUser()?.displayName ||
                          ('translate_common-user' | translate)
                      }}</span>
                      <span class="block truncate text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">{{
                        getRoleLabel()
                      }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    (click)="onLogout()"
                    class="rounded-xl p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/15"
                    [title]="'translate_common-logout' | translate"
                  >
                    <ng-icon name="faSolidArrowRightFromBracket" size="1.1rem" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit {
  private translate = inject(TranslateService);
  protected authService = inject(AuthService);
  protected themeService = inject(ThemeService);

  isSidebarOpen = signal(false);
  isCollapsed = signal(false);

  visibleMenuItems = computed(() => visibleNavItems(this.authService.currentUserRole()));

  private lastAppliedLang: 'ar' | 'en' | null = null;

  constructor() {
    effect(() => {
      const lang = this.themeService.currentLang();
      if (this.lastAppliedLang === lang) {
        return;
      }
      this.lastAppliedLang = lang;
      void firstValueFrom(this.translate.use(lang));
    });
  }

  ngOnInit(): void {
    this.translate.setDefaultLang('ar');
    const current = this.themeService.currentLang();
    const other = current === 'ar' ? 'en' : 'ar';
    void firstValueFrom(this.translate.reloadLang(other)).catch(() => undefined);
  }

  onLogout(): void {
    this.authService.logout();
  }

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
