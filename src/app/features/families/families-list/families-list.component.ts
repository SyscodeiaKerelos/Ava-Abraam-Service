import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { combineLatest, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { ZonesService } from '../../zones/services/zones.service';
import { FamiliesService } from '../services/families.service';
import { filterZonesForUser } from '../../../shared/utils/zone-access.util';
import type { Family } from '../../../shared/models/family.model';

interface ZoneSelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-families-list',
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, TableModule, ButtonModule, InputText, Select],
  template: `
    <div class="glass-card p-5 sm:p-8">
      <div class="mb-6 flex flex-col gap-4 sm:mb-8 sm:gap-5">
        <header class="min-w-0">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {{ 'translate_nav-families' | translate }}
          </h1>
          <p class="mt-1 text-sm text-muted-color sm:text-base">
            {{ 'translate_families-subtitle' | translate }}
          </p>
        </header>

        <div class="w-full max-w-xl">
          <label class="sr-only" for="families-search">{{ 'translate_families-search-label' | translate }}</label>
          <input
            id="families-search"
            type="search"
            pInputText
            fluid
            class="w-full"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            [attr.placeholder]="'translate_families-search-placeholder' | translate"
            [attr.aria-label]="'translate_families-search-label' | translate"
          />
        </div>

        <div
          class="flex w-full flex-col gap-4 border-t border-slate-200/80 pt-4 dark:border-white/10 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:pt-5"
        >
          <div class="flex min-w-0 w-full flex-col gap-1.5 sm:w-auto sm:min-w-[min(100%,16rem)] sm:max-w-md sm:flex-1">
            <label class="text-start text-sm font-medium text-color" for="families-zone-select">
              {{ 'translate_families-filter-zone' | translate }}
            </label>
            <p-select
              inputId="families-zone-select"
              class="w-full"
              styleClass="w-full"
              [options]="zoneSelectOptions()"
              optionLabel="label"
              optionValue="value"
              [dataKey]="'value'"
              [ngModel]="zoneFilterSelectValue()"
              (ngModelChange)="onZoneFilterChange($event)"
              [disabled]="!visibleZones().length"
              [placeholder]="'translate_families-no-zone' | translate"
              [appendTo]="'body'"
              [attr.aria-label]="'translate_families-filter-zone' | translate"
            />
          </div>
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            @if (authService.isSuperAdmin() || authService.isAdmin()) {
              <p-button
                type="button"
                (click)="navigateToAddFamily()"
                [label]="'translate_families-add-family' | translate"
                styleClass="w-full shrink-0 sm:!min-h-[42px] sm:!w-auto"
              />
            }
            <p-button
              type="button"
              (click)="navigateToZones()"
              [outlined]="true"
              severity="secondary"
              [label]="'translate_families-open-zones' | translate"
              styleClass="w-full shrink-0 sm:!min-h-[42px] sm:!w-auto"
            />
          </div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl">
        <p-table
          [value]="filteredFamilies()"
          [tableStyle]="{ 'min-width': '56rem' }"
          [stripedRows]="true"
          [rowHover]="true"
          responsiveLayout="scroll"
          styleClass="app-data-table w-full text-sm"
        >
          <ng-template pTemplate="header">
            <tr>
              <th scope="col" class="text-muted-color font-semibold">م</th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_family-husband-name' | translate }}
              </th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_family-wife-name' | translate }}
              </th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_family-family-code' | translate }}
              </th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_family-phone' | translate }}
              </th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_family-monthly-aid' | translate }}
              </th>
              <th scope="col" class="text-muted-color font-semibold">
                {{ 'translate_family-size' | translate }}
              </th>
              @if (authService.isSuperAdmin()) {
                <th scope="col" class="text-muted-color font-semibold">
                  {{ 'translate_family-education-aid' | translate }}
                </th>
              }
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr class="transition-colors duration-200">
              <td class="tabular-nums text-color">{{ row.index }}</td>
              <td class="text-color">
                <a
                  [routerLink]="['/families', row.id]"
                  class="font-medium text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {{ row.husbandName || '—' }}
                </a>
              </td>
              <td class="font-medium text-color">{{ row.wifeName || '—' }}</td>
              <td class="text-muted-color">{{ row.familyCode || '—' }}</td>
              <td class="text-muted-color" dir="ltr">{{ row.phone || '—' }}</td>
              <td class="text-muted-color">{{ row.monthlyAid || '—' }}</td>
              <td class="tabular-nums text-muted-color">{{ row.familySize }}</td>
              @if (authService.isSuperAdmin()) {
                <td class="tabular-nums text-muted-color">
                  {{ row.educationAid ?? '—' }}
                </td>
              }
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td [attr.colspan]="authService.isSuperAdmin() ? 8 : 7" class="p-10 text-center text-muted-color">
                @if (!visibleZones().length) {
                  {{ 'translate_families-no-zone' | translate }}
                } @else if (displayedFamilies().length > 0 && filteredFamilies().length === 0) {
                  {{ 'translate_families-search-empty' | translate }}
                } @else {
                  {{ emptyMessage() | translate }}
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamiliesListComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private zonesService = inject(ZonesService);
  private familiesService = inject(FamiliesService);

  private zones = toSignal(this.zonesService.getAllZones(), { initialValue: [] });

  visibleZones = computed(() => filterZonesForUser(this.authService.currentUser(), this.zones()));

  /** When set, table shows only families in this zone; when null, all visible zones. */
  zoneFilterId = signal<string | null>(null);

  zoneFilterSelectValue = computed(() => this.zoneFilterId() ?? '');

  zoneSelectOptions = computed<ZoneSelectOption[]>(() => {
    const allLabel = this.translate.instant('translate_families-all-zones');
    const head: ZoneSelectOption[] = [{ label: allLabel, value: '' }];
    return head.concat(this.visibleZones().map((z) => ({ label: z.nameAr, value: z.id })));
  });

  searchQuery = signal('');

  private visibleZoneIds = computed(() => this.visibleZones().map((z) => z.id));

  /** All families across zones the user can access. */
  families = toSignal(
    toObservable(this.visibleZoneIds).pipe(
      switchMap((ids) => {
        if (ids.length === 0) {
          return of([] as Family[]);
        }
        return combineLatest(ids.map((id) => this.familiesService.getFamiliesByZone(id))).pipe(
          map((lists) => {
            const merged = lists.flat() as Family[];
            return merged.sort((a, b) => {
              if (a.zoneId !== b.zoneId) {
                return a.zoneId.localeCompare(b.zoneId);
              }
              return a.index - b.index;
            });
          }),
        );
      }),
    ),
    { initialValue: [] as Family[] },
  );

  displayedFamilies = computed(() => {
    const z = this.zoneFilterId();
    const all = this.families();
    if (!z) {
      return all;
    }
    return all.filter((f) => f.zoneId === z);
  });

  filteredFamilies = computed(() => {
    const list = this.displayedFamilies();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return list;
    }
    const qDigits = q.replace(/\D/g, '');
    return list.filter((f) => {
      const husband = (f.husbandName ?? '').toLowerCase();
      const wife = (f.wifeName ?? '').toLowerCase();
      const code = (f.familyCode ?? '').toLowerCase();
      const phoneRaw = f.phone ?? '';
      const phoneDigits = phoneRaw.replace(/\D/g, '');
      const phoneLower = phoneRaw.toLowerCase();
      return (
        husband.includes(q) ||
        wife.includes(q) ||
        code.includes(q) ||
        phoneLower.includes(q) ||
        (qDigits.length > 0 && phoneDigits.includes(qDigits))
      );
    });
  });

  emptyMessage = computed(() => 'translate_families-empty');

  constructor() {
    effect(() => {
      const list = this.visibleZones();
      const cur = this.zoneFilterId();
      if (list.length === 0) {
        this.zoneFilterId.set(null);
        return;
      }
      if (cur && !list.some((z) => z.id === cur)) {
        this.zoneFilterId.set(null);
      }
    });
  }

  onZoneFilterChange(value: string | null | undefined): void {
    this.zoneFilterId.set(value == null || value === '' ? null : value);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  navigateToAddFamily(): void {
    const z = this.zoneFilterId();
    void this.router.navigate(['/families', 'new'], {
      queryParams: z ? { zoneId: z } : {},
    });
  }

  navigateToZones(): void {
    void this.router.navigate(['/zones']);
  }
}
