import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Restaurant,
  Menu,
  Cart,
  AddToCartRequest,
  CreateOrderRequest,
  Order,
  OrderTracking,
  OrderListItem
} from '../models/ordering.models';

@Injectable({
  providedIn: 'root'
})
export class OrderingService {
  private readonly restaurantApiUrl = `${environment.restaurantApiUrl}/api/restaurants`;
  private readonly orderingApiUrl = `${environment.orderingApiUrl}/api/app`;
  private readonly cartApiUrl = `${environment.orderingApiUrl}/api/cart`;

  constructor(private http: HttpClient) {}

  // Restaurant endpoints
  searchRestaurants(params: {
    search?: string;
    cuisine?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    openNow?: boolean;
    maxFee?: number;
    skip?: number;
    take?: number;
  }): Observable<{ items: Restaurant[]; totalCount: number }> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<{ items: Restaurant[]; totalCount: number }>(
      `${this.restaurantApiUrl}`,
      { params: httpParams }
    );
  }

  getNearbyRestaurants(lat: number, lng: number, radius = 5): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(
      `${this.restaurantApiUrl}/nearby`,
      { params: { lat, lng, radius } }
    );
  }

  getRestaurant(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.restaurantApiUrl}/${id}`);
  }

  getMenu(restaurantId: string): Observable<Menu> {
    return this.http.get<Menu>(`${this.restaurantApiUrl}/${restaurantId}/menu`);
  }

  // Cart endpoints
  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.cartApiUrl}`);
  }

  addToCart(request: AddToCartRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.cartApiUrl}/items`, request);
  }

  updateCartItem(menuItemId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.cartApiUrl}/items`, { menuItemId, quantity });
  }

  removeFromCart(menuItemId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.cartApiUrl}/items/${menuItemId}`);
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.cartApiUrl}`);
  }

  // Order endpoints
  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<any>(`${this.orderingApiUrl}/order`, request).pipe(
      map(raw => this.mapOrder(raw))
    );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<any>(`${this.orderingApiUrl}/order/${id}`).pipe(
      map(raw => this.mapOrder(raw))
    );
  }

  getMyOrders(status?: string, skip = 0, take = 20): Observable<{ items: OrderListItem[]; totalCount: number }> {
    let params = new HttpParams().set('SkipCount', skip).set('MaxResultCount', take);
    if (status) {
      params = params.set('Status', status);
    }
    return this.http.get<{ items: any[]; totalCount: number }>(
      `${this.orderingApiUrl}/order`,
      { params }
    ).pipe(map(res => ({
      totalCount: res.totalCount,
      items: (res.items ?? []).map(o => this.mapOrderListItem(o))
    })));
  }

  getActiveOrders(): Observable<OrderListItem[]> {
    const activeStatuses = ['Pending', 'PaymentConfirmed', 'Preparing', 'ReadyForPickup', 'AwaitingPickup', 'InTransit'];
    return this.http.get<any>(`${this.orderingApiUrl}/order`, { params: { SkipCount: 0, MaxResultCount: 50 } }).pipe(
      map(res => (res?.items ?? (Array.isArray(res) ? res : [])).map((o: any) => this.mapOrderListItem(o))
        .filter((o: OrderListItem) => activeStatuses.includes(o.status)))
    );
  }

  private mapOrderListItem(o: any): OrderListItem {
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      restaurantName: o.restaurantName ?? 'Restaurant',
      restaurantLogo: o.restaurantLogo,
      status: this.toStatusStr(o.status),
      totalAmount: o.totalAmount ?? o.total ?? o.subtotal ?? 0,
      itemCount: o.itemCount ?? (o.items?.length ?? 0),
      createdAt: o.createdAt ?? o.creationTime,
      estimatedMinutes: o.estimatedMinutes
    };
  }

  getOrderTracking(orderId: string): Observable<OrderTracking> {
    return this.http.get<any>(`${this.orderingApiUrl}/order/${orderId}/tracking`).pipe(
      map(raw => this.mapTracking(raw))
    );
  }

  confirmPayment(orderId: string, paymentIntentId: string): Observable<void> {
    return this.http.post<void>(`${this.orderingApiUrl}/payment/confirm-payment`, { orderId, paymentIntentId });
  }

  cancelOrder(orderId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.orderingApiUrl}/order/${orderId}/cancel`, { reason });
  }

  rateOrder(orderId: string, restaurantRating: number, deliveryRating?: number, review?: string): Observable<void> {
    return this.http.post<void>(`${this.orderingApiUrl}/order/rate`, {
      orderId,
      rating: restaurantRating,
      deliveryRating,
      review
    });
  }

  private readonly STATUS_NAMES = [
    'Pending', 'PaymentConfirmed', 'Preparing', 'ReadyForPickup',
    'AwaitingPickup', 'InTransit', 'Delivered', 'Completed', 'Cancelled'
  ];
  private readonly PAYMENT_METHOD_NAMES = ['CashOnDelivery', 'Card', 'Wallet'];
  private readonly PAYMENT_STATUS_NAMES = ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'];

  private toStatusStr(val: any): string {
    if (typeof val === 'number') return this.STATUS_NAMES[val] ?? String(val);
    return val ?? 'Pending';
  }

  private mapOrder(raw: any): Order {
    return {
      ...raw,
      status: this.toStatusStr(raw.status),
      payment: raw.payment ?? {
        method: this.PAYMENT_METHOD_NAMES[raw.paymentMethod] ?? 'CashOnDelivery',
        status: this.PAYMENT_STATUS_NAMES[raw.paymentStatus] ?? 'Pending',
        amount: raw.total ?? raw.subtotal ?? 0
      }
    } as Order;
  }

  private mapTracking(raw: any): OrderTracking {
    const TITLES: Record<string, string> = {
      'Pending': 'Order Placed',
      'PaymentConfirmed': 'Payment Confirmed',
      'Preparing': 'Preparing Your Food',
      'ReadyForPickup': 'Ready for Pickup',
      'AwaitingPickup': 'Waiting for Rider',
      'InTransit': 'On the Way',
      'Delivered': 'Delivered',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled'
    };

    const history: any[] = raw.statusHistory ?? raw.timeline ?? [];
    const timeline = history.map((h: any, i: number) => {
      const s = this.toStatusStr(h.status);
      return {
        status: s,
        title: TITLES[s] ?? s,
        description: h.note ?? h.description,
        occurredAt: h.timestamp ?? h.occurredAt,
        isCompleted: true,
        isCurrent: i === history.length - 1
      };
    });

    const restaurant = raw.restaurant;
    const addr = raw.deliveryAddress;

    return {
      orderId: raw.orderId,
      orderNumber: raw.orderNumber,
      status: this.toStatusStr(raw.status),
      timeline,
      restaurantLocation: restaurant
        ? { latitude: restaurant.latitude, longitude: restaurant.longitude, label: restaurant.name }
        : undefined,
      deliveryLocation: addr
        ? { latitude: addr.latitude ?? 0, longitude: addr.longitude ?? 0, label: 'Your Location' }
        : undefined,
      rider: raw.rider
        ? {
            riderId: String(raw.rider.id ?? ''),
            name: raw.rider.name,
            phone: raw.rider.phone,
            latitude: raw.rider.currentLatitude ?? 0,
            longitude: raw.rider.currentLongitude ?? 0,
            vehicleType: 'Motorcycle',
            etaMinutes: raw.rider.etaMinutes
          }
        : undefined,
      etaMinutes: raw.rider?.etaMinutes,
      etaText: raw.rider?.etaMinutes ? `${raw.rider.etaMinutes} min` : undefined
    } as OrderTracking;
  }
}
