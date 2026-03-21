import { ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { routes } from './app.routes';
import { provideCore } from './core/core.providers';
import { GlobalErrorHandler } from './shared/handlers/global-error.handler';
import { globalInterceptor } from './shared/interceptors/global.interceptor';
import { authInterceptor } from './shared/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    ...provideCore(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, globalInterceptor])),
    MessageService,
    importProvidersFrom(ToastModule),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
