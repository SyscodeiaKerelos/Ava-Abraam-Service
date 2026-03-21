# ava-ebraam-service — Product Requirements Document
> خدمة الأنبا ابرام | v1.1

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
| التليفون | Phone | string | Normalized: 01XXXXXXXXX |
| شهريات | Monthly aid | enum | ش=monthly, س=seasonal, blank=none |
| عدد أفراد الأسرة | Family size | integer | Total household members |
| حجم الكيس | Bag size | enum | كبير=large, صغير=small — stored per family |
| الدراسيه | Education aid | number (optional) | Super admin only |
| ملاحظات | Notes | enum+custom | e.g. ابو مقار, مناسبات, أ/نبيل |

### Totals Row (pinned bottom of each zone)
- عدد الأسر بالمنطقة — total family count
- عدد الشهريات — count with monthlyAid = ش
- إجمالي الأفراد — sum of familySize
- الأكياس الكبيرة — count of bagSize = large
- الأكياس الصغيرة — count of bagSize = small

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
{
  id: string
  zoneId: string
  index: number
  husbandName: string
  wifeName: string
  familyCode: string | null       // optional, external ref, searchable
  phone: string                   // normalized: 01XXXXXXXXX
  monthlyAid: 'ش' | 'س' | null
  bagSize: 'large' | 'small' | null
  familySize: number
  educationAid: number | null     // super_admin read/write only
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
families: (familyCode)
```

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
- Global text search: husband, wife, family code, phone, notes
- شهريات filter: all / ش / س / none
- ملاحظات filter: multi-select tags
- Family size range filter
- Toggle: deceased only
- Toggle: show hidden (super_admin)

**Families Table (`p-table` with virtual scroll):**
| Column | Who Sees It |
|---|---|
| م, اسم الزوج, اسم الزوجة, كود الأسرة, التليفون | All |
| شهريات, حجم الكيس, عدد الأفراد, ملاحظات | All |
| الدراسيه | Super admin only |
| Actions (edit/delete/hide) | Admin + Super admin |

- Deceased rows: muted style
- Hidden rows: lock icon, super_admin only
- `OnPush` change detection, virtual scroll

**Pinned Totals Row:** عدد الأسر · عدد الشهريات · إجمالي الأفراد · الأكياس الكبيرة · الأكياس الصغيرة

### 6.5 Add / Edit Family (p-dialog)

| Field | Type | Notes |
|---|---|---|
| اسم الزوج | text | Optional (widow entry) |
| اسم الزوجة | text | **Required** |
| كود الأسرة | text | Optional — tooltip: "رقم مرجعي لتطبيق آخر، يمكن استخدامه في البحث" |
| التليفون | text | Auto-normalized on blur |
| شهريات | dropdown | ش / س / none |
| حجم الكيس | dropdown | كبير / صغير / none |
| عدد أفراد الأسرة | p-inputNumber | min 1 |
| الدراسيه | p-inputNumber | Optional — super_admin only |
| متوفي | checkbox | |
| ملاحظات | p-multiSelect | From noteTags |
| مرئي | toggle | super_admin only |

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
| التليفون | phone (normalized) |
| شهريات | monthlyAid |
| عدد أفراد الأسرة | familySize |
| الدراسيه | educationAid |
| ملاحظات | notes (matched to noteTags) |

### 6.8 Export Excel

**Options:** current zone · all zones (one sheet each)

**Output matches original structure exactly:**
- Rows 1–3: church name, deacons, zone name
- Row 4: column headers
- Data rows sorted by index
- Totals row at bottom
- RTL direction, Arabic font
- Education aid column only for super_admin exports

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
