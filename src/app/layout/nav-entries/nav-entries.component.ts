import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { filter, map, merge, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { visibleNavEntries, type AppNavEntry } from '../nav.config';
import {
  faSolidHouse,
  faSolidUsers,
  faSolidBoxesPacking,
  faSolidGear,
  faSolidHouseChimneyUser,
  faSolidFileImport,
  faSolidFileExport,
  faSolidChevronDown,
} from '@ng-icons/font-awesome/solid';

@Component({
  selector: 'app-nav-entries',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, NgIcon],
  providers: [
    provideIcons({
      faSolidHouse,
      faSolidUsers,
      faSolidBoxesPacking,
      faSolidGear,
      faSolidHouseChimneyUser,
      faSolidFileImport,
      faSolidFileExport,
      faSolidChevronDown,
    }),
  ],
  template: `
    @for (entry of entries(); track trackEntry(entry)) {
      @if (entry.kind === 'link') {
        <a
          [routerLink]="entry.link"
          routerLinkActive="nav-item-active"
          [routerLinkActiveOptions]="{ exact: entry.link === '/dashboard' }"
          class="nav-item"
          [title]="entry.labelKey | translate"
          (click)="onNavigate()"
        >
          <ng-icon [name]="entry.icon" size="1.2rem" class="shrink-0" aria-hidden="true" />
          @if (!isCollapsed()) {
            <span class="truncate">{{ entry.labelKey | translate }}</span>
          }
        </a>
      } @else {
        <div class="flex flex-col gap-0.5">
          <div class="flex min-w-0 items-stretch gap-0.5">
            @if (!isCollapsed() && entry.children.length > 0) {
              <button
                type="button"
                class="flex w-9 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100/90 hover:text-primary dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-primary-300"
                [attr.aria-expanded]="familiesGroupOpen()"
                [attr.aria-label]="entry.labelKey | translate"
                (click)="toggleFamiliesGroup()"
              >
                <ng-icon
                  name="faSolidChevronDown"
                  size="0.85rem"
                  class="transition-transform duration-200"
                  [class.-rotate-90]="!familiesGroupOpen()"
                  aria-hidden="true"
                />
              </button>
            }
            <a
              [routerLink]="entry.link"
              [class.nav-item-active]="isFamiliesSectionActive()"
              class="nav-item min-w-0 flex-1"
              [title]="entry.labelKey | translate"
              (click)="onNavigate()"
            >
              <ng-icon [name]="entry.icon" size="1.2rem" class="shrink-0" aria-hidden="true" />
              @if (!isCollapsed()) {
                <span class="truncate">{{ entry.labelKey | translate }}</span>
              }
            </a>
          </div>
          @if (!isCollapsed() && entry.children.length > 0 && familiesGroupOpen()) {
            <ul class="nav-item-children flex list-none flex-col gap-0.5 ps-0" role="list">
              @for (child of entry.children; track child.link) {
                <li>
                  <a
                    [routerLink]="child.link"
                    routerLinkActive="nav-item-active"
                    class="nav-item nav-item-child"
                    [title]="child.labelKey | translate"
                    (click)="onNavigate()"
                  >
                    <ng-icon [name]="child.icon" size="1.05rem" class="shrink-0" aria-hidden="true" />
                    <span class="truncate">{{ child.labelKey | translate }}</span>
                  </a>
                </li>
              }
            </ul>
          }
        </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavEntriesComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  isCollapsed = input(false);
  closeDrawerOnNavigate = input(false);
  navigated = output<void>();

  private urlPath = toSignal(
    merge(
      of(this.normalizeUrl(this.router.url)),
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => this.normalizeUrl(this.router.url)),
      ),
    ),
    { initialValue: this.normalizeUrl(this.router.url) },
  );

  entries = computed(() => visibleNavEntries(this.authService.currentUserRole()));

  familiesGroupOpen = signal(true);

  isFamiliesSectionActive = computed(() => {
    const u = this.urlPath();
    return (
      u === '/families' ||
      u.startsWith('/families/') ||
      u === '/import' ||
      u === '/export'
    );
  });

  toggleFamiliesGroup(): void {
    this.familiesGroupOpen.update((v) => !v);
  }

  trackEntry(entry: AppNavEntry): string {
    return entry.kind === 'link' ? entry.link : `${entry.link}:group`;
  }

  private normalizeUrl(url: string): string {
    const path = url.split('?')[0] ?? url;
    return path || '/';
  }

  onNavigate(): void {
    if (this.closeDrawerOnNavigate()) {
      this.navigated.emit();
    }
  }
}
