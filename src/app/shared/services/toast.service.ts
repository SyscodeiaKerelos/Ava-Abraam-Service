import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private messageService = inject(MessageService);

  show(severity: ToastSeverity, summary: string, detail: string, life: number = 3000): void {
    this.messageService.add({
      severity,
      summary,
      detail,
      life,
      key: 'main-toast',
    });
  }

  success(summary: string, detail?: string, life?: number): void {
    this.show('success', summary, detail || '', life);
  }

  error(summary: string, detail?: string, life?: number): void {
    this.show('error', summary, detail || '', life || 5000);
  }

  info(summary: string, detail?: string, life?: number): void {
    this.show('info', summary, detail || '', life);
  }

  warn(summary: string, detail?: string, life?: number): void {
    this.show('warn', summary, detail || '', life || 4000);
  }

  clear(): void {
    this.messageService.clear();
  }
}
