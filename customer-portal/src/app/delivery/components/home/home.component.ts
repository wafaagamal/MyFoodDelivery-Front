import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../services/delivery.service';
import { AvailableDelivery, TodaySummary, CurrentDelivery } from '../../models/delivery.models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-delivery-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class DeliveryHomeComponent implements OnInit {
  isOnline = false;
  loading = false;

  private riderId = '';
  availableDeliveries: AvailableDelivery[] = [];
  todaySummary: TodaySummary = { deliveries: 0, earnings: 0, hours: 0, tips: 0 };
  currentDelivery: CurrentDelivery | null = null;

  constructor(
    private deliveryService: DeliveryService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.deliveryService.getMyRider().subscribe({
      next: rider => {
        if (rider) {
          this.loading = false;
          this.riderId = rider.id;
          this.isOnline = rider.isOnline;
          this.loadAvailableDeliveries();
          this.loadTodaySummary();
          this.loadCurrentDelivery();
        } else {
          // Auto-register rider profile on first login
          this.deliveryService.registerMyRider().subscribe({
            next: newRider => {
              this.loading = false;
              if (newRider) {
                this.riderId = newRider.id;
                this.isOnline = newRider.isOnline;
              }
            },
            error: () => {
              this.loading = false;
              this.toast.error('Failed to create rider profile.');
            }
          });
        }
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load rider data.');
      }
    });
  }

  private loadAvailableDeliveries(): void {
    if (!this.isOnline) {
      this.availableDeliveries = [];
      return;
    }
    this.deliveryService.getAvailableDeliveries().subscribe({
      next: items => this.availableDeliveries = items,
      error: () => this.toast.error('Failed to load available deliveries.')
    });
  }

  private loadTodaySummary(): void {
    this.deliveryService.getTodaySummary().subscribe({
      next: summary => this.todaySummary = summary,
      error: () => {}
    });
  }

  private loadCurrentDelivery(): void {
    this.deliveryService.getCurrentDelivery().subscribe({
      next: delivery => this.currentDelivery = delivery,
      error: () => {}
    });
  }

  toggleStatus(): void {
    if (!this.riderId) return;
    const newStatus = this.isOnline;
    this.deliveryService.updateStatus(this.riderId, newStatus).subscribe({
      next: () => {
        if (newStatus) {
          this.loadAvailableDeliveries();
          this.toast.success('You are now online.');
        } else {
          this.availableDeliveries = [];
          this.toast.success('You are now offline.');
        }
      },
      error: () => {
        this.isOnline = !newStatus; // revert toggle on failure
        this.toast.error('Failed to update status. Please try again.');
      }
    });
  }

  acceptDelivery(delivery: AvailableDelivery): void {
    this.deliveryService.acceptDelivery(delivery.id).subscribe({
      next: () => {
        this.availableDeliveries = this.availableDeliveries.filter(d => d.id !== delivery.id);
        this.loadCurrentDelivery();
        this.loadTodaySummary();
        this.toast.success('Delivery accepted!');
      },
      error: () => this.toast.error('Failed to accept delivery.')
    });
  }

  declineDelivery(delivery: AvailableDelivery): void {
    this.deliveryService.declineDelivery(delivery.id).subscribe({
      next: () => {
        this.availableDeliveries = this.availableDeliveries.filter(d => d.id !== delivery.id);
      },
      error: () => {
        // Still remove on decline failure — rider already dismissed it
        this.availableDeliveries = this.availableDeliveries.filter(d => d.id !== delivery.id);
        this.toast.error('Failed to notify decline. The delivery has been removed from your queue.');
      }
    });
  }
}

