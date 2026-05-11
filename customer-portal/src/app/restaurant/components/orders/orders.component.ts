import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantService, OrderListItem, OrderDetail } from '../../services/restaurant.service';
import { ToastService } from '../../../shared/services/toast.service';

// OrderStatus enum values from backend
export const ORDER_STATUS = {
  Pending: 0,
  PaymentConfirmed: 1,
  Preparing: 2,
  ReadyForPickup: 3,
  AwaitingPickup: 4,
  InTransit: 5,
  Delivered: 6,
  Completed: 7,
  Cancelled: 8
};

interface DisplayOrder {
  id: string;
  orderNumber: string;
  customer: string;
  time: string;
  total: number;
  status: number;
  statusLabel: string;
  statusClass: string;
  itemCount: number;
  items?: { qty: number; name: string }[];
}

@Component({
  selector: 'app-restaurant-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class RestaurantOrdersComponent implements OnInit {
  activeTab = 'all';
  loading = false;
  loadError = false;

  tabs = [
    { label: 'All', value: 'all', count: 0 },
    { label: 'Pending', value: 'pending', count: 0 },
    { label: 'Preparing', value: 'preparing', count: 0 },
    { label: 'Ready', value: 'ready', count: 0 },
    { label: 'Delivered', value: 'delivered', count: 0 },
  ];

  orders: DisplayOrder[] = [];
  selectedOrder: any = null;
  private restaurantId = '';

  constructor(
    private restaurantService: RestaurantService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.restaurantService.getRestaurants().subscribe({
      next: restaurants => {
        if (restaurants.length > 0) {
          this.restaurantId = restaurants[0].id;
          this.loadOrders();
        } else {
          this.loadError = true;
          this.toast.error('No restaurant found for your account.');
        }
      },
      error: () => {
        this.loadError = true;
        this.toast.error('Failed to load restaurant information.');
      }
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.loadError = false;
    this.restaurantService.getRestaurantOrders(this.restaurantId, undefined, 0, 100).subscribe({
      next: result => {
        this.loading = false;
        this.orders = result.items.map(o => this.toDisplayOrder(o));
        this.updateTabCounts();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.toast.error('Failed to load orders. Please try again.');
      }
    });
  }

  private toDisplayOrder(o: OrderListItem): DisplayOrder {
    const label = this.statusLabel(o.status);
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customer: '',
      time: this.timeAgo(o.creationTime),
      total: o.total,
      status: o.status,
      statusLabel: label,
      statusClass: this.statusClass(o.status),
      itemCount: o.itemCount
    };
  }

  private timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  private statusLabel(status: number): string {
    switch (status) {
      case ORDER_STATUS.Pending: return 'Pending';
      case ORDER_STATUS.PaymentConfirmed: return 'Pending';
      case ORDER_STATUS.Preparing: return 'Preparing';
      case ORDER_STATUS.ReadyForPickup: return 'Ready';
      case ORDER_STATUS.AwaitingPickup: return 'Ready';
      case ORDER_STATUS.InTransit: return 'Delivering';
      case ORDER_STATUS.Delivered: return 'Delivered';
      case ORDER_STATUS.Completed: return 'Delivered';
      case ORDER_STATUS.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  private statusClass(status: number): string {
    switch (status) {
      case ORDER_STATUS.Pending:
      case ORDER_STATUS.PaymentConfirmed: return 'pending';
      case ORDER_STATUS.Preparing: return 'preparing';
      case ORDER_STATUS.ReadyForPickup:
      case ORDER_STATUS.AwaitingPickup: return 'ready';
      case ORDER_STATUS.InTransit: return 'delivering';
      case ORDER_STATUS.Delivered:
      case ORDER_STATUS.Completed: return 'delivered';
      case ORDER_STATUS.Cancelled: return 'cancelled';
      default: return '';
    }
  }

  private updateTabCounts(): void {
    this.tabs[0].count = this.orders.length;
    this.tabs[1].count = this.orders.filter(o => o.status === ORDER_STATUS.Pending || o.status === ORDER_STATUS.PaymentConfirmed).length;
    this.tabs[2].count = this.orders.filter(o => o.status === ORDER_STATUS.Preparing).length;
    this.tabs[3].count = this.orders.filter(o => o.status === ORDER_STATUS.ReadyForPickup || o.status === ORDER_STATUS.AwaitingPickup).length;
    this.tabs[4].count = this.orders.filter(o => o.status === ORDER_STATUS.Delivered || o.status === ORDER_STATUS.Completed).length;
  }

  get filteredOrders(): DisplayOrder[] {
    switch (this.activeTab) {
      case 'pending': return this.orders.filter(o => o.status === ORDER_STATUS.Pending || o.status === ORDER_STATUS.PaymentConfirmed);
      case 'preparing': return this.orders.filter(o => o.status === ORDER_STATUS.Preparing);
      case 'ready': return this.orders.filter(o => o.status === ORDER_STATUS.ReadyForPickup || o.status === ORDER_STATUS.AwaitingPickup);
      case 'delivered': return this.orders.filter(o => o.status === ORDER_STATUS.Delivered || o.status === ORDER_STATUS.Completed);
      default: return this.orders;
    }
  }

  getActionLabel(order: DisplayOrder): string {
    if (order.status === ORDER_STATUS.Pending || order.status === ORDER_STATUS.PaymentConfirmed) return 'Accept';
    if (order.status === ORDER_STATUS.Preparing) return 'Mark Ready';
    return 'View';
  }

  advanceOrder(order: DisplayOrder): void {
    if (order.status === ORDER_STATUS.Pending || order.status === ORDER_STATUS.PaymentConfirmed) {
      this.restaurantService.acceptOrder(this.restaurantId, order.id, 30).subscribe({
        next: () => {
          order.status = ORDER_STATUS.Preparing;
          order.statusLabel = 'Preparing';
          order.statusClass = 'preparing';
          this.updateTabCounts();
          this.toast.success(`Order #${order.orderNumber} accepted.`);
        },
        error: () => this.toast.error(`Failed to accept order #${order.orderNumber}.`)
      });
    } else if (order.status === ORDER_STATUS.Preparing) {
      this.restaurantService.markOrderReady(this.restaurantId, order.id).subscribe({
        next: () => {
          order.status = ORDER_STATUS.ReadyForPickup;
          order.statusLabel = 'Ready';
          order.statusClass = 'ready';
          this.updateTabCounts();
          this.toast.success(`Order #${order.orderNumber} marked as ready.`);
        },
        error: () => this.toast.error(`Failed to mark order #${order.orderNumber} as ready.`)
      });
    } else {
      this.viewOrder(order);
    }
  }

  rejectOrder(order: DisplayOrder): void {
    this.restaurantService.rejectOrder(this.restaurantId, order.id, 'Rejected by restaurant').subscribe({
      next: () => {
        this.orders = this.orders.filter(o => o.id !== order.id);
        this.updateTabCounts();
        this.toast.success(`Order #${order.orderNumber} rejected.`);
      },
      error: () => this.toast.error(`Failed to reject order #${order.orderNumber}.`)
    });
  }

  viewOrder(order: DisplayOrder): void {
    this.restaurantService.getOrderDetail(this.restaurantId, order.id).subscribe({
      next: detail => {
        if (detail) {
          this.selectedOrder = {
            ...order,
            customer: detail.customerName,
            phone: detail.customerPhone,
            notes: detail.notes,
            items: detail.items.map(i => ({ qty: i.quantity, name: i.name, price: i.unitPrice })),
            subtotal: detail.subtotal,
            deliveryFee: detail.deliveryFee,
            serviceFee: detail.serviceFee
          };
        } else {
          this.selectedOrder = { ...order };
        }
      },
      error: () => {
        this.selectedOrder = { ...order };
        this.toast.error('Failed to load order details.');
      }
    });
  }

  closeOrderDetail(): void {
    this.selectedOrder = null;
  }
}

