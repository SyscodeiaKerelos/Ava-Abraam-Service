import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-zones-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-50">{{ 'translate_nav-zones' | translate }}</h1>
      <p class="text-slate-500 dark:text-slate-400 mt-2">قائمة المناطق والشمامسة المسئولين.</p>
      
      <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Zone Cards will go here -->
        <div class="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
           <div class="h-40 flex items-center justify-center text-slate-400 italic">
             قريباً...
           </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonesListComponent {}
