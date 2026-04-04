import { Routes } from '@angular/router';
import { AuthGuard, AdminGuard, GuestGuard, SuperAdminGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    canActivate: [GuestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'zones',
        loadComponent: () =>
          import('./features/zones/zones-list/zones-list.component').then(
            (m) => m.ZonesListComponent,
          ),
      },
      {
        path: 'families/new',
        loadComponent: () =>
          import('./features/families/family-form/family-form.component').then(
            (m) => m.FamilyFormComponent,
          ),
        canActivate: [AdminGuard],
      },
      {
        path: 'families/:familyId/edit',
        loadComponent: () =>
          import('./features/families/family-form/family-form.component').then(
            (m) => m.FamilyFormComponent,
          ),
        canActivate: [AdminGuard],
      },
      {
        path: 'families/:familyId',
        loadComponent: () =>
          import('./features/families/family-detail/family-detail.component').then(
            (m) => m.FamilyDetailComponent,
          ),
      },
      {
        path: 'families',
        loadComponent: () =>
          import('./features/families/families-list/families-list.component').then(
            (m) => m.FamiliesListComponent,
          ),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/families/family-import/family-import.component').then(
            (m) => m.FamilyImportComponent,
          ),
        canActivate: [AdminGuard],
      },
      {
        path: 'export',
        loadComponent: () =>
          import('./features/families/family-export/family-export.component').then(
            (m) => m.FamilyExportComponent,
          ),
        canActivate: [AdminGuard],
      },
      {
        path: 'users/:uid',
        loadComponent: () =>
          import('./features/users/user-detail/user-detail.component').then(
            (m) => m.UserDetailComponent,
          ),
        canActivate: [SuperAdminGuard],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users-list/users-list.component').then(
            (m) => m.UsersListComponent,
          ),
        canActivate: [SuperAdminGuard],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'auth/login' },
];
