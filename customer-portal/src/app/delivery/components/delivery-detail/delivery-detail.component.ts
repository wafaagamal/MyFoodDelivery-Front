import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';
import { DeliveryTask, DeliveryTaskStatus } from '../../models/delivery.models';
import { ToastService } from '../../../shared/services/toast.service';

interface DeliveryDisplay {
  id: string;
  orderId: string;
  status: string;
  statusClass: string;
  date: string;
  restaurantName: string;
  restaurantLogo: string;
  pickupAddress: string;
  dropoffAddress: string;
  customerName: string;
  customerPhone: string;
  items: { qty: number; name: string; price: number }[];
  basePay: number;
  distanceBonus: number;
  tip: number;
}

@Component({
  selector: 'app-delivery-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './delivery-detail.component.html',
  styleUrls: ['./delivery-detail.component.scss']
})
export class DeliveryDetailComponent implements OnInit {
  delivery: DeliveryDisplay | null = null;
  loading = false;
  loadError = false;

  private rawStatus = '';

  constructor(
    private route: ActivatedRoute,
    private deliveryService: DeliveryService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDelivery(id);
    }
  }

  private loadDelivery(id: string): void {
    this.loading = true;
    this.loadError = false;
    this.deliveryService.getDeliveryTask(id).subscribe({
      next: task => {
        this.loading = false;
        if (task) {
          this.rawStatus = task.status;
          this.delivery = this.toDisplay(task);
        } else {
          this.loadError = true;
        }
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.toast.error('Failed to load delivery details.');
      }
    });
  }

  private toDisplay(task: DeliveryTask): DeliveryDisplay {
    return {
      id: task.id,
      orderId: task.orderNumber || task.orderId,
      status: this.normalizeStatus(task.status),
      statusClass: this.statusClass(task.status),
      date: new Date(task.creationTime).toLocaleString(),
      restaurantName: task.restaurantName,
      restaurantLogo: task.restaurantLogoUrl || '',
      pickupAddress: task.restaurantAddress,
      dropoffAddress: task.deliveryAddress,
      customerName: task.customerName,
      customerPhone: task.customerPhone,
      items: (task.items || []).map(i => ({ qty: i.quantity, name: i.name, price: i.unitPrice })),
      basePay: task.earning,
      distanceBonus: 0,
      tip: task.tip
    };
  }

  private normalizeStatus(status: string): string {
    switch (status) {
      case DeliveryTaskStatus.Assigned:
      case DeliveryTaskStatus.PickedUp: return 'In Progress';
      case DeliveryTaskStatus.Delivered: return 'Completed';
      case DeliveryTaskStatus.Cancelled: return 'Cancelled';
      default: return status;
    }
  }

  private statusClass(status: string): string {
    switch (status) {
      case DeliveryTaskStatus.Assigned:
      case DeliveryTaskStatus.PickedUp: return 'in-progress';
      case DeliveryTaskStatus.Delivered: return 'completed';
      case DeliveryTaskStatus.Cancelled: return 'cancelled';
      default: return '';
    }
  }

  get totalEarning(): number {
    if (!this.delivery) return 0;
    return this.delivery.basePay + this.delivery.distanceBonus + (this.delivery.tip || 0);
  }

  getNextAction(): string {
    switch (this.rawStatus) {
      case DeliveryTaskStatus.Assigned: return 'Confirm Pickup';
      case DeliveryTaskStatus.PickedUp: return 'Mark as Delivered';
      default: return '';
    }
  }

  advanceStatus(): void {
    if (!this.delivery) return;
    const id = this.delivery.id;

    if (this.rawStatus === DeliveryTaskStatus.Assigned) {
      this.deliveryService.pickupDelivery(id).subscribe({
        next: () => {
          this.rawStatus = DeliveryTaskStatus.PickedUp;
          this.toast.success('Pickup confirmed! Head to the customer.');
        },
        error: () => this.toast.error('Failed to confirm pickup.')
      });
    } else if (this.rawStatus === DeliveryTaskStatus.PickedUp) {
      this.deliveryService.completeDelivery(id).subscribe({
        next: () => {
          this.rawStatus = DeliveryTaskStatus.Delivered;
          if (this.delivery) {
            this.delivery.status = 'Completed';
            this.delivery.statusClass = 'completed';
          }
          this.toast.success('Delivery completed!');
        },
        error: () => this.toast.error('Failed to complete delivery.')
      });
    }
  }
}

