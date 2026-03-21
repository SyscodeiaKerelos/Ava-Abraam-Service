import { Injectable, inject, ErrorHandler } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler implements ErrorHandler {
  private toastService = inject(ToastService);

  handleError(error: unknown): void {
    let message = 'An unexpected error occurred';
    let title = 'Error';

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as any).message);
    }

    if (message.includes('Firebase') || message.includes('firestore')) {
      title = 'Database Error';
    } else if (message.includes('network') || message.includes('Network')) {
      title = 'Network Error';
    } else if (message.includes('permission') || message.includes('Permission')) {
      title = 'Permission Denied';
    }

    console.error('Global Error:', error);
    this.toastService.error(title, message);
  }
}
