import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideIcons } from '@ng-icons/core';
import { APP_ICONS } from './icons';
import { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { environment } from '../../environments/environment';
import { ThemeService } from './services/theme.service';

export const provideCore = () => [
  provideHttpClient(withFetch()),
  provideAnimationsAsync(),
  providePrimeNG({
    theme: {
      preset: Aura,
      options: {
        /* Must match Tailwind: @custom-variant dark (&:where(.dark, .dark *)); — class on <html> */
        darkModeSelector: '.dark',
        /*
         * Tailwind v4 uses @layer theme, base, components, utilities (see tailwindcss/index.css).
         * Legacy names tailwind-base / tailwind-utilities break cascade vs PrimeNG.
         */
        cssLayer: {
          name: 'primeng',
          order: 'theme, base, components, primeng, utilities',
        },
        rtl: { enable: true },
      },
    },
    ripple: true,
  }),
  provideIcons(APP_ICONS),
  provideTranslateService({
    loader: provideTranslateHttpLoader({
      prefix: '/assets/i18n/',
      suffix: '.json',
    }),
    fallbackLang: 'ar',
    lang: 'ar',
  }),
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
  provideFunctions(() => getFunctions(getApp(), 'us-central1')),
  ThemeService,
];
