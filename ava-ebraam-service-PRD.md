# ava-ebraam-service — Product Requirements Document
> خدمة الأنبا ابرام | v1.2

---

## 1. Data Analysis Summary

### Sheets (Zones)
| Sheet | Zone | Deacons | Families | Monthly Aid |
|---|---|---|---|---|
| الحكر 1 - بولا شفا | هدي شعراوي - الحكر 1 | مينا سمير + بولا شفا + عماد ميلاد | 27 | 17 |
| هدي الشعراوي - مينا رومانى | هدي شعراوي - الحكر 2 | البيروهيب + توماس طلعت + مينا رومانى | 24 | 13 |
| الحكر 3 - جورج عطا | هدي شعراوي - الحكر 3 | كيرلس سامى + جورج عطا | 27 | 9 |
| ش المخبز الآلي - رفيق مكرم | ش المخبز الآلي - ش رضا | دميان زغلول + رفيق مكرم | 32 | 17 |
| المستشفي - بيشوى ظريف | ش المستشفي | ابانوب رافت + بيشوى ظريف | 30 | 20 |
| منصورة - طنطا 1 - مينا عونى | ش طنطا - منصورة - دمنهور 1 | مينا عونى + حنا زغلول | 24 | 10 |
| دمنهور - منصورة - بيشوى عزمى | ش طنطا - منصورة - دمنهور 2 | مرقس عادل + بيشوى عزمى | 28 | 17 |
| الكنيسة - دميانة | بجوار كنيسة | رومانى السمان + دميانه | 30 | 18 |

**Total Families: ~222 | Total Members: ~900+**

### Column Schema
| Column | Arabic Label | Type | Notes |
|---|---|---|---|
| م | Row # | integer | Auto-index per zone |
| اسم الزوج | Husband name | string | May include المرحوم/متوفي prefix |
| اسم الزوجة | Wife name | string | May be sole member (widow) |
| كود الأسرة | Family code | string (optional) | External reference, searchable, not unique |
| تليفون الأب / الزوج | Husband phone | string | Normalized: 01XXXXXXXXX; optional if widow |
| تليفون الأم / الزوجة | Wife phone | string | Normalized: 01XXXXXXXXX |
| التليفون (موحّد) | Primary phone | string | **Legacy / import:** single column maps here; app may duplicate to husband or wife |
| شهريات | Monthly aid | enum | ش=monthly, س=seasonal, blank=none |
| عدد أفراد الأسرة | Family size | integer | Total household members (may align with 2 parents + children count) |
| عدد الأطفال | Children count | integer | Number of dependent children in household |
| تعليم كل طفل | Per-child education | structured | One row per child or inline list: level, school year, institution, fees if tracked |
| عمل الزوج | Husband job / work | string | Employer, role, informal work, unemployed, retired, deceased N/A |
| عمل الزوجة | Wife job / work | string | Same semantics as husband |
| تفاصيل السكن | Housing details | structured | Floor/level, room count, area (m²), monthly rent, tenure (owned/rented) |
| الحالة الصحية | Health (per person) | structured | Per member: husband, wife, each child — chronic conditions, medications, disabilities, hospitalizations, notes |
| دخل الأسرة | Family income | structured | Monthly totals + breakdown: wages, pension, social aid, other |
| مصروفات الأسرة | Family expenses | structured | Monthly breakdown: rent, education, medical, utilities, food, transport, debt, other |
| حجم الكيس | Bag size | enum | كبير=large, صغير=small — stored per family |
| الدراسيه | Education aid | number (optional) | Super admin only |
| ملاحظات | Notes | enum+custom | e.g. ابو مقار, مناسبات, أ/نبيل |

### Totals Row (pinned bottom of each zone)
- عدد الأسر بالمنطقة — total family count
- عدد الشهريات — count with monthlyAid = ش
- إجمالي الأفراد — sum of familySize
- إجمالي الأطفال (اختياري) — sum of `childrenCount` when column enabled
- الأكياس الكبيرة — count of bagSize = large
- الأكياس الصغيرة — count of bagSize = small

### Extended household profile (v1.2)
The product stores a **rich household profile** for pastoral and aid decisions, in addition to the legacy sheet columns:

