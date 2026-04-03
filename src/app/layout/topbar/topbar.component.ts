import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
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
      class="sticky top-0 z-40 flex h-18 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-md transition-colors duration-150 dark:border-white/10 dark:bg-slate-950/80 sm:px-6 lg:px-10"
    >
      <div class="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <button
          type="button"
          (click)="toggleCollapse.emit()"
          class="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm transition hover:border-primary/30 hover:bg-slate-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800 lg:flex"
          [attr.aria-expanded]="!isCollapsed()"
          aria-controls="app-sidebar"
        >
          <ng-icon
            [name]="isCollapsed() ? 'faSolidBars' : 'faSolidIndent'"
            size="1.1rem"
            aria-hidden="true"
            [class.rotate-180]="themeService.currentLang() === 'en'"
          />
        </button>

        <button
          type="button"
          (click)="toggleMobileMenu.emit()"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          [attr.aria-expanded]="isSidebarOpen()"
          aria-label="Open menu"
        >
          <ng-icon [name]="isSidebarOpen() ? 'faSolidXmark' : 'faSolidBars'" size="1.2rem" aria-hidden="true" />
        </button>

        <h1
          class="min-w-0 truncate text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-base"
        >
          <span class="text-muted-color font-medium">{{ 'translate_common-welcome' | translate }}</span>
          <span class="mx-1 text-slate-400 dark:text-slate-500">،</span>
          <span>{{
            authService.currentUser()?.displayName || ('translate_common-user' | translate)
          }}</span>
        </h1>
      </div>

      <div class="flex shrink-0 items-center gap-2 sm:gap-3">
        <div
          class="flex items-center gap-0.5 rounded-2xl border border-slate-200/70 bg-slate-100/80 p-1 shadow-inner dark:border-white/10 dark:bg-slate-800/60"
        >
          <button
            type="button"
            (click)="themeService.toggleLanguage()"
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-white hover:shadow-sm dark:text-slate-200 dark:hover:bg-slate-700/80"
          >
            <ng-icon name="faSolidGlobe" size="0.9rem" aria-hidden="true" />
            <span class="tabular-nums">{{
              themeService.currentLang() === 'ar' ? 'EN' : 'AR'
            }}</span>
          </button>
          <button
            type="button"
            (click)="themeService.toggleTheme()"
            class="flex h-10 w-10 items-center justify-center rounded-xl text-amber-600 transition hover:bg-white hover:shadow-sm dark:text-amber-400 dark:hover:bg-slate-700/80"
            [attr.aria-pressed]="themeService.isDarkMode()"
            [attr.aria-label]="
              themeService.isDarkMode()
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            "
          >
            <ng-icon
              [name]="themeService.isDarkMode() ? 'faSolidSun' : 'faSolidMoon'"
              size="1rem"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  protected authService = inject(AuthService);
  protected themeService = inject(ThemeService);

  isCollapsed = input.required<boolean>();
  isSidebarOpen = input.required<boolean>();

  toggleCollapse = output<void>();
  toggleMobileMenu = output<void>();
}
