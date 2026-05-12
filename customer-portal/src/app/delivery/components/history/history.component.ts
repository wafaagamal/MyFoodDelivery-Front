import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DeliveryService, DeliveryHistory, DeliveryTaskStatus } from '../../services/delivery.service';

@Component({
  selector: 'app-delivery-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class DeliveryHistoryComponent implements OnInit {
  loading = false;
  deliveries: DeliveryHistory[] = [];
  totalEarnings = 0;
  totalDeliveries = 0;

  constructor(
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.deliveryService.getDeliveryHistory().subscribe({
      next: items => {
        this.loading = false;
        this.deliveries = items;
        this.totalDeliveries = items.filter(d =>
          d.status === DeliveryTaskStatus.Delivered || d.status === 'Completed'
        ).length;
        this.totalEarnings = items.reduce((sum, d) => sum + (d.earning || 0) + (d.tip || 0), 0);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatOrderId(id: string): string {
    return '#' + id.split('-')[0].toUpperCase();
  }

  statusLabel(status: string): string {
    switch (status) {
      case DeliveryTaskStatus.Delivered: return 'Delivered';
      case DeliveryTaskStatus.Assigned:
      case DeliveryTaskStatus.PickedUp: return 'In Progress';
      case DeliveryTaskStatus.Cancelled: return 'Cancelled';
      default: return status;
    }
  }

  goBack(): void {
    this.router.navigate(['/delivery/home']);
  }
}
