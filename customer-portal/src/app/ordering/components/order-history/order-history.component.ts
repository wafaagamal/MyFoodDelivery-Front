import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OrderingService } from '../../services/ordering.service';
import { OrderListItem } from '../../models/ordering.models';
import { ToastService } from '../../../shared/services/toast.service';

const ACTIVE_STATUSES = ['Pending', 'PaymentConfirmed', 'Preparing', 'ReadyForPickup', 'AwaitingPickup', 'InTransit'];

// Steps shown in the mini progress track (indices match progressSteps array)
const STATUS_STEP_INDEX: Record<string, number> = {
  Pending: 0,
  PaymentConfirmed: 1,
  Preparing: 2,
  ReadyForPickup: 3,
  AwaitingPickup: 3,
  InTransit: 4,
};

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  activeOrders: OrderListItem[] = [];
  pastOrders: OrderListItem[] = [];
  isLoading = false;
  isRefreshing = false;
  activeTab = 'all';

  /** Labels for the 5-step progress track on active orders */
  readonly progressSteps = ['Confirmed', 'Preparing', 'Ready', 'Picked Up', 'Delivered'];
  /** Skeleton placeholder count */
  readonly skeletons = Array(3);

  constructor(
    private orderingService: OrderingService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadActiveOrders();
    this.loadPastOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.isRefreshing = true;
    this.loadActiveOrders();
    this.loadPastOrders();
    setTimeout(() => (this.isRefreshing = false), 800);
  }

  private loadActiveOrders(): void {
    this.orderingService.getActiveOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: orders => (this.activeOrders = orders) });
  }

  private loadPastOrders(): void {
    this.isLoading = true;
    const status = this.activeTab === 'completed' ? 'Completed'
                 : this.activeTab === 'cancelled' ? 'Cancelled'
                 : undefined;

    this.orderingService.getMyOrders(status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.pastOrders = result.items.filter(o => !ACTIVE_STATUSES.includes(o.status));
          this.isLoading = false;
        },
        error: () => {
          this.toast.error('Failed to load orders. Please try again.');
          this.isLoading = false;
        }
      });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.loadPastOrders();
  }

  // ── Progress track helpers ───────────────────────────────────────────

  isStepDone(status: string, stepIndex: number): boolean {
    const current = STATUS_STEP_INDEX[status] ?? 0;
    return stepIndex < current;
  }

  isStepCurrent(status: string, stepIndex: number): boolean {
    return STATUS_STEP_INDEX[status] === stepIndex;
  }

  // ── Status helpers ───────────────────────────────────────────────────

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      Pending: 'Confirming',
      PaymentConfirmed: 'Confirmed',
      Preparing: 'Preparing',
      ReadyForPickup: 'Ready for Pickup',
      AwaitingPickup: 'Awaiting Rider',
      InTransit: 'On the Way',
      Delivered: 'Delivered',
      Completed: 'Completed',
      Cancelled: 'Cancelled',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '');
  }

  // ── Empty-state copy per tab ─────────────────────────────────────────

  get emptyTitle(): string {
    if (this.activeTab === 'completed') return 'No completed orders yet';
    if (this.activeTab === 'cancelled') return 'No cancelled orders';
    return 'No orders yet';
  }

  get emptySubtitle(): string {
    if (this.activeTab === 'completed') return 'Your completed orders will appear here.';
    if (this.activeTab === 'cancelled') return 'Cancelled orders will be listed here.';
    return 'Your order history will appear here once you place your first order.';
  }

  // ── Reorder ──────────────────────────────────────────────────────────

  reorder(event: Event, order: OrderListItem): void {
    event.stopPropagation();
    this.toast.show(`Reorder from ${order.restaurantName} coming soon!`);
  }

  // ── Image fallback ───────────────────────────────────────────────────

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}

