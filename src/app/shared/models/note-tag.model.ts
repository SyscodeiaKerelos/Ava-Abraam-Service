export interface NoteTag {
  id: string;
  labelAr: string;
  labelEn: string;
  order: number;
  isSystem: boolean; // Protected from delete
}
