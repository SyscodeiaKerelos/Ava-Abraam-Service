import { Component, ChangeDetectionStrategy, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { AuthService } from '../../core/auth/auth.service';
import {
  faSolidHouse,
  faSolidUsers,
  faSolidBoxesPacking,
  faSolidFileImport,
  faSolidGear,
  faSolidUser,
  faSolidArrowRightFromBracket,
} from '@ng-icons/font-awesome/solid';

interface MenuItem {
  label: string;
  link: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, NgIcon],
  providers: [
    provideIcons({
      faSolidHouse,
      faSolidUsers,
      faSolidBoxesPacking,
      faSolidFileImport,
      faSolidGear,
      faSolidUser,
      faSolidArrowRightFromBracket,
    }),
  ],
  template: `
    <aside
      class="fixed inset-y-0 z-50 transition-all duration-300 ease-in-out glass-sidebar hidden lg:block"
      [class.right-0]="currentLang() === 'ar'"
      [class.left-0]="currentLang() !== 'ar'"
      [class.border-l]="currentLang() === 'ar'"
      [class.border-r]="currentLang() !== 'ar'"
      [class.w-24]="isCollapsed()"
      [class.w-72]="!isCollapsed()"
    >
      <div class="h-full flex flex-col p-5">
        <!-- Logo -->
        <div class="flex items-center gap-4 mb-10 px-2 overflow-hidden whitespace-nowrap">
          <div
            class="w-10 h-10 bg-primary rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <ng-icon name="faSolidUser" size="1.2rem" class="text-white" />
          </div>
          @if (!isCollapsed()) {
            <h1
              class="font-bold text-lg tracking-tight animate-in fade-in slide-in-from-right-2 duration-300"
            >
              {{ 'translate_app-name' | translate }}
            </h1>
          }
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
          @for (item of visibleMenuItems(); track item.link) {
            <a
              [routerLink]="item.link"
              routerLinkActive="nav-item-active"
              [routerLinkActiveOptions]="{ exact: item.link === '/dashboard' }"
              class="nav-item"
              [title]="item.label | translate"
            >
              <ng-icon [name]="item.icon" size="1.2rem" class="flex-shrink-0" />
              @if (!isCollapsed()) {
                <span class="font-medium animate-in fade-in slide-in-from-right-2 duration-300">{{
                  item.label | translate
                }}</span>
              }
            </a>
          }
        </nav>

        <!-- User & Logout -->
        <div class="mt-auto pt-6 border-t border-slate-200/70 dark:border-white/10 overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-2">
            <div class="flex items-center gap-3 overflow-hidden">
              <div
                class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center border border-white/50 dark:border-slate-700 shadow-sm overflow-hidden"
              >
                <ng-icon name="faSolidUser" size="1.2rem" class="text-slate-400" />
              </div>
              @if (!isCollapsed()) {
                <div
                  class="flex-1 animate-in fade-in slide-in-from-right-2 duration-300 overflow-hidden text-right ltr:text-left"
                >
                  <p class="text-xs font-bold leading-none truncate">
                    {{
                      authService.currentUser()?.displayName ||
                        ('translate_common-user' | translate)
                    }}
                  </p>
                  <p
                    class="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter font-semibold"
                  >
                    {{ getRoleLabel() }}
                  </p>
                </div>
              }
            </div>

            <button
              (click)="logout.emit()"
              class="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
              [title]="'translate_common-logout' | translate"
            >
              <ng-icon name="faSolidArrowRightFromBracket" size="1.1rem" />
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

  isCollapsed = input.required<boolean>();
  currentLang = input.required<'ar' | 'en'>();
  logout = output<void>();

  protected authService = inject(AuthService);

  private menuItems: MenuItem[] = [
    { label: 'translate_nav-dashboard', link: '/dashboard', icon: 'faSolidHouse' },
    { label: 'translate_nav-zones', link: '/zones', icon: 'faSolidBoxesPacking' },
    { label: 'translate_nav-users', link: '/users', icon: 'faSolidUsers', roles: ['super_admin'] },
    {
      label: 'translate_nav-settings',
      link: '/settings/tags',
      icon: 'faSolidGear',
      roles: ['super_admin', 'admin'],
    },
  ];

  visibleMenuItems = computed(() => {
    const userRole = this.authService.currentUserRole();
    return this.menuItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return item.roles.includes(userRole || '');
    });
  });

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
