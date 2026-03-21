import {
  Component,
  ChangeDetectionStrategy,
  signal,
  effect,
  inject,
  Renderer2,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { AuthService } from '../../core/auth/auth.service';
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

interface MenuItem {
  label: string;
  link: string;
  icon: string;
  roles?: string[];
}

const THEME_KEY = 'Anafora-Farm-Theme';
const LANG_KEY = 'Anafora-Farm-Lang';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    NgIcon,
    RouterLink,
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
      [class.dark]="isDarkMode()"
      class="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex font-sans transition-colors duration-300 overflow-hidden"
      [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'"
    >
      <!-- Desktop Sidebar -->
      <app-sidebar
        [isCollapsed]="isCollapsed()"
        [currentLang]="currentLang()"
        (logout)="onLogout()"
      />

      <!-- Main Content -->
      <main
        class="flex-1 min-h-screen flex flex-col relative transition-all duration-300 ease-in-out overflow-y-auto"
        [class.lg:pr-24]="currentLang() === 'ar' && isCollapsed()"
        [class.lg:pr-72]="currentLang() === 'ar' && !isCollapsed()"
        [class.lg:pl-24]="currentLang() !== 'ar' && isCollapsed()"
        [class.lg:pl-72]="currentLang() !== 'ar' && !isCollapsed()"
      >
        <app-topbar
          [isCollapsed]="isCollapsed()"
          [isSidebarOpen]="isSidebarOpen()"
          [isDarkMode]="isDarkMode()"
          [currentLang]="currentLang()"
          (toggleCollapse)="isCollapsed.set(!isCollapsed())"
          (toggleMobileMenu)="isSidebarOpen.set(!isSidebarOpen())"
          (toggleLanguage)="toggleLanguage()"
          (toggleTheme)="toggleTheme()"
        />

        <!-- Page Content -->
        <div class="p-6 lg:p-10 flex-1 relative z-10">
          <router-outlet />
        </div>

        <!-- Decorators -->
        <div
          class="absolute top-40 left-40 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-0"
        ></div>
        <div
          class="absolute bottom-40 right-40 w-80 h-80 bg-blue-400/5 blur-[100px] rounded-full pointer-events-none -z-0"
        ></div>
      </main>

      <!-- Mobile Sidebar Overlay -->
      @if (isSidebarOpen()) {
        <div
          class="fixed inset-0 z-50 lg:hidden bg-slate-950/20 backdrop-blur-sm"
          (click)="isSidebarOpen.set(false)"
        >
          <aside
            class="absolute top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl animate-in duration-300 transition-transform"
            [class.right-0]="currentLang() === 'ar'"
            [class.left-0]="currentLang() !== 'ar'"
            (click)="$event.stopPropagation()"
          >
            <div class="h-full flex flex-col p-6">
              <!-- Mobile Logo -->
              <div class="flex items-center gap-4 mb-10 px-2">
                <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <ng-icon name="faSolidUser" size="1.2rem" class="text-white" />
                </div>
                <h1 class="font-bold text-lg tracking-tight">
                  {{ 'translate_app-name' | translate }}
                </h1>
              </div>

              <!-- Mobile Nav -->
              <nav class="flex-1 space-y-2">
                @for (item of visibleMenuItems(); track item.link) {
                  <a
                    [routerLink]="item.link"
                    (click)="isSidebarOpen.set(false)"
                    class="flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 font-medium"
                  >
                    <ng-icon [name]="item.icon" size="1.2rem" />
                    <span>{{ item.label | translate }}</span>
                  </a>
                }
              </nav>

              <!-- Mobile Footer -->
              <div
                class="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <ng-icon name="faSolidUser" size="1rem" class="text-slate-400" />
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-bold block">{{
                      authService.currentUser()?.displayName ||
                        ('translate_common-user' | translate)
                    }}</span>
                    <span class="text-[10px] text-slate-500 uppercase">{{ getRoleLabel() }}</span>
                  </div>
                </div>
                <button (click)="onLogout()" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <ng-icon name="faSolidArrowRightFromBracket" size="1.1rem" />
                </button>
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
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  protected authService = inject(AuthService);

  isSidebarOpen = signal(false);
  isCollapsed = signal(false);
  isDarkMode = signal(false);
  currentLang = signal<'ar' | 'en'>('ar');

  constructor() {
    effect(() => {
      const mode = this.isDarkMode();
      if (mode) {
        this.renderer.addClass(this.document.body, 'dark');
        localStorage.setItem(THEME_KEY, 'dark');
      } else {
        this.renderer.removeClass(this.document.body, 'dark');
        localStorage.setItem(THEME_KEY, 'light');
      }
    });

    effect(() => {
      const lang = this.currentLang();
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      this.renderer.setAttribute(this.document.documentElement, 'lang', lang);
      this.renderer.setAttribute(this.document.documentElement, 'dir', dir);
      localStorage.setItem(LANG_KEY, lang);
      this.translate.use(lang);
    });
  }

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

  ngOnInit(): void {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedLang = localStorage.getItem(LANG_KEY) as 'ar' | 'en' | null;

    if (
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      this.isDarkMode.set(true);
    }

    if (savedLang) {
      this.currentLang.set(savedLang);
    }

    this.translate.setDefaultLang('ar');
    this.translate.use(this.currentLang());
  }

  toggleTheme(): void {
    this.isDarkMode.update((v) => !v);
  }

  toggleLanguage(): void {
    this.currentLang.update((l) => (l === 'ar' ? 'en' : 'ar'));
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
