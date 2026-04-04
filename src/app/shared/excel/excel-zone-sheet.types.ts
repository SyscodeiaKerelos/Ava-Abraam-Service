export interface ZoneSheetMetadata {
  churchTitle: string;
  deaconsLine: string;
  zoneTitle: string;
}

export interface ParsedFamilyRow {
  excelRowNumber: number;
  index: number;
  husbandName: string;
  wifeName: string;
  familyCode: string | null;
  phone: string;
  monthlyAid: 'ش' | 'س' | null;
  familySize: number;
  educationAid: number | null;
  notesRaw: string;
  warnings: string[];
}

export interface ParseZoneSheetResult {
  metadata: ZoneSheetMetadata;
  rows: ParsedFamilyRow[];
}
