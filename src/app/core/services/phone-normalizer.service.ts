import { Injectable } from '@angular/core';

/** PRD §9 — normalize Egyptian mobile to 01XXXXXXXXX when possible. */
@Injectable({ providedIn: 'root' })
export class PhoneNormalizerService {
  normalize(raw: string | null | undefined): { value: string; isValid: boolean } {
    if (raw == null || raw === '') {
      return { value: '', isValid: true };
    }
    let s = String(raw).trim();
    s = s.replace(/[*()[\]\s-]/g, '');
    if (s.startsWith('+20')) {
      s = '0' + s.slice(3);
    } else if (/^20\d{10}$/.test(s)) {
      s = '0' + s.slice(2);
    }
    const valid = /^01[0-9]{9}$/.test(s);
    return { value: s, isValid: valid };
  }
}
