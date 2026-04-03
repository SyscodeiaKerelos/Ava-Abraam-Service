import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class ThemeService {
  private document = inject(DOCUMENT);
  private readonly THEME_KEY = 'app-theme';
  private readonly LANG_KEY = 'app-lang'; // New language key
  
  isDarkMode = signal<boolean>(this.getInitialTheme());
  currentLang = signal<'ar' | 'en'>(this.getInitialLang()); // New language signal

  constructor() {
    // Effect for theme management
    effect(() => {
      const isDark = this.isDarkMode();
      const root = this.document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        root.setAttribute('data-app-theme', 'dark');
        localStorage.setItem(this.THEME_KEY, 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-app-theme', 'light');
        localStorage.setItem(this.THEME_KEY, 'light');
      }
    });

    // Effect for language and direction management
    effect(() => {
      const lang = this.currentLang();
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      const html = this.document.documentElement;
      html.setAttribute('lang', lang);
      html.setAttribute('dir', dir);
      localStorage.setItem(this.LANG_KEY, lang);
      // Note: TranslateService usage should remain in the root or a dedicated service,
      // but the HTML attributes are managed here.
    });

    // Optional: Listen for system preference changes in real-time
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.THEME_KEY)) {
        this.isDarkMode.set(e.matches);
      }
    });
  }

  private getInitialTheme(): boolean {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private getInitialLang(): 'ar' | 'en' {
    const saved = localStorage.getItem(this.LANG_KEY) as 'ar' | 'en' | null;
    return saved || 'ar'; // Default to Arabic
  }

  toggleTheme() {
    this.isDarkMode.update(dark => !dark);
  }

  toggleLanguage() {
    this.currentLang.update(lang => (lang === 'ar' ? 'en' : 'ar'));
  }
}

