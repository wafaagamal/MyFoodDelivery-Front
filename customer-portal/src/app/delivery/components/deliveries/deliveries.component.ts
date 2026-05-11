import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';
import { DeliveryHistory, DeliveryTaskStatus } from '../../models/delivery.models';
import { ToastService } from '../../../shared/services/toast.service';

interface DisplayDelivery {
  id: string;
  restaurantName: string;
  dropoffAddress: string;
  earning: number;
  tip: number;
  distance: string;
  duration: string;
  date: string;
  status: string;
  statusClass: string;
}

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.scss']
})
export class DeliveriesComponent implements OnInit {
  activeTab = 'all';
  loading = false;
  loadError = false;

  tabs = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  deliveries: DisplayDelivery[] = [];

  constructor(
    private deliveryService: DeliveryService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.loading = true;
    this.loadError = false;
    this.deliveryService.getDeliveryHistory().subscribe({
      next: items => {
        this.loading = false;
        this.deliveries = items.map(h => this.toDisplay(h));
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.toast.error('Failed to load delivery history.');
      }
    });
  }

  private toDisplay(h: DeliveryHistory): DisplayDelivery {
    const status = this.normalizeStatus(h.status);
    return {
      id: h.id,
      restaurantName: h.restaurantName,
      dropoffAddress: h.dropoffAddress,
      earning: h.earning,
      tip: h.tip,
      distance: '-',
      duration: '-',
      date: this.formatDate(h.createdAt),
      status,
      statusClass: status.toLowerCase().replace(' ', '-')
    };
  }

  private normalizeStatus(status: string): string {
    switch (status) {
      case DeliveryTaskStatus.Delivered:
      case 'Completed': return 'Completed';
      case DeliveryTaskStatus.Assigned:
      case DeliveryTaskStatus.PickedUp: return 'In Progress';
      case DeliveryTaskStatus.Cancelled: return 'Cancelled';
      default: return status;
    }
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

  get filteredDeliveries(): DisplayDelivery[] {
    if (this.activeTab === 'all') return this.deliveries;
    const statusMap: Record<string, string> = {
      'completed': 'Completed',
      'in-progress': 'In Progress',
      'cancelled': 'Cancelled'
    };
    return this.deliveries.filter(d => d.status === statusMap[this.activeTab]);
  }
}