| Domain | Requirement |
|---|---|
| **Children** | Persist **children count** and, for **each child**, education: level (e.g. غير ملتحق، ابتدائي، إعدادي، ثانوي، جامعي)، grade/year if applicable, school or program name, and optional notes (special needs, dropout risk). |
| **Parents’ work** | **Husband job** and **wife job**: occupation, employer or self-employed description, employment status (يعمل / عاطل / متقاعد / ربة منزل / لا ينطبق), and free-text detail. |
| **Housing** | **Place of residence**: address or area text (no need for full GPS in v1); **floor/level** (الدور); **number of rooms**; **dwelling size** (e.g. m²); **monthly rent** (or 0 if owned); optional: utilities arrangement, housing condition notes. |
| **Health** | For **each household member** (husband, wife, each child): structured or semi-structured detail — general status, chronic illnesses, medications, disabilities, recent surgeries/hospitalizations, insurance/coverage notes. Sensitive data: restrict visibility per role if required by policy (default: same as family record — admin+). |
| **Income & expenses** | **Income**: total monthly (optional computed), breakdown lines — wages, pension, تكافل/معاش، مساعدات أخرى، إيجار مستلم (إن وُجد)، أي مصدر آخر مع المبلغ. **Expenses (outcomes)**: **إيجار، تعليم، علاج/أدوية، مرافق، غذاء، مواصلات، ديون، مناسبات، أخرى** — each with amount and optional note. |
| **Parent phones** | **Two distinct fields**: husband phone and wife phone, both normalized like today’s rule. Legacy imports with one column map to **primary phone**; super_admin or admin can split into both fields in the UI. |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals) |
| Firebase | AngularFire v8+ (Firestore, Auth) |
| UI | PrimeNG 17+ |
| Icons | ng-icons |
| Styling | Tailwind CSS v4 |
| i18n | ngx-translate — `src/assets/i18n/` |
| State | Angular Signals + RxJS |
| Forms | Angular Reactive Forms |
| Excel I/O | SheetJS (xlsx) |
| Code Quality | ESLint + Prettier |

---

## 3. Firebase Data Model

