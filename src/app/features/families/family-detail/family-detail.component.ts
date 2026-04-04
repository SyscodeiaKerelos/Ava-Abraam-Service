import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { map, switchMap } from 'rxjs/operators';
import { concat, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { faSolidArrowLeft } from '@ng-icons/font-awesome/solid';
import { AuthService } from '../../../core/auth/auth.service';
import { ZonesService } from '../../zones/services/zones.service';
import { FamiliesService } from '../services/families.service';
import { NoteTagsService } from '../../../shared/services/note-tags.service';
import { filterZonesForUser } from '../../../shared/utils/zone-access.util';
import type { Family } from '../../../shared/models/family.model';

@Component({
  selector: 'app-family-detail',
  imports: [CommonModule, TranslateModule, ButtonModule, NgIcon],
  providers: [provideIcons({ faSolidArrowLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-5 sm:p-8">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p-button
          type="button"
          (click)="onBack()"
          [label]="'translate_family-back-to-list' | translate"
          severity="secondary"
          [outlined]="true"
          styleClass="shrink-0"
        >
          <ng-template pTemplate="icon" let-iconClass="class">
            <ng-icon
              name="faSolidArrowLeft"
              [class]="(iconClass || '') + ' shrink-0 rtl:scale-x-[-1]'"
              size="1rem"
              aria-hidden="true"
            />
          </ng-template>
        </p-button>
        @if (canEdit() && canViewFamily() && family()) {
          <p-button
            type="button"
            (click)="navigateToEdit()"
            [label]="'translate_actions-edit' | translate"
            styleClass="shrink-0"
          />
        }
      </div>

      @if (family() === undefined) {
        <p class="text-muted-color">{{ 'translate_common-loading' | translate }}</p>
      } @else if (family() === null) {
        <p class="text-muted-color">{{ 'translate_family-not-found' | translate }}</p>
      } @else if (!canViewFamily()) {
        <p class="text-muted-color">{{ 'translate_family-no-access' | translate }}</p>
      } @else {
        @let f = family()!;
        <div class="space-y-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {{ f.husbandName || '—' }}
              @if (f.wifeName) {
                <span class="text-muted-color font-normal"> · {{ f.wifeName }}</span>
              }
            </h1>
            <p class="mt-1 text-sm text-muted-color">
              {{ 'translate_family-detail-subtitle' | translate }}
            </p>
          </div>

          <dl class="grid gap-4 sm:grid-cols-2">
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_zone-name' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium text-color">{{ zoneName(f.zoneId) }}</dd>
            </div>
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_family-index' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium tabular-nums text-color">{{ f.index }}</dd>
            </div>
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_family-family-code' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium text-color">{{ f.familyCode || '—' }}</dd>
            </div>
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_family-phone' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium text-color" dir="ltr">{{ f.phone || '—' }}</dd>
            </div>
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_family-monthly-aid' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium text-color">
                {{ monthlyAidKey(f.monthlyAid) | translate }}
              </dd>
            </div>
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_family-bag-size' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium text-color">
                {{ bagSizeKey(f.bagSize) | translate }}
              </dd>
            </div>
            <div
              class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_family-size' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium tabular-nums text-color">{{ f.familySize }}</dd>
            </div>
            @if (authService.isSuperAdmin()) {
              <div
                class="rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
              >
                <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                  {{ 'translate_family-education-aid' | translate }}
                </dt>
                <dd class="mt-1 text-sm font-medium tabular-nums text-color">
                  {{ f.educationAid ?? '—' }}
                </dd>
              </div>
            }
            <div
              class="sm:col-span-2 rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-color">
                {{ 'translate_family-notes' | translate }}
              </dt>
              <dd class="mt-1 text-sm font-medium text-color">
                @if (!noteLabelList(f).length) {
                  —
                } @else {
                  {{ noteLabelList(f).join('، ') }}
                }
              </dd>
            </div>
            <div
              class="sm:col-span-2 flex flex-wrap gap-4 rounded-xl border border-surface-200 bg-surface-0/60 p-4 dark:border-surface-700 dark:bg-surface-900/40"
            >
              <span class="text-sm text-color">
                <span class="text-muted-color">{{ 'translate_family-is-deceased' | translate }}:</span>
                {{ f.isDeceased ? ('translate_common-yes' | translate) : ('translate_common-no' | translate) }}
              </span>
              <span class="text-sm text-color">
                <span class="text-muted-color">{{ 'translate_family-is-hidden' | translate }}:</span>
                {{ f.isHidden ? ('translate_common-yes' | translate) : ('translate_common-no' | translate) }}
              </span>
            </div>
          </dl>
        </div>
      }
    </div>
  `,
})
export class FamilyDetailComponent {
  protected authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private familiesService = inject(FamiliesService);
  private zonesService = inject(ZonesService);
  private noteTagsService = inject(NoteTagsService);

  private zones = toSignal(this.zonesService.getAllZones(), { initialValue: [] });
  private visibleZones = computed(() =>
    filterZonesForUser(this.authService.currentUser(), this.zones()),
  );

  private noteTags = toSignal(this.noteTagsService.getAllOrdered(), { initialValue: [] });

  private noteLabelById = computed(() => {
    const m = new Map<string, string>();
    for (const t of this.noteTags()) {
      m.set(t.id, t.labelAr);
    }
    return m;
  });

  readonly family = toSignal<Family | null | undefined>(
    this.route.paramMap.pipe(
      map((p) => p.get('familyId')),
      switchMap((id) => {
        if (!id) {
          return of<Family | null>(null);
        }
        return concat(
          of<Family | null | undefined>(undefined),
          this.familiesService.getFamilyById(id),
        );
      }),
    ),
    { initialValue: undefined },
  );

  protected canViewFamily = computed(() => {
    const f = this.family();
    if (!f) {
      return true;
    }
    return this.visibleZones().some((z) => z.id === f.zoneId);
  });

  protected canEdit = computed(
    () => this.authService.isSuperAdmin() || this.authService.isAdmin(),
  );

  protected zoneName(zoneId: string): string {
    const z = this.zones().find((x) => x.id === zoneId);
    return z?.nameAr ?? zoneId;
  }

  protected monthlyAidKey(v: Family['monthlyAid']): string {
    if (v === 'ش') {
      return 'translate_family-monthly';
    }
    if (v === 'س') {
      return 'translate_family-seasonal';
    }
    return 'translate_family-monthly-aid-none';
  }

  protected bagSizeKey(v: Family['bagSize']): string {
    if (v === 'large') {
      return 'translate_family-bag-large';
    }
    if (v === 'small') {
      return 'translate_family-bag-small';
    }
    return 'translate_family-monthly-aid-none';
  }

  protected noteLabelList(f: Family): string[] {
    const map = this.noteLabelById();
    const ids = f.notes ?? [];
    return ids.map((id) => map.get(id) ?? id);
  }

  onBack(): void {
    void this.router.navigate(['/families']);
  }

  navigateToEdit(): void {
    const id = this.family()?.id;
    if (id) {
      void this.router.navigate(['/families', id, 'edit']);
    }
  }
}
