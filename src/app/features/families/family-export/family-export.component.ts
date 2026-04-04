import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { toSignal } from '@angular/core/rxjs-interop';
import * as XLSX from 'xlsx';
import { AuthService } from '../../../core/auth/auth.service';
import { ZonesService } from '../../zones/services/zones.service';
import { FamiliesService } from '../services/families.service';
import { NoteTagsService } from '../../../shared/services/note-tags.service';
import { buildZoneSheetMatrix } from '../../../shared/excel/excel-zone-sheet.builder';
import { filterZonesForUser } from '../../../shared/utils/zone-access.util';
import type { Zone } from '../../../shared/models/zone.model';
import type { Family } from '../../../shared/models/family.model';
import type { NoteTag } from '../../../shared/models/note-tag.model';

function sanitizeSheetName(name: string): string {
  const t = name.replace(/[\\/?*[\]:]/g, '_').slice(0, 31);
  return t || 'Sheet';
}

function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || 'export';
}

@Component({
  selector: 'app-family-export',
  imports: [CommonModule, TranslateModule, ButtonModule],
  template: `
    <div class="glass-card p-5 sm:p-8">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        {{ 'translate_export-title' | translate }}
      </h1>
      <p class="mt-1 text-sm text-muted-color sm:text-base">
        {{ 'translate_export-subtitle' | translate }}
      </p>

      <div class="mt-8 flex max-w-xl flex-col gap-4">
        <label class="flex flex-col gap-1 text-sm font-medium text-color">
          {{ 'translate_export-zone' | translate }}
          <select
            class="rounded-xl border border-surface-300 bg-surface-0 px-3 py-2 text-color dark:border-surface-600 dark:bg-surface-900"
            [value]="exportMode()"
            (change)="onModeChange($event)"
          >
            @for (z of visibleZones(); track z.id) {
              <option [value]="'z:' + z.id">{{ z.nameAr }}</option>
            }
            <option value="all">{{ 'translate_export-all-zones' | translate }}</option>
          </select>
        </label>

        @if (authService.isSuperAdmin()) {
          <label class="flex items-center gap-2 text-sm text-color">
            <input
              type="checkbox"
              [checked]="includeEducationAid()"
              (change)="includeEducationAid.set(($any($event.target).checked))"
            />
            {{ 'translate_export-include-edu' | translate }}
          </label>
        }

        @if (exportError()) {
          <p class="text-sm text-red-600 dark:text-red-400" role="alert">{{ exportError() }}</p>
        }

        <p-button
          type="button"
          [loading]="exporting()"
          (click)="download()"
          [label]="'translate_export-download' | translate"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyExportComponent {
  protected authService = inject(AuthService);
  private zonesService = inject(ZonesService);
  private familiesService = inject(FamiliesService);
  private noteTagsService = inject(NoteTagsService);
  private translate = inject(TranslateService);

  private zones = toSignal(this.zonesService.getAllZones(), { initialValue: [] });
  private tags = toSignal(this.noteTagsService.getAllOrdered(), { initialValue: [] });

  visibleZones = computed(() => filterZonesForUser(this.authService.currentUser(), this.zones()));

  /** `z:{id}` or `all` */
  exportMode = signal<string>('');

  includeEducationAid = signal(false);
  exporting = signal(false);
  exportError = signal<string | null>(null);

  private tagById = computed(() => {
    const m = new Map<string, NoteTag>();
    for (const t of this.tags()) {
      m.set(t.id, t);
    }
    return m;
  });

  constructor() {
    effect(() => {
      const list = this.visibleZones();
      const cur = this.exportMode();
      if (list.length === 0) {
        this.exportMode.set('');
        return;
      }
      if (!cur || cur === 'all') {
        if (!cur) {
          this.exportMode.set(`z:${list[0].id}`);
        }
      } else if (cur.startsWith('z:')) {
        const id = cur.slice(2);
        if (!list.some((z) => z.id === id)) {
          this.exportMode.set(`z:${list[0].id}`);
        }
      }
    });

    queueMicrotask(() => {
      if (this.authService.isSuperAdmin()) {
        this.includeEducationAid.set(true);
      }
    });
  }

  onModeChange(event: Event): void {
    this.exportMode.set((event.target as HTMLSelectElement).value);
  }

  private metadataForZone(zone: Zone): {
    churchTitle: string;
    deaconsLine: string;
    zoneTitle: string;
  } {
    const deacons = zone.deacons?.length
      ? this.translate.instant('translate_excel-deacons-prefix') + zone.deacons.join(' + ')
      : '';
    return {
      churchTitle: this.translate.instant('translate_excel-default-church'),
      deaconsLine: deacons,
      zoneTitle: zone.nameAr,
    };
  }

  private noteResolver(): (f: Family) => string {
    const map = this.tagById();
    const lang = this.translate.getCurrentLang();
    return (f: Family) =>
      (f.notes ?? [])
        .map((id) => {
          const t = map.get(id);
          if (!t) return '';
          return lang === 'ar' || lang.startsWith('ar') ? t.labelAr : t.labelEn || t.labelAr;
        })
        .filter(Boolean)
        .join('، ');
  }

  async download(): Promise<void> {
    this.exportError.set(null);
    this.exporting.set(true);
    const mode = this.exportMode();
    const zones = this.visibleZones();
    const includeEdu = this.authService.isSuperAdmin() && this.includeEducationAid();

    try {
      if (mode === 'all') {
        const wb = XLSX.utils.book_new();
        for (const zone of zones) {
          const families = await this.familiesService.getFamiliesByZoneOnce(zone.id);
          const matrix = buildZoneSheetMatrix(this.metadataForZone(zone), families, {
            includeEducationAid: includeEdu,
            noteLabelResolver: this.noteResolver(),
          });
          const ws = XLSX.utils.aoa_to_sheet(matrix);
          XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(zone.nameAr));
        }
        XLSX.writeFile(wb, `families-all-${safeFilename('export')}.xlsx`, { bookType: 'xlsx' });
      } else if (mode.startsWith('z:')) {
        const zoneId = mode.slice(2);
        const zone = zones.find((z) => z.id === zoneId);
        if (!zone) {
          this.exportError.set(this.translate.instant('translate_export-error-no-zone'));
          return;
        }
        const families = await this.familiesService.getFamiliesByZoneOnce(zoneId);
        const wb = XLSX.utils.book_new();
        const matrix = buildZoneSheetMatrix(this.metadataForZone(zone), families, {
          includeEducationAid: includeEdu,
          noteLabelResolver: this.noteResolver(),
        });
        const ws = XLSX.utils.aoa_to_sheet(matrix);
        XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(zone.nameAr));
        XLSX.writeFile(wb, `families-${safeFilename(zone.nameEn || zone.nameAr)}.xlsx`, {
          bookType: 'xlsx',
        });
      }
    } catch (e) {
      this.exportError.set(this.translate.instant('translate_export-error-failed'));
      console.error(e);
    } finally {
      this.exporting.set(false);
    }
  }
}
