import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { AuthService } from '../../core/auth/auth.service';
import {
  faSolidBars,
  faSolidXmark,
  faSolidSun,
  faSolidMoon,
  faSolidGlobe,
  faSolidIndent,
} from '@ng-icons/font-awesome/solid';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, TranslateModule, NgIcon],
  providers: [
    provideIcons({
      faSolidBars,
      faSolidXmark,
      faSolidSun,
      faSolidMoon,
      faSolidGlobe,
      faSolidIndent,
    }),
  ],
  template: `
    <header
      class="sticky top-0 z-40 h-20 flex items-center justify-between px-6 lg:px-10 bg-[#f8fafc]/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5"
    >
      <div class="flex items-center gap-4">
        <!-- Desktop Collapse Toggle -->
        <button
          (click)="toggleCollapse.emit()"
          class="hidden lg:flex p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ng-icon
            [name]="isCollapsed() ? 'faSolidBars' : 'faSolidIndent'"
            size="1.1rem"
            [class.rotate-180]="currentLang() === 'en'"
          />
        </button>

        <!-- Mobile Menu Toggle -->
        <button
          (click)="toggleMobileMenu.emit()"
          class="lg:hidden p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-white/10"
        >
          <ng-icon [name]="isSidebarOpen() ? 'faSolidXmark' : 'faSolidBars'" size="1.2rem" />
        </button>

        <h1
          class="font-bold text-sm lg:text-base tracking-tight text-slate-800 dark:text-slate-200"
        >
          {{ 'translate_common-welcome' | translate }}،
          {{ authService.currentUser()?.displayName || ('translate_common-user' | translate) }}
        </h1>
      </div>

      <!-- Toggles -->
      <div class="flex items-center gap-3">
        <div
          class="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl backdrop-blur-sm shadow-inner"
        >
          <button
            (click)="toggleLanguage.emit()"
            class="p-2 px-3 rounded-xl transition-all duration-300 hover:bg-white dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <ng-icon name="faSolidGlobe" size="0.9rem" />
            <span class="text-[10px] font-bold uppercase">{{
              currentLang() === 'ar' ? 'EN' : 'AR'
            }}</span>
          </button>
          <button
            (click)="toggleTheme.emit()"
            class="p-2 rounded-xl transition-all duration-300 hover:bg-white dark:hover:bg-slate-700"
          >
            <ng-icon [name]="isDarkMode() ? 'faSolidSun' : 'faSolidMoon'" size="0.9rem" />
          </button>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  protected authService = inject(AuthService);

  isCollapsed = input.required<boolean>();
  isSidebarOpen = input.required<boolean>();
  isDarkMode = input.required<boolean>();
  currentLang = input.required<'ar' | 'en'>();

  toggleCollapse = output<void>();
  toggleMobileMenu = output<void>();
  toggleLanguage = output<void>();
  toggleTheme = output<void>();
}
