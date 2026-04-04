import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import { ZonesService } from '../../zones/services/zones.service';
import { FamiliesService } from '../services/families.service';
import { NoteTagsService } from '../../../shared/services/note-tags.service';
import { PhoneNormalizerService } from '../../../core/services/phone-normalizer.service';
import { parseZoneSheetWorkbook } from '../../../shared/excel/excel-zone-sheet.parser';
import { filterZonesForUser } from '../../../shared/utils/zone-access.util';
import { resolveNoteTagIds } from '../../../shared/utils/note-tags-resolve';
import type { ParseZoneSheetResult, ParsedFamilyRow } from '../../../shared/excel/excel-zone-sheet.types';

@Component({
  selector: 'app-family-import',
  imports: [CommonModule, TranslateModule, TableModule, ButtonModule],
  template: `
    <div class="glass-card p-5 sm:p-8">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        {{ 'translate_import-title' | translate }}
      </h1>
      <p class="mt-1 text-sm text-muted-color sm:text-base">
        {{ 'translate_import-subtitle' | translate }}
      </p>

      <ol class="mt-8 flex flex-wrap gap-2 text-sm font-semibold text-muted-color" role="list">
        <li [class.text-primary]="step() >= 1">1. {{ 'translate_import-step-upload' | translate }}</li>
        <li aria-hidden="true">/</li>
        <li [class.text-primary]="step() >= 2">2. {{ 'translate_import-step-zone' | translate }}</li>
        <li aria-hidden="true">/</li>
        <li [class.text-primary]="step() >= 3">3. {{ 'translate_import-step-preview' | translate }}</li>
      </ol>

      @if (step() === 1) {
        <div class="mt-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-color">
              {{ 'translate_import-choose-file' | translate }}
            </label>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="mt-2 block w-full max-w-md text-sm text-muted-color file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-contrast"
              (change)="onFileSelected($event)"
            />
          </div>
          @if (parseError()) {
            <p class="text-sm text-red-600 dark:text-red-400" role="alert">{{ parseError() }}</p>
          }
          @if (parsed()) {
            <div class="rounded-xl border border-surface-200 bg-surface-50/80 p-4 text-sm dark:border-surface-700 dark:bg-surface-900/40">
              <p class="font-semibold text-color">{{ 'translate_import-parsed-meta' | translate }}</p>
              <ul class="mt-2 list-inside list-disc text-muted-color">
                <li>{{ parsed()!.metadata.churchTitle }}</li>
                <li>{{ parsed()!.metadata.deaconsLine }}</li>
                <li>{{ parsed()!.metadata.zoneTitle }}</li>
                <li>
                  {{ 'translate_import-row-count' | translate }}: {{ parsed()!.rows.length }}
                </li>
              </ul>
            </div>
            <p-button
              type="button"
              (click)="step.set(2)"
              [label]="'translate_import-next' | translate"
            />
          }
        </div>
      }

      @if (step() === 2) {
        <div class="mt-6 space-y-4">
          <label class="flex max-w-md flex-col gap-1 text-sm font-medium text-color">
            {{ 'translate_select-zone' | translate }}
            <span class="text-muted-color font-normal text-xs">{{
              'translate_common-optional' | translate
            }}</span>
            <select
              class="mt-1 rounded-xl border border-surface-300 bg-surface-0 px-3 py-2 text-color dark:border-surface-600 dark:bg-surface-900"
              [value]="targetZoneId() ?? ''"
              (change)="onZonePick($event)"
            >
              <option value="">{{ 'translate_families-zone-not-set' | translate }}</option>
              @for (z of visibleZones(); track z.id) {
                <option [value]="z.id">{{ z.nameAr }}</option>
              }
            </select>
          </label>
          @if (!visibleZones().length) {
            <p class="text-sm text-muted-color">{{ 'translate_import-no-zones-hint' | translate }}</p>
          }
          <div class="flex flex-wrap gap-2">
            <p-button
              type="button"
              [outlined]="true"
              severity="secondary"
              (click)="step.set(1)"
              [label]="'translate_import-back' | translate"
            />
            <p-button
              type="button"
              (click)="step.set(3)"
              [label]="'translate_import-next' | translate"
            />
          </div>
        </div>
      }

      @if (step() === 3) {
        <div class="mt-6 space-y-4">
          @if (effectiveImportZoneId()) {
            <p class="text-sm text-muted-color">
              <span class="font-medium text-color">{{ 'translate_zone-name' | translate }}:</span>
              {{ importZoneLabel() }}
            </p>
          } @else {
            <p class="text-sm text-muted-color">{{ 'translate_import-default-zone-on-run' | translate }}</p>
          }
          <label class="flex items-center gap-2 text-sm text-color">
            <input type="checkbox" [checked]="skipNoWife()" (change)="toggleSkip($event)" />
            {{ 'translate_import-skip-no-wife' | translate }}
          </label>

          <div class="overflow-x-auto rounded-2xl">
            <p-table
              [value]="previewRows()"
              [tableStyle]="{ 'min-width': '64rem' }"
              styleClass="app-data-table w-full text-xs sm:text-sm"
              [stripedRows]="true"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th scope="col">م</th>
                  <th scope="col">{{ 'translate_family-wife-name' | translate }}</th>
                  <th scope="col">{{ 'translate_family-phone' | translate }}</th>
                  <th scope="col">{{ 'translate_import-preview-warnings' | translate }}</th>
                  <th scope="col">{{ 'translate_import-notes-unmatched' | translate }}</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-r>
                <tr>
                  <td class="tabular-nums">{{ r.index }}</td>
                  <td>{{ r.wifeName || '—' }}</td>
                  <td dir="ltr">{{ r.phone || '—' }}</td>
                  <td>{{ r.warnings.join(', ') || '—' }}</td>
                  <td>{{ r.unmatched.join('، ') || '—' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          @if (importSummary()) {
            <p class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {{ 'translate_import-done' | translate }} —
              {{ 'translate_import-written' | translate }}: {{ importSummary()!.written }},
              {{ 'translate_import-skipped' | translate }}: {{ importSummary()!.skipped }}
            </p>
          }
          @if (importError()) {
            <p class="text-sm text-red-600 dark:text-red-400" role="alert">{{ importError() }}</p>
          }

          <div class="flex flex-wrap gap-2">
            <p-button
              type="button"
              [outlined]="true"
              severity="secondary"
              (click)="step.set(2)"
              [label]="'translate_import-back' | translate"
            />
            <p-button
              type="button"
              [loading]="importing()"
              [disabled]="!parsed() || importing()"
              (click)="runImport()"
              [label]="'translate_import-run' | translate"
            />
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyImportComponent {
  private auth = inject(AuthService);
  private zonesService = inject(ZonesService);
  private familiesService = inject(FamiliesService);
  private noteTagsService = inject(NoteTagsService);
  private phoneNormalizer = inject(PhoneNormalizerService);
  private translate = inject(TranslateService);

  private zones = toSignal(this.zonesService.getAllZones(), { initialValue: [] });
  private tags = toSignal(this.noteTagsService.getAllOrdered(), { initialValue: [] });

  visibleZones = computed(() => filterZonesForUser(this.auth.currentUser(), this.zones()));

  step = signal<1 | 2 | 3>(1);
  parsed = signal<ParseZoneSheetResult | null>(null);
  parseError = signal<string | null>(null);
  targetZoneId = signal<string | null>(null);
  skipNoWife = signal(true);
  importing = signal(false);
  importSummary = signal<{ written: number; skipped: number } | null>(null);
  importError = signal<string | null>(null);

  previewRows = computed(() => {
    const p = this.parsed();
    const tags = this.tags();
    if (!p) return [];
    return p.rows.map((row) => {
      const { unmatched } = resolveNoteTagIds(row.notesRaw, tags);
      return { ...row, unmatched };
    });
  });

  /** Zone used for Firestore import: explicit pick or first visible zone. */
  effectiveImportZoneId = computed(
    () => this.targetZoneId() ?? this.visibleZones()[0]?.id ?? null,
  );

  importZoneLabel = computed(() => {
    const id = this.effectiveImportZoneId();
    if (!id) return '';
    return this.visibleZones().find((z) => z.id === id)?.nameAr ?? id;
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.parseError.set(null);
    this.parsed.set(null);
    this.importSummary.set(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buf = reader.result as ArrayBuffer;
        const result = parseZoneSheetWorkbook(buf, this.phoneNormalizer);
        this.parsed.set(result);
      } catch (e) {
        this.parseError.set(String(e));
      }
    };
    reader.readAsArrayBuffer(file);
  }

  onZonePick(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.targetZoneId.set(v || null);
  }

  toggleSkip(event: Event): void {
    this.skipNoWife.set((event.target as HTMLInputElement).checked);
  }

  async runImport(): Promise<void> {
    const p = this.parsed();
    let zoneId = this.effectiveImportZoneId();
    const uid = this.auth.currentUser()?.uid;
    const tags = this.tags();
    if (!p || !uid) return;

    this.importing.set(true);
    this.importError.set(null);
    this.importSummary.set(null);

    try {
      if (!zoneId) {
        zoneId = await this.zonesService.getOrCreateDefaultZoneId();
      }
      const writeEdu = this.auth.isSuperAdmin();
      const result = await this.familiesService.importParsedRows(
        zoneId,
        p.rows,
        (row: ParsedFamilyRow) => resolveNoteTagIds(row.notesRaw, tags).ids,
        uid,
        {
          writeEducationAid: writeEdu,
          skipRowsWithoutWife: this.skipNoWife(),
        },
      );
      this.importSummary.set(result);
    } catch (e) {
      this.importError.set(this.translate.instant('translate_import-error-failed'));
      console.error(e);
    } finally {
      this.importing.set(false);
    }
  }
}
