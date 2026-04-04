import * as XLSX from 'xlsx';
import { PhoneNormalizerService } from '../../core/services/phone-normalizer.service';
import type { ParseZoneSheetResult, ParsedFamilyRow, ZoneSheetMetadata } from './excel-zone-sheet.types';

const DATA_START_ROW_1_BASED = 5;
const COL = { index: 0, husband: 1, wife: 2, code: 3, phone: 4, aid: 5, size: 6, eduAid: 7, notes: 8 };

function cellStr(row: unknown[], i: number): string {
  const v = row[i];
  if (v == null || v === '') return '';
  return String(v).trim();
}

function parseIndex(v: unknown): number {
  if (v == null || v === '') return NaN;
  if (typeof v === 'number' && !Number.isNaN(v)) return Math.trunc(v);
  const s = String(v).trim().replace(/,/g, '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

function parseMonthlyAid(v: string): 'ش' | 'س' | null {
  const t = v.trim();
  if (t === 'ش' || t === 'شهري' || t.toLowerCase() === 'm') return 'ش';
  if (t === 'س' || t === 'سنوي' || t.toLowerCase() === 's') return 'س';
  return t === '' ? null : null;
}

function parseNumberOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, '.'));
  return Number.isFinite(n) ? n : null;
}

function isRowEmpty(row: unknown[]): boolean {
  const parts = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => cellStr(row, i));
  return parts.every((p) => p === '');
}

/**
 * Reads the first worksheet of a legacy church zone workbook.
 * Layout: rows 1–3 metadata; row 4 headers; data from row 5 (columns A–I).
 */
export function parseZoneSheetWorkbook(
  buffer: ArrayBuffer,
  phoneNormalizer: PhoneNormalizerService,
): ParseZoneSheetResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      metadata: { churchTitle: '', deaconsLine: '', zoneTitle: '' },
      rows: [],
    };
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  });

  const metadata: ZoneSheetMetadata = {
    churchTitle: matrix[0] ? cellStr(matrix[0], 0) : '',
    deaconsLine: matrix[1] ? cellStr(matrix[1], 0) : '',
    zoneTitle: matrix[2] ? cellStr(matrix[2], 0) : '',
  };

  const rows: ParsedFamilyRow[] = [];
  const startIdx = DATA_START_ROW_1_BASED - 1;

  for (let i = startIdx; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row || !Array.isArray(row)) continue;
    if (isRowEmpty(row)) continue;

    const warnings: string[] = [];
    const idx = parseIndex(row[COL.index]);
    if (Number.isNaN(idx) || idx < 0) {
      warnings.push('INVALID_INDEX');
    }

    const husbandName = cellStr(row, COL.husband);
    const wifeName = cellStr(row, COL.wife);
    const familyCodeRaw = cellStr(row, COL.code);
    const familyCode = familyCodeRaw === '' ? null : familyCodeRaw;

    const phoneRaw = cellStr(row, COL.phone);
    const { value: phone, isValid: phoneValid } = phoneNormalizer.normalize(phoneRaw);
    if (phoneRaw !== '' && !phoneValid) {
      warnings.push('INVALID_PHONE');
    }

    const aidCell = cellStr(row, COL.aid);
    const monthlyAid = parseMonthlyAid(aidCell);

    let familySize = parseNumberOrNull(row[COL.size]);
    if (familySize == null || familySize < 1) {
      familySize = 1;
      if (cellStr(row, COL.size) !== '') {
        warnings.push('INVALID_FAMILY_SIZE');
      }
    }

    const edu = parseNumberOrNull(row[COL.eduAid]);
    const educationAid = edu;

    const notesRaw = cellStr(row, COL.notes);

    if (wifeName === '' && husbandName === '' && familyCode === null && phone === '') {
      continue;
    }

    rows.push({
      excelRowNumber: i + 1,
      index: Number.isNaN(idx) ? rows.length + 1 : idx,
      husbandName,
      wifeName,
      familyCode,
      phone,
      monthlyAid,
      familySize: Math.trunc(familySize),
      educationAid,
      notesRaw,
      warnings,
    });
  }

  return { metadata, rows };
}