### `/users/{uid}`
```typescript
{
  uid: string
  email: string
  displayName: string
  role: 'super_admin' | 'admin' | 'viewer'
  assignedZoneIds: string[]   // empty = all (super_admin)
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `/zones/{zoneId}`
```typescript
{
  id: string
  nameAr: string
  nameEn: string
  description: string
  deacons: string[]
  isHidden: boolean
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `/families/{familyId}`
```typescript
// Child education entry — one per child (length should align with childrenCount when both set)
type ChildEducation = {
  name?: string                    // optional display name
  educationLevel: string           // e.g. none | primary | preparatory | secondary | university | vocational | illiterate (use app enums + i18n)
  gradeOrYear?: string
  institution?: string
  monthlyFees?: number | null
  notes?: string
}

type HealthProfile = {
  relation: 'husband' | 'wife' | 'child'
  childIndex?: number              // 0-based when relation === 'child'
  generalStatus?: string           // free text: مستقر، يحتاج متابعة، إلخ
  chronicConditions?: string
  medications?: string
  disabilities?: string
  hospitalizationsOrSurgeries?: string
  insuranceNotes?: string
}

type MoneyLineItem = {
  label: string                   // canonical key or free text for "other"
  amount: number                  // monthly EGP (or app currency)
  notes?: string
}

{
  id: string
  zoneId: string
  index: number
  husbandName: string
  wifeName: string
  familyCode: string | null       // optional, external ref, searchable

  // Phones — v1.2: parents distinguished; legacy single field kept for import/backfill
  phone: string | null            // primary / legacy normalized 01XXXXXXXXX
  husbandPhone: string | null     // normalized; optional
  wifePhone: string | null        // normalized

  monthlyAid: 'ش' | 'س' | null
  bagSize: 'large' | 'small' | null
  familySize: number

  // Parents’ work
  husbandJob: string | null       // occupation + detail
  wifeJob: string | null

  // Children
  childrenCount: number           // denormalized count; should match children.length when array used
  children: ChildEducation[]      // education per child

  // Housing
  housing: {
    addressOrArea: string | null  // text description of where they live
    floorLevel: string | null     // e.g. "الأرضي", "3", "بلا دور محدد"
    roomCount: number | null
    areaSqm: number | null
    monthlyRent: number | null    // 0 or null if owned / no rent
    tenure: 'rented' | 'owned' | 'relative' | 'other' | null
    conditionNotes: string | null
  } | null

  // Health — one profile per person (husband, wife, each child index)
  healthProfiles: HealthProfile[]

  // Income & expenses (monthly)
  income: {
    totalMonthly: number | null    // optional; may be sum of lineItems
    lineItems: MoneyLineItem[]     // wages, pension, aid, other
  } | null
  expenses: {
    lineItems: MoneyLineItem[]     // rent, education, medical, utilities, food, transport, debt, other
  } | null

  educationAid: number | null     // super_admin read/write only (church aid field, distinct from school fees in children[])
  notes: string[]                 // array of noteTags IDs
  isDeceased: boolean
  isHidden: boolean               // super_admin only
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
  updatedBy: string
}
```

### `/noteTags/{tagId}`
```typescript
{
  id: string
  labelAr: string
  labelEn: string
  order: number
  isSystem: boolean   // ابو مقار, مناسبات — protected from delete
}
```

### Firestore Composite Indexes
```
families: (zoneId, isHidden, index)
families: (zoneId, monthlyAid)
families: (zoneId, bagSize)
families: (zoneId, familySize)
families: (zoneId, childrenCount)   // optional, if filtered/sorted
families: (familyCode)
```

**Privacy note:** Health and detailed financial fields may require stricter rules later (e.g. super_admin-only read for `healthProfiles`); v1.2 assumes same access as the family document unless policy dictates otherwise.

---

## 4. Authentication & Authorization

- Email + password via Firebase Auth — no self-registration
- Accounts created by super_admin only
- Session: `browserLocalPersistence`
- Custom Firebase Auth claims enforce roles server-side

### Role Matrix
| Feature | Viewer | Admin | Super Admin |
|---|---|---|---|
| View assigned zones | ✅ | ✅ | ✅ |
| View all zones | ❌ | ❌ | ✅ |
| View hidden zones/families | ❌ | ❌ | ✅ |
| View education aid | ❌ | ❌ | ✅ |
| Add / Edit / Delete families | ❌ | ✅ | ✅ |
| Import / Export Excel | ❌ | ✅ | ✅ |
| Manage zones | ❌ | ✅ | ✅ |
| Toggle visibility (hidden) | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Manage note tags | ❌ | ❌ | ✅ |

---

## 5. Routing

```
/login
/dashboard
/zones
/zones/:zoneId
/zones/:zoneId/families/:familyId        (read-only detail — children, housing, health, finances)
/zones/:zoneId/families/add
/zones/:zoneId/families/:familyId/edit
/users                     (super_admin)
/import
/settings/tags             (super_admin)
```

All routes except `/login` use `AuthGuard`. Role-restricted routes use `RoleGuard`. All feature routes are **lazy-loaded**.

---

## 6. Pages

### 6.1 Login
- RTL centered card, email + password, show/hide toggle
- Translated error messages, redirect to `/dashboard` on success

### 6.2 Dashboard
- Summary cards: zones, families, members, monthly aid count
- Bar chart: families per zone (PrimeNG `p-chart`)
- Pie chart: aid distribution (ش / س / none)
- Quick links to each zone

### 6.3 Zones List
- `p-table`: zone name, deacons, family count, monthly aid count, hidden badge, actions
- Add / Edit / Delete via `p-dialog`
- Hidden zones shown with badge to super_admin only

### 6.4 Zone Detail (main sheet view)

**Header** (mirrors Excel): Church name · Deacons · Zone name

**Search & Filter bar:**
- Global text search: husband, wife, family code, **husband phone, wife phone, legacy phone**, notes, jobs, housing address text, health free-text fields (optional / performance-sensitive — may be post-MVP)
- شهريات filter: all / ش / س / none
- ملاحظات filter: multi-select tags
- Family size range filter
- Toggle: deceased only
- Toggle: show hidden (super_admin)

**Families Table (`p-table` with virtual scroll):**
| Column | Who Sees It |
|---|---|
| م, اسم الزوج, اسم الزوجة, كود الأسرة | All |
| تليفون الزوج، تليفون الزوجة (أو التليفون الموحّد إن لم يُفصل) | All |
| شهريات, حجم الكيس, عدد الأفراد, **عدد الأطفال**, ملاحظات | All |
| **ملخص سريع** (اختياري): عمل الزوج/الزوجة، الإيجار، مؤشر صحي — أيقونة أو شارة | All (التفاصيل الكاملة في النموذج أو صفحة التفاصيل) |
| الدراسيه | Super admin only |
| Actions (edit/delete/hide) | Admin + Super admin |

**Detail / expanded row or family detail route (recommended for wide data):** full **children list + education**, **jobs**, **housing**, **health per person**, **income/expense breakdown** — avoids overcrowding the zone sheet table.

- Deceased rows: muted style
- Hidden rows: lock icon, super_admin only
- `OnPush` change detection, virtual scroll

**Pinned Totals Row:** عدد الأسر · عدد الشهريات · إجمالي الأفراد · إجمالي الأطفال (اختياري) · الأكياس الكبيرة · الأكياس الصغيرة

### 6.5 Add / Edit Family (p-dialog)

| Field | Type | Notes |
|---|---|---|
| اسم الزوج | text | Optional (widow entry) |
| اسم الزوجة | text | **Required** |
| كود الأسرة | text | Optional — tooltip: "رقم مرجعي لتطبيق آخر، يمكن استخدامه في البحث" |
| تليفون الزوج | text | Auto-normalized on blur; optional |
| تليفون الزوجة | text | Auto-normalized on blur |
| التليفون (أساسي) | text | Optional legacy single field; if only one number known, can mirror to both parents |
| شهريات | dropdown | ش / س / none |
| حجم الكيس | dropdown | كبير / صغير / none |
| عدد أفراد الأسرة | p-inputNumber | min 1 |
| عدد الأطفال | p-inputNumber | min 0; syncing with repeated child-education rows is UX-validated |
| عمل الزوج / عمل الزوجة | textarea or text | Jobs, employer, status |
| **الأطفال والتعليم** | repeater (dynamic rows) | Per row: اسم اختياري، المرحلة الدراسية، الصف/السنة، المدرسة/الجهة، مصاريف شهرية، ملاحظات |
| **السكن** | field group | منطقة/عنوان نصي، الدور، عدد الغرف، المساحة (م²)، الإيجار الشهري، ملكية/إيجار/مع أقارب، ملاحظات |
| **الصحة** | tabs or accordion | قسم لكل فرد: الزوج، الزوجة، طفل 1…ن — حقول تفصيلية حسب `HealthProfile` |
| **الدخل والمصروفات** | two repeaters or categorized inputs | بنود دخل شهرية؛ بنود مصروف: إيجار، تعليم، علاج، مرافق، غذاء، مواصلات، ديون، أخرى |
| الدراسيه | p-inputNumber | Optional — super_admin only (مساعدة الكنيسة، ليست مصروف المدرسة بالضرورة) |
| متوفي | checkbox | |
| ملاحظات | p-multiSelect | From noteTags |
| مرئي | toggle | super_admin only |

**UX:** Use a **stepper or tabbed dialog** if the form exceeds viewport height; validate `children.length` vs `childrenCount` with clear messaging.

### 6.5.1 Family profile detail (`/zones/:zoneId/families/:familyId`)
- Read-focused layout (admin may link to **Edit**): sections for **contact** (both parent phones), **parents’ jobs**, **children count** and **per-child education**, **housing** (area, floor, rooms, rent, tenure, notes), **health** (accordion per person with full `HealthProfile` fields), **monthly income** and **expenses** with category totals (إيجار، تعليم، علاج، مرافق، غذاء، مواصلات، ديون، أخرى).
- Print-friendly optional export of this view in a later iteration.

### 6.6 Users Management (super_admin)
- `p-table`: name, email, role, zones, status
- Create user: name, email, temp password, role, assignedZoneIds
- Edit role + zones, deactivate (no hard delete)

### 6.7 Import Excel — 3 Steps

**Step 1:** Upload `.xlsx` → auto-detect sheets → map each sheet to zone

**Step 2:** Preview parsed rows with per-row validation; conflict options: skip / overwrite by familyCode

**Step 3:** Confirm → batched Firestore writes (500/batch) with progress bar

**Column mapping:**
| Excel | Firestore |
|---|---|
| اسم الزوج | husbandName |
| اسم الزوجة | wifeName |
| كود الأسرة | familyCode |
| التليفون | phone (normalized) — legacy; optional columns تليفون الزوج / تليفون الزوجة |
| تليفون الزوج / جوال الأب | husbandPhone |
| تليفون الزوجة / جوال الأم | wifePhone |
| شهريات | monthlyAid |
| عدد أفراد الأسرة | familySize |
| عدد الأطفال | childrenCount |
| أعمدة تعليم الأطفال | children[] (parser: multiple columns or delimited rows — spec per import template) |
| عمل الزوج / عمل الزوجة | husbandJob / wifeJob |
| عنوان السكن / الدور / عدد الغرف / المساحة / الإيجار | housing.* |
| دخل / مصروفات (أعمدة مجمعة أو متعددة) | income.lineItems / expenses.lineItems |
| الحالة الصحية (نصوص لكل فرد أو عمود مجمع) | healthProfiles[] |
| الدراسيه | educationAid |
| ملاحظات | notes (matched to noteTags) |

**Import template v1.2:** Provide a documented `.xlsx` template with optional sheets or extra columns for extended fields; unknown columns map to `notes` or are ignored with warning.

### 6.8 Export Excel

**Options:** current zone · all zones (one sheet each)

**Output matches original structure exactly:**
- Rows 1–3: church name, deacons, zone name
- Row 4: column headers
- Data rows sorted by index
- Totals row at bottom
- RTL direction, Arabic font
- Education aid column only for super_admin exports
- **Extended export mode (optional):** additional columns or a second sheet per zone for children, housing, health, income/expense — so churches can round-trip rich data without losing the legacy layout

### 6.9 Note Tags Settings (super_admin)
- Add / Edit / Delete tags (system tags protected)
- Drag to reorder

---

## 7. Enterprise Angular Project Structure

Based on: feature-based modules, lazy loading, core/shared/layout separation, LIFT principle, OnPush everywhere, standalone components.

```
ava-ebraam-service/
├── src/
│   ├── app/
│   │   │
│   │   ├── core/                           # Singleton services — imported once in app.config.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── role.guard.ts
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── firebase/
│   │   │   │   ├── firebase.config.ts
│   │   │   │   └── firestore-base.service.ts
│   │   │   ├── services/
│   │   │   │   ├── error-handler.service.ts
│   │   │   │   └── phone-normalizer.service.ts
│   │   │   └── core.providers.ts           # provideCore() exported function
│   │   │
│   │   ├── shared/                         # Reusable UI — imported per feature
│   │   │   ├── components/
│   │   │   │   ├── confirm-dialog/
│   │   │   │   ├── page-header/
│   │   │   │   ├── totals-row/
│   │   │   │   └── zone-sheet-header/
│   │   │   ├── pipes/
│   │   │   │   ├── aid-label.pipe.ts
│   │   │   │   ├── deceased-prefix.pipe.ts
│   │   │   │   └── phone-format.pipe.ts
│   │   │   ├── directives/
│   │   │   │   └── rtl-table.directive.ts
│   │   │   └── models/
│   │   │       ├── family.model.ts
│   │   │       ├── zone.model.ts
│   │   │       ├── user.model.ts
│   │   │       └── note-tag.model.ts
│   │   │
│   │   ├── features/                       # Lazy-loaded feature modules
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   └── login.component.html
│   │   │   │   └── auth.routes.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   ├── components/
│   │   │   │   │   ├── summary-cards/
│   │   │   │   │   └── zone-chart/
│   │   │   │   ├── services/
│   │   │   │   │   └── dashboard.service.ts
│   │   │   │   └── dashboard.routes.ts
│   │   │   │
│   │   │   ├── zones/
│   │   │   │   ├── zones-list/
│   │   │   │   │   ├── zones-list.component.ts
│   │   │   │   │   └── zones-list.component.html
│   │   │   │   ├── zone-detail/
│   │   │   │   │   ├── zone-detail.component.ts
│   │   │   │   │   └── zone-detail.component.html
│   │   │   │   ├── components/
│   │   │   │   │   ├── zone-form/
│   │   │   │   │   └── zone-filter-bar/
│   │   │   │   ├── services/
│   │   │   │   │   └── zones.service.ts
│   │   │   │   └── zones.routes.ts
│   │   │   │
│   │   │   ├── families/
│   │   │   │   ├── family-table/
│   │   │   │   │   ├── family-table.component.ts
│   │   │   │   │   └── family-table.component.html
│   │   │   │   ├── family-form/
│   │   │   │   │   ├── family-form.component.ts
│   │   │   │   │   └── family-form.component.html
│   │   │   │   ├── services/
│   │   │   │   │   └── families.service.ts
│   │   │   │   └── families.routes.ts
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── users-list/
│   │   │   │   ├── user-form/
│   │   │   │   ├── services/
│   │   │   │   │   └── users.service.ts
│   │   │   │   └── users.routes.ts
│   │   │   │
│   │   │   ├── import-export/
│   │   │   │   ├── import/
│   │   │   │   │   ├── import.component.ts
│   │   │   │   │   └── components/
│   │   │   │   │       ├── upload-step/
│   │   │   │   │       ├── preview-step/
│   │   │   │   │       └── confirm-step/
│   │   │   │   ├── services/
│   │   │   │   │   ├── excel-import.service.ts
│   │   │   │   │   └── excel-export.service.ts
│   │   │   │   └── import-export.routes.ts
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── tags/
│   │   │       │   ├── tags.component.ts
│   │   │       │   └── tags.component.html
│   │   │       └── settings.routes.ts
│   │   │
│   │   ├── layout/                         # App shell — sidebar, topbar
│   │   │   ├── shell/
│   │   │   │   ├── shell.component.ts
│   │   │   │   └── shell.component.html
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.component.ts
│   │   │   │   └── sidebar.component.html
│   │   │   └── topbar/
│   │   │       ├── topbar.component.ts
│   │   │       └── topbar.component.html
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts                   # provideRouter, Firebase, translate, etc.
│   │   └── app.routes.ts                   # Root lazy routes
│   │
│   ├── assets/
│   │   ├── i18n/
│   │   │   ├── ar.json                     # Arabic (default)
│   │   │   └── en.json                     # English
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   └── styles/
│       ├── styles.css                      # Tailwind directives + global
│       └── primeng-theme.css               # PrimeNG overrides / RTL fixes
│
├── .eslintrc.json
├── .prettierrc
├── angular.json
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 8. i18n Configuration

Translation files at `src/assets/i18n/ar.json` (default) and `src/assets/i18n/en.json`.

### ngx-translate setup in `app.config.ts`
```typescript
provideTranslateService({
  loader: {
    provide: TranslateLoader,
    useFactory: (http: HttpClient) =>
      new TranslateHttpLoader(http, './assets/i18n/', '.json'),
    deps: [HttpClient]
  },
  defaultLanguage: 'ar'
})
```

### Translation key structure
```json
{
  "AUTH":    { "LOGIN": "", "EMAIL": "", "PASSWORD": "" },
  "NAV":     { "DASHBOARD": "", "ZONES": "", "USERS": "", "IMPORT": "", "SETTINGS": "" },
  "FAMILY":  {
    "HUSBAND_NAME": "اسم الزوج",
    "WIFE_NAME": "اسم الزوجة",
    "FAMILY_CODE": "كود الأسرة",
    "FAMILY_CODE_TOOLTIP": "رقم مرجعي لتطبيق آخر، يمكن استخدامه في البحث",
    "PHONE": "التليفون",
    "HUSBAND_PHONE": "تليفون الزوج",
    "WIFE_PHONE": "تليفون الزوجة",
    "CHILDREN_COUNT": "عدد الأطفال",
    "CHILD_EDUCATION": "تعليم الأطفال",
    "HUSBAND_JOB": "عمل الزوج",
    "WIFE_JOB": "عمل الزوجة",
    "HOUSING": "تفاصيل السكن",
    "HOUSING_FLOOR": "الدور",
    "HOUSING_ROOMS": "عدد الغرف",
    "HOUSING_AREA": "المساحة (م²)",
    "HOUSING_RENT": "الإيجار الشهري",
    "HEALTH": "الحالة الصحية",
    "INCOME": "الدخل",
    "EXPENSES": "المصروفات",
    "EXPENSE_RENT": "إيجار",
    "EXPENSE_EDUCATION": "تعليم",
    "EXPENSE_MEDICAL": "علاج وأدوية",
    "MONTHLY_AID": "شهريات",
    "MONTHLY": "ش",
    "SEASONAL": "س",
    "BAG_SIZE": "حجم الكيس",
    "BAG_LARGE": "كبير",
    "BAG_SMALL": "صغير",
    "FAMILY_SIZE": "عدد أفراد الأسرة",
    "EDUCATION_AID": "الدراسيه",
    "NOTES": "ملاحظات",
    "IS_DECEASED": "متوفي",
    "IS_HIDDEN": "مخفي"
  },
  "TOTALS":  { "FAMILIES": "", "MONTHLY_AID": "", "MEMBERS": "", "LARGE_BAGS": "", "SMALL_BAGS": "" },
  "ZONE":    { "NAME": "", "DEACONS": "", "ADD": "", "EDIT": "", "DELETE": "" },
  "IMPORT":  { "UPLOAD": "", "PREVIEW": "", "CONFIRM": "", "SKIP": "", "OVERWRITE": "" },
  "EXPORT":  { "THIS_ZONE": "", "ALL_ZONES": "" },
  "ERRORS":  { "REQUIRED": "", "INVALID_PHONE": "", "MIN_SIZE": "" },
  "ACTIONS": { "SAVE": "", "CANCEL": "", "DELETE": "", "EDIT": "", "ADD": "" }
}
```

---

## 9. Phone Normalization Rules (`PhoneNormalizerService`)

Applied to **`phone`**, **`husbandPhone`**, and **`wifePhone`** (each field independently).

```
1. Trim whitespace
2. Remove: *, (, ), -, spaces
3. +20XXXXXXXXXX  →  0XXXXXXXXXX
4. 20XXXXXXXXXX (length 12)  →  0XXXXXXXXXX
5. Valid format: /^01[0-9]{9}$/
6. Invalid phones stored as-is with validationWarning flag on import
```

---

## 10. Performance Strategy

| Concern | Solution |
|---|---|
| Large family lists | `p-table` virtualScroll |
| Firestore reads | `collectionData` with `shareReplay(1)` |
| Hidden families | Server-side Firestore filter (`isHidden == false`) |
| Role enforcement | Firebase custom claims + Firestore security rules |
| Bulk import | Batched writes, 500 docs/batch |
| Change detection | `OnPush` on all components |
| Route load time | Lazy loading all features |
| Excel parsing | Web Worker via SheetJS for large files |

---

## 11. Firestore Security Rules (Outline)

```javascript
match /families/{id} {
  allow read: if isAuthenticated()
    && (resource.data.isHidden == false || isSuperAdmin())
    && hasZoneAccess(resource.data.zoneId);
  allow write: if isAdmin() || isSuperAdmin();
  // educationAid: additional rule — only super_admin can read/write this field
}
match /zones/{id} {
  allow read: if isAuthenticated()
    && (resource.data.isHidden == false || isSuperAdmin())
    && hasZoneAccess(resource.id);
  allow write: if isAdmin() || isSuperAdmin();
}
match /users/{id} {
  allow read, write: if isSuperAdmin();
  allow read: if request.auth.uid == id;  // own profile only
}
match /noteTags/{id} {
  allow read: if isAuthenticated();
  allow write: if isSuperAdmin();
}
```

---

## 12. Resolved Decisions

| # | Decision |
|---|---|
| 1 | Bag size (كبير/صغير) stored per family as `bagSize` field; totals row auto-calculates |
| 2 | Family code is optional, searchable, non-unique — tooltip clarifies external reference purpose |
| 3 | Education aid is active and stored; rendered only for super_admin role |
| 4 | Notes are a managed dropdown (noteTags collection) with ability to add custom tags; system tags (ابو مقار, مناسبات) are delete-protected |
| 5 | Phone normalization on import: strip `*`, `+20`, spaces, dashes → `01XXXXXXXXX` |
| 6 | i18n files at `src/assets/i18n/ar.json` and `src/assets/i18n/en.json` |
| 7 | Enterprise structure: feature-based lazy modules, core/shared/layout separation, standalone components, signals, OnPush everywhere |
| 8 | **v1.2:** Children count + per-child education stored in `children[]` with `childrenCount` for quick filters; UI uses repeater or detail view |
| 9 | **v1.2:** Husband and wife each have a **job** field; housing is a nested `housing` object (floor, rooms, area, rent, tenure, address text) |
| 10 | **v1.2:** Health is modeled as `healthProfiles[]` with one entry per person (husband, wife, child by index); detailed free-text + optional structured subfields |
| 11 | **v1.2:** Family **income** and **expenses** use `MoneyLineItem[]` breakdowns (rent, education, medical, utilities, food, transport, debt, other) plus optional `totalMonthly` on income |
| 12 | **v1.2:** **husbandPhone** and **wifePhone** are first-class; legacy **phone** retained for imports and primary-contact fallback |
