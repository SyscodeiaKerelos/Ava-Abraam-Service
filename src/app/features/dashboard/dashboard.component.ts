import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-4">{{ 'translate_nav-dashboard' | translate }}</h1>
      <p-button label="Test PrimeNG Button" icon="pi pi-check"></p-button>
      <div class="mt-4 p-4 bg-primary text-white rounded">
        Tailwind Primary Color Test
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
