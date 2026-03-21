import { Component, ChangeDetectionStrategy, signal, effect, inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  faSolidUser, 
  faSolidXmark, 
  faSolidBars, 
  faSolidArrowRightFromBracket,
  faSolidHouse,
  faSolidUsers,
  faSolidBoxesPacking,
  faSolidFileImport,
  faSolidGear
} from '@ng-icons/font-awesome/solid';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, NgIcon, RouterLink, TranslateModule],
  providers: [provideIcons({ 
    faSolidUser, faSolidXmark, faSolidBars, faSolidArrowRightFromBracket,
    faSolidHouse, faSolidUsers, faSolidBoxesPacking, faSolidFileImport, faSolidGear
  })],
  template: `
    <div [class.dark]="isDarkMode()" class="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex font-sans transition-colors duration-300 overflow-hidden" [dir]="currentLang() === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- Desktop Sidebar -->
      <app-sidebar 
        [isCollapsed]="isCollapsed()" 
        [currentLang]="currentLang()" 
        (logout)="onLogout()"
      />

      <!-- Main Content -->
      <main 
        class="flex-1 min-h-screen flex flex-col relative transition-all duration-300 ease-in-out overflow-y-auto" 
        [ngClass]="[
          currentLang() === 'ar' ? (isCollapsed() ? 'lg:pr-24' : 'lg:pr-72') : (isCollapsed() ? 'lg:pl-24' : 'lg:pl-72')
        ]"
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
        <div class="absolute top-40 left-40 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-0"></div>
        <div class="absolute bottom-40 right-40 w-80 h-80 bg-blue-400/5 blur-[100px] rounded-full pointer-events-none -z-0"></div>
      </main>

      <!-- Mobile Sidebar Overlay -->
      @if (isSidebarOpen()) {
        <div class="fixed inset-0 z-50 lg:hidden bg-slate-950/20 backdrop-blur-sm" (click)="isSidebarOpen.set(false)">
          <aside 
            class="absolute top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl animate-in duration-300 transition-transform"
            [ngClass]="currentLang() === 'ar' ? 'right-0 slide-in-from-right' : 'left-0 slide-in-from-left'"
            (click)="$event.stopPropagation()"
          >
             <div class="h-full flex flex-col p-6">
                <!-- Mobile Logo -->
                <div class="flex items-center gap-4 mb-10 px-2">
                  <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <ng-icon name="faSolidUser" size="1.2rem" class="text-white" />
                  </div>
                  <h1 class="font-bold text-lg tracking-tight">خدمة الأنبا ابرام</h1>
                </div>

                <!-- Mobile Nav -->
                <nav class="flex-1 space-y-2">
                  @for (item of menuItems; track item.link) {
                    <a [routerLink]="item.link" (click)="isSidebarOpen.set(false)" class="flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 font-medium">
                      <ng-icon [name]="item.icon" size="1.2rem" />
                      <span>{{ item.label | translate }}</span>
                    </a>
                  }
                </nav>

                <!-- Mobile Footer -->
                <div class="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                   <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                         <ng-icon name="faSolidUser" size="1rem" class="text-slate-400" />
                      </div>
                      <span class="text-xs font-bold truncate max-w-[100px]">مينا سمير</span>
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
export class ShellComponent {
  private translate = inject(TranslateService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);

  isSidebarOpen = signal(false);
  isCollapsed = signal(false);
  isDarkMode = signal(true);
  currentLang = signal<'ar' | 'en'>('ar');

  menuItems = [
    { label: 'translateNavDashboard', link: '/dashboard', icon: 'faSolidHouse' },
    { label: 'translateNavZones', link: '/zones', icon: 'faSolidBoxesPacking' },
    { label: 'translateNavUsers', link: '/users', icon: 'faSolidUsers' },
    { label: 'translateNavImport', link: '/import', icon: 'faSolidFileImport' },
    { label: 'translateNavSettings', link: '/settings/tags', icon: 'faSolidGear' },
  ];

  constructor() {
    this.translate.setDefaultLang('ar');
    
    effect(() => {
      const mode = this.isDarkMode();
      if (mode) {
        this.renderer.addClass(this.document.body, 'dark');
      } else {
        this.renderer.removeClass(this.document.body, 'dark');
      }
    });

    effect(() => {
      const lang = this.currentLang();
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      this.renderer.setAttribute(this.document.documentElement, 'lang', lang);
      this.renderer.setAttribute(this.document.documentElement, 'dir', dir);
      this.translate.use(lang);
    });
  }

  toggleTheme() { this.isDarkMode.update(v => !v); }
  toggleLanguage() { this.currentLang.update(l => l === 'ar' ? 'en' : 'ar'); }
  onLogout() { console.log('Logging out...'); }
}
