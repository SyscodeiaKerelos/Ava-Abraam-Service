import * as XLSX from 'xlsx';
import type { Family } from '../models/family.model';
import type { ZoneSheetMetadata } from './excel-zone-sheet.types';

export interface ZoneSheetBuildOptions {
  includeEducationAid: boolean;
  noteLabelResolver?: (family: Family) => string;
}

/** Build worksheet matrix (0-based rows) matching legacy church layout A–I. */
export function buildZoneSheetMatrix(
  metadata: ZoneSheetMetadata,
  families: Family[],
  options: ZoneSheetBuildOptions,
): (string | number)[][] {
  const r0: (string | number)[] = ['', '', '', '', '', '', '', '', ''];
  r0[0] = metadata.churchTitle;
  r0[5] = 'شهريات';
  r0[6] = 'عدد افراد الاسره ';
  r0[7] = 'الدراسيه';
  r0[8] = 'ملاحظات';

  const r1: (string | number)[] = ['', '', '', '', '', '', '', '', ''];
  r1[0] = metadata.deaconsLine;

  const r2: (string | number)[] = ['', '', '', '', '', '', '', '', ''];
  r2[0] = metadata.zoneTitle;

  const headerRow: (string | number)[] = [
    'م',
    'اسم الزوج ',
    'اسم الزوجة ',
    'كود الأسرة',
    'التليفون ',
    '',
    '',
    '',
    '',
  ];

  const sorted = [...families].sort((a, b) => a.index - b.index);
  const dataRows = sorted.map((f) => {
    const notesCell = options.noteLabelResolver ? options.noteLabelResolver(f) : '';
    return [
      f.index,
      f.husbandName,
      f.wifeName,
      f.familyCode ?? '',
      f.phone ?? '',
      f.monthlyAid ?? '',
      f.familySize,
      options.includeEducationAid && f.educationAid != null ? f.educationAid : '',
      notesCell,
    ] as (string | number)[];
  });

  return [r0, r1, r2, headerRow, ...dataRows];
}

export function buildZoneSheetWorkbook(
  metadata: ZoneSheetMetadata,
  families: Family[],
  options: ZoneSheetBuildOptions & { sheetName?: string },
): XLSX.WorkBook {
  const matrix = buildZoneSheetMatrix(metadata, families, options);
  const ws = XLSX.utils.aoa_to_sheet(matrix);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName ?? 'Sheet1');
  return wb;
}

export function downloadZoneSheetWorkbook(
  wb: XLSX.WorkBook,
  filename: string,
): void {
  XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
}
