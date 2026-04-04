import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  type ValidatorFn,
  type AbstractControl,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { concat, of, switchMap, map } from 'rxjs';
import { take } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { faSolidArrowLeft } from '@ng-icons/font-awesome/solid';
import { AuthService } from '../../../core/auth/auth.service';
import { PhoneNormalizerService } from '../../../core/services/phone-normalizer.service';
import { ZonesService } from '../../zones/services/zones.service';
import { FamiliesService } from '../services/families.service';
import { NoteTagsService } from '../../../shared/services/note-tags.service';
import { filterZonesForUser } from '../../../shared/utils/zone-access.util';
import type { Family } from '../../../shared/models/family.model';

type FamilyFormLoadState =
  | { kind: 'loading' }
  | { kind: 'create' }
  | { kind: 'notfound' }
  | { kind: 'edit'; family: Family };

@Component({
  selector: 'app-family-form',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ButtonModule, NgIcon, InputText],
  providers: [provideIcons({ faSolidArrowLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-5 sm:p-8">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p-button
          type="button"
          (click)="navigateToFamiliesList()"
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
      </div>

      @if (loadState().kind === 'loading') {
        <p class="text-muted-color">{{ 'translate_common-loading' | translate }}</p>
      } @else if (loadState().kind === 'notfound') {
        <p class="text-muted-color">{{ 'translate_family-not-found' | translate }}</p>
      } @else {
        <div class="mb-6">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {{
              loadState().kind === 'create'
                ? ('translate_family-form-title-new' | translate)
                : ('translate_family-form-title-edit' | translate)
            }}
          </h1>
          <p class="mt-1 text-sm text-muted-color">
            {{ 'translate_family-form-subtitle' | translate }}
          </p>
        </div>

        <form [formGroup]="familyForm" (ngSubmit)="onSubmit()" class="max-w-3xl space-y-5">
          <div class="space-y-2">
            <label class="text-sm font-medium text-color" for="family-zone">
              {{ 'translate_zone-name' | translate }}
              <span class="text-muted-color font-normal">{{
                'translate_common-optional' | translate
              }}</span>
            </label>
            <select
              id="family-zone"
              formControlName="zoneId"
              class="w-full rounded-xl border border-surface-300 bg-surface-0 px-3 py-2.5 text-color dark:border-surface-600 dark:bg-surface-900"
            >
              <option value="">{{ 'translate_families-zone-not-set' | translate }}</option>
              @for (z of visibleZones(); track z.id) {
                <option [value]="z.id">{{ z.nameAr }}</option>
              }
            </select>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-medium text-color" for="family-husband">
                {{ 'translate_family-husband-name' | translate }}
              </label>
              <input
                id="family-husband"
                type="text"
                pInputText
                fluid
                formControlName="husbandName"
                class="w-full"
                [attr.aria-required]="true"
              />
              @if (familyForm.get('husbandName')?.invalid && familyForm.get('husbandName')?.touched) {
                <p class="text-xs text-red-500">{{ 'translate_errors-required' | translate }}</p>
              }
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-color" for="family-wife">
                {{ 'translate_family-wife-name' | translate }}
                <span class="text-muted-color font-normal">{{
                  'translate_common-optional' | translate
                }}</span>
              </label>
              <input
                id="family-wife"
                type="text"
                pInputText
                fluid
                formControlName="wifeName"
                class="w-full"
              />
            </div>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-medium text-color" for="family-code">
                {{ 'translate_family-family-code' | translate }}
                <span class="text-muted-color font-normal">{{
                  'translate_common-optional' | translate
                }}</span>
              </label>
              <input
                id="family-code"
                type="text"
                pInputText
                fluid
                formControlName="familyCode"
                class="w-full"
                [attr.aria-describedby]="'family-code-hint'"
              />
              <p id="family-code-hint" class="text-xs text-muted-color">
                {{ 'translate_family-family-code-tooltip' | translate }}
              </p>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-color" for="family-phone">
                {{ 'translate_family-phone' | translate }}
              </label>
              <input
                id="family-phone"
                type="tel"
                pInputText
                fluid
                formControlName="phone"
                class="w-full"
                dir="ltr"
                [attr.aria-required]="true"
              />
              @if (familyForm.get('phone')?.invalid && familyForm.get('phone')?.touched) {
                @if (familyForm.get('phone')?.errors?.['required']) {
                  <p class="text-xs text-red-500">{{ 'translate_errors-required' | translate }}</p>
                } @else if (familyForm.get('phone')?.errors?.['phoneInvalid']) {
                  <p class="text-xs text-red-500">{{ 'translate_errors-invalid-phone' | translate }}</p>
                }
              }
            </div>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-medium text-color" for="family-monthly">
                {{ 'translate_family-monthly-aid' | translate }}
              </label>
              <select
                id="family-monthly"
                formControlName="monthlyAid"
                class="w-full rounded-xl border border-surface-300 bg-surface-0 px-3 py-2.5 text-color dark:border-surface-600 dark:bg-surface-900"
              >
                <option value="">{{ 'translate_family-monthly-aid-none' | translate }}</option>
                <option value="ش">{{ 'translate_family-monthly' | translate }}</option>
                <option value="س">{{ 'translate_family-seasonal' | translate }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-color" for="family-bag">
                {{ 'translate_family-bag-size' | translate }}
              </label>
              <select
                id="family-bag"
                formControlName="bagSize"
                class="w-full rounded-xl border border-surface-300 bg-surface-0 px-3 py-2.5 text-color dark:border-surface-600 dark:bg-surface-900"
              >
                <option value="">{{ 'translate_family-monthly-aid-none' | translate }}</option>
                <option value="large">{{ 'translate_family-bag-large' | translate }}</option>
                <option value="small">{{ 'translate_family-bag-small' | translate }}</option>
              </select>
            </div>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-medium text-color" for="family-size">
                {{ 'translate_family-size' | translate }}
              </label>
              <input
                id="family-size"
                type="number"
                min="1"
                formControlName="familySize"
                class="w-full rounded-xl border border-surface-300 bg-surface-0 px-3 py-2.5 text-color dark:border-surface-600 dark:bg-surface-900"
                [attr.aria-required]="true"
              />
              @if (familyForm.get('familySize')?.invalid && familyForm.get('familySize')?.touched) {
                <p class="text-xs text-red-500">{{ 'translate_errors-min-size' | translate }}</p>
              }
            </div>
            @if (authService.isSuperAdmin()) {
              <div class="space-y-2">
                <label class="text-sm font-medium text-color" for="family-edu">
                  {{ 'translate_family-education-aid' | translate }}
                  <span class="text-muted-color font-normal">{{
                    'translate_common-optional' | translate
                  }}</span>
                </label>
                <input
                  id="family-edu"
                  type="number"
                  min="0"
                  formControlName="educationAid"
                  class="w-full rounded-xl border border-surface-300 bg-surface-0 px-3 py-2.5 text-color dark:border-surface-600 dark:bg-surface-900"
                />
              </div>
            }
          </div>

          <fieldset class="space-y-3 rounded-xl border border-surface-200 p-4 dark:border-surface-700">
            <legend class="px-1 text-sm font-medium text-color">
              {{ 'translate_family-notes' | translate }}
            </legend>
            @if (!noteTags().length) {
              <p class="text-sm text-muted-color">{{ 'translate_common-loading' | translate }}</p>
            } @else {
              <ul class="flex flex-col gap-2">
                @for (tag of noteTags(); track tag.id) {
                  <li>
                    <label class="flex cursor-pointer items-center gap-2 text-sm text-color">
                      <input
                        type="checkbox"
                        class="size-4 rounded border-surface-300"
                        [checked]="isNoteSelected(tag.id)"
                        (change)="toggleNote(tag.id, $event)"
                      />
                      <span>{{ tag.labelAr }}</span>
                    </label>
                  </li>
                }
              </ul>
            }
          </fieldset>

          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-color">
              <input
                type="checkbox"
                formControlName="isDeceased"
                class="size-4 rounded border-surface-300"
              />
              {{ 'translate_family-is-deceased' | translate }}
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-sm text-color">
              <input
                type="checkbox"
                formControlName="isHidden"
                class="size-4 rounded border-surface-300"
              />
              {{ 'translate_family-is-hidden' | translate }}
            </label>
          </div>

          @if (saveError()) {
            <p class="text-sm text-red-500" role="alert">{{ saveError()! | translate }}</p>
          }

          <div class="flex flex-wrap gap-3 pt-2">
            <p-button
              type="submit"
              [label]="'translate_actions-save' | translate"
              [disabled]="saving() || familyForm.invalid"
              [loading]="saving()"
            />
            <p-button
              type="button"
              (click)="navigateToFamiliesList()"
              [label]="'translate_actions-cancel' | translate"
              severity="secondary"
              [outlined]="true"
            />
          </div>
        </form>
      }
    </div>
  `,
})
export class FamilyFormComponent {
  protected authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private familiesService = inject(FamiliesService);
  private zonesService = inject(ZonesService);
  private phoneNormalizer = inject(PhoneNormalizerService);
  private noteTagsService = inject(NoteTagsService);

  private zones = toSignal(this.zonesService.getAllZones(), { initialValue: [] });
  protected visibleZones = computed(() =>
    filterZonesForUser(this.authService.currentUser(), this.zones()),
  );

  protected noteTags = toSignal(this.noteTagsService.getAllOrdered(), { initialValue: [] });

  private phoneValidator: ValidatorFn = (control: AbstractControl) => {
    const raw = control.value;
    const r = this.phoneNormalizer.normalize(raw);
    if (raw != null && String(raw).trim() !== '' && !r.isValid) {
      return { phoneInvalid: true };
    }
    return null;
  };

  protected familyForm = this.fb.nonNullable.group({
    zoneId: [''],
    husbandName: ['', Validators.required],
    wifeName: [''],
    familyCode: [''],
    phone: ['', [Validators.required, this.phoneValidator]],
    monthlyAid: [''],
    bagSize: [''],
    familySize: [1, [Validators.required, Validators.min(1)]],
    educationAid: [''],
    notes: this.fb.nonNullable.control<string[]>([]),
    isDeceased: [false],
    isHidden: [false],
  });

  protected loadState = toSignal(
    this.route.paramMap.pipe(
      switchMap((p) => {
        const familyId = p.get('familyId');
        if (!familyId) {
          return of<FamilyFormLoadState>({ kind: 'create' });
        }
        return concat(
          of<FamilyFormLoadState>({ kind: 'loading' }),
          this.familiesService.getFamilyById(familyId).pipe(
            take(1),
            map((f) =>
              f ? ({ kind: 'edit', family: f } as const) : ({ kind: 'notfound' } as const),
            ),
          ),
        );
      }),
    ),
    { initialValue: { kind: 'loading' } as FamilyFormLoadState },
  );

  protected saving = signal(false);
  protected saveError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const st = this.loadState();
      if (!st) {
        return;
      }
      const zoneCtl = this.familyForm.get('zoneId');
      if (st.kind === 'edit') {
        zoneCtl?.disable({ emitEvent: false });
      } else {
        zoneCtl?.enable({ emitEvent: false });
      }
    });

    effect(() => {
      const st = this.loadState();
      if (!st || st.kind !== 'create') {
        return;
      }
      const qz = this.route.snapshot.queryParamMap.get('zoneId');
      const zones = this.visibleZones();
      if (!qz || !zones.some((z) => z.id === qz)) {
        return;
      }
      if (this.familyForm.get('zoneId')?.value !== qz) {
        this.familyForm.patchValue({ zoneId: qz });
      }
    });

    effect(() => {
      const st = this.loadState();
      if (!st || st.kind !== 'edit') {
        return;
      }
      const f = st.family;
      this.familyForm.patchValue({
        zoneId: f.zoneId,
        husbandName: f.husbandName ?? '',
        wifeName: f.wifeName ?? '',
        familyCode: f.familyCode ?? '',
        phone: f.phone ?? '',
        monthlyAid: f.monthlyAid ?? '',
        bagSize: f.bagSize ?? '',
        familySize: f.familySize ?? 1,
        educationAid: f.educationAid != null ? String(f.educationAid) : '',
        notes: f.notes?.length ? [...f.notes] : [],
        isDeceased: !!f.isDeceased,
        isHidden: !!f.isHidden,
      });
    });
  }

  protected isNoteSelected(id: string): boolean {
    return this.familyForm.controls.notes.value.includes(id);
  }

  protected toggleNote(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const cur = this.familyForm.controls.notes.value;
    if (checked) {
      this.familyForm.controls.notes.setValue([...cur, id]);
    } else {
      this.familyForm.controls.notes.setValue(cur.filter((x) => x !== id));
    }
  }

  protected async onSubmit(): Promise<void> {
    this.saveError.set(null);
    this.familyForm.markAllAsTouched();
    if (this.familyForm.invalid) {
      return;
    }
    const uid = this.authService.currentUser()?.uid;
    if (!uid) {
      this.saveError.set('translate_family-save-error');
      return;
    }
    const raw = this.familyForm.getRawValue();
    const phoneNorm = this.phoneNormalizer.normalize(raw.phone).value;
    const educationAid = this.authService.isSuperAdmin()
      ? raw.educationAid === '' || raw.educationAid == null
        ? null
        : Number(raw.educationAid)
      : null;

    const st = this.loadState();
    if (!st || st.kind === 'loading' || st.kind === 'notfound') {
      return;
    }

    const existing = st.kind === 'edit' ? st.family : null;

    let resolvedZoneId = existing
      ? existing.zoneId
      : raw.zoneId.trim() || (this.visibleZones()[0]?.id ?? '');

    if (!resolvedZoneId && !existing) {
      try {
        resolvedZoneId = await this.zonesService.getOrCreateDefaultZoneId();
      } catch {
        this.saveError.set('translate_family-save-error');
        return;
      }
    }

    if (!resolvedZoneId) {
      this.saveError.set('translate_families-no-zone');
      return;
    }

    const payload = {
      zoneId: resolvedZoneId,
      husbandName: raw.husbandName,
      wifeName: raw.wifeName,
      familyCode: raw.familyCode.trim() ? raw.familyCode.trim() : null,
      phone: phoneNorm,
      monthlyAid: raw.monthlyAid === '' ? null : (raw.monthlyAid as 'ش' | 'س'),
      bagSize: raw.bagSize === '' ? null : (raw.bagSize as 'large' | 'small'),
      familySize: Number(raw.familySize),
      educationAid: this.authService.isSuperAdmin()
        ? educationAid
        : existing
          ? existing.educationAid
          : null,
      notes: raw.notes,
      isDeceased: raw.isDeceased,
      isHidden: raw.isHidden,
    };

    this.saving.set(true);
    try {
      if (existing) {
        await this.familiesService.updateFamily(existing.id, payload, uid);
        await this.router.navigate(['/families', existing.id]);
      } else {
        const id = await this.familiesService.createFamily(payload, uid);
        await this.router.navigate(['/families', id]);
      }
    } catch {
      this.saveError.set('translate_family-save-error');
    } finally {
      this.saving.set(false);
    }
  }

  navigateToFamiliesList(): void {
    void this.router.navigate(['/families']);
  }
}
