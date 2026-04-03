import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, TranslateModule, ButtonModule],
  template: `
    <div class="mx-auto max-w-4xl space-y-8">
      <div class="glass-card p-8 sm:p-10">
        <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {{ 'translate_nav-dashboard' | translate }}
        </h1>
        <p class="mt-3 max-w-2xl text-muted-color">
          {{ 'translate_common-welcome' | translate }}
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <p-button [label]="'translate_nav-zones' | translate" icon="pi pi-map" [outlined]="true" />
          <p-button [label]="'translate_nav-users' | translate" icon="pi pi-users" severity="primary" />
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
