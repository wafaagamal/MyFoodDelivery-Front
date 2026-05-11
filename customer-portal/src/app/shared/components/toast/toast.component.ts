import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite">
      <div
        *ngFor="let toast of toasts"
        class="toast toast--{{ toast.type }}"
        role="alert"
      >
        <span class="toast__icon">
          <ng-container [ngSwitch]="toast.type">
            <span *ngSwitchCase="'success'">✓</span>
            <span *ngSwitchCase="'error'">✕</span>
            <span *ngSwitchCase="'warning'">⚠</span>
            <span *ngSwitchDefault>ℹ</span>
          </ng-container>
        </span>
        <span class="toast__message">{{ toast.message }}</span>
        <button class="toast__close" (click)="dismiss(toast.id)" aria-label="Dismiss">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      max-width: 360px;
      width: 100%;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.14);
      pointer-events: all;
      animation: slideIn 0.25s ease;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .toast--success { background: #f0fdf4; border-left: 4px solid #22c55e; color: #166534; }
    .toast--error   { background: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; }
    .toast--warning { background: #fffbeb; border-left: 4px solid #f59e0b; color: #92400e; }
    .toast--info    { background: #eff6ff; border-left: 4px solid #3b82f6; color: #1e40af; }

    .toast__icon {
      flex-shrink: 0;
      font-weight: 700;
      font-size: 1rem;
    }

    .toast__message { flex: 1; }

    .toast__close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      line-height: 1;
      opacity: 0.6;
      color: inherit;
      padding: 0;
    }
    .toast__close:hover { opacity: 1; }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toasts => { this.toasts = toasts; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
