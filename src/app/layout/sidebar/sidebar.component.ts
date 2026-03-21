import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  faSolidHouse, 
  faSolidUsers, 
  faSolidBoxesPacking, 
  faSolidFileImport, 
  faSolidGear,
  faSolidUser,
  faSolidArrowRightFromBracket
} from '@ng-icons/font-awesome/solid';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, NgIcon],
  providers: [provideIcons({ 
    faSolidHouse, faSolidUsers, faSolidBoxesPacking, 
    faSolidFileImport, faSolidGear, faSolidUser, faSolidArrowRightFromBracket 
  })],
  template: `
    <aside 
      class="fixed inset-y-0 z-50 transition-all duration-300 ease-in-out glass-sidebar hidden lg:block"
      [ngClass]="[
        currentLang() === 'ar' ? 'right-0 border-l' : 'left-0 border-r',
        isCollapsed() ? 'w-24' : 'w-72'
      ]"
    >
      <div class="h-full flex flex-col p-5">
        <!-- Logo -->
        <div class="flex items-center gap-4 mb-10 px-2 overflow-hidden whitespace-nowrap">
          <div class="w-10 h-10 bg-primary rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/30">
            <ng-icon name="faSolidUser" size="1.2rem" class="text-white" />
          </div>
          @if (!isCollapsed()) {
            <h1 class="font-bold text-lg tracking-tight animate-in fade-in slide-in-from-right-2 duration-300">خدمة الأنبا ابرام</h1>
          }
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
          @for (item of menuItems; track item.link) {
            <a 
              [routerLink]="item.link" 
              routerLinkActive="nav-item-active"
              [routerLinkActiveOptions]="{ exact: item.link === '/dashboard' }"
              class="nav-item"
              [title]="item.label | translate"
            >
              <ng-icon [name]="item.icon" size="1.2rem" class="flex-shrink-0" />
              @if (!isCollapsed()) {
                <span class="font-medium animate-in fade-in slide-in-from-right-2 duration-300">{{ item.label | translate }}</span>
              }
            </a>
          }
        </nav>

        <!-- User & Logout -->
        <div class="mt-auto pt-6 border-t border-slate-200/70 dark:border-white/10 overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-2">
             <div class="flex items-center gap-3 overflow-hidden">
               <div class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center border border-white/50 dark:border-slate-700 shadow-sm overflow-hidden">
                  <ng-icon name="faSolidUser" size="1.2rem" class="text-slate-400" />
               </div>
               @if (!isCollapsed()) {
                 <div class="flex-1 animate-in fade-in slide-in-from-right-2 duration-300 overflow-hidden text-right ltr:text-left">
                    <p class="text-xs font-bold leading-none truncate">مينا سمير</p>
                    <p class="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter font-semibold">Admin</p>
                 </div>
               }
             </div>

             <button 
               (click)="logout.emit()" 
               class="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
               [title]="'translateCommonLogout' | translate"
             >
               <ng-icon name="faSolidArrowRightFromBracket" size="1.1rem" />
             </button>
          </div>
        </div>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  isCollapsed = input.required<boolean>();
  currentLang = input.required<'ar' | 'en'>();
  logout = output<void>();

  menuItems = [
    { label: 'translateNavDashboard', link: '/dashboard', icon: 'faSolidHouse' },
    { label: 'translateNavZones', link: '/zones', icon: 'faSolidBoxesPacking' },
    { label: 'translateNavUsers', link: '/users', icon: 'faSolidUsers' },
    { label: 'translateNavImport', link: '/import', icon: 'faSolidFileImport' },
    { label: 'translateNavSettings', link: '/settings/tags', icon: 'faSolidGear' },
  ];
}
