import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts.asObservable();

  private nextId = 1;

  show(message: string, type: ToastType = 'info', duration = 3500): void {
    const toast: Toast = { id: this.nextId++, message, type };
    this._toasts.next([...this._toasts.getValue(), toast]);
    setTimeout(() => this.dismiss(toast.id), duration);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 5000);
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  dismiss(id: number): void {
    this._toasts.next(this._toasts.getValue().filter(t => t.id !== id));
  }
}
