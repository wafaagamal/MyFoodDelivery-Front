import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineType: string;
  phoneNumber: string;
  email: string;
  address: RestaurantAddress;
  logoUrl?: string;
  bannerUrl?: string;
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  averageRating: number;
  totalRatings: number;
  totalOrders: number;
  isActive: boolean;
  isOpen: boolean;
  acceptingOrders: boolean;
  openingHours: OpeningHours[];
  categories: MenuCategory[];
}

export interface RestaurantAddress {
  street: string;
  buildingNumber: string;
  city: string;
  district?: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface OpeningHours {
  day: number; // DayOfWeek enum (0=Sunday..6=Saturday)
  openTime: string; // "HH:mm:ss"
  closeTime: string;
  isClosed: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  preparationTimeMinutes: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  allergens: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  items?: MenuItem[];
}

export interface MenuDto {
  restaurantId: string;
  restaurantName: string;
  categories: (MenuCategory & { items: MenuItem[] })[];
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  averageRating: number;
  totalReviews: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: string;
  time: string;
  createdAt: Date;
}

export interface PopularItem {
  name: string;
  sold: number;
  price: number;
  image?: string;
}

// Ordering Service DTOs
export interface OrderItem {
  menuItemId: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  restaurantName: string;
  status: number; // OrderStatus enum
  total: number;
  itemCount: number;
  creationTime: string;
  estimatedDeliveryTime?: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  status: number;
  total: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  notes?: string;
  creationTime: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private readonly restaurantApiUrl = `${environment.restaurantApiUrl}/api/restaurants`;
  private readonly orderingApiUrl = `${environment.orderingApiUrl}/api/restaurants`;

  constructor(private http: HttpClient) {}

  // Get my restaurants (owner)
  getRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.restaurantApiUrl}/my`).pipe(
      catchError(() => of([]))
    );
  }

  // Get single restaurant by ID
  getRestaurant(id: string): Observable<Restaurant | null> {
    return this.http.get<Restaurant>(`${this.restaurantApiUrl}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  // Get restaurant menu (with categories and items)
  getMenu(restaurantId: string): Observable<MenuDto | null> {
    return this.http.get<MenuDto>(`${this.restaurantApiUrl}/${restaurantId}/menu`).pipe(
      catchError(() => of(null))
    );
  }

  // Get flat list of menu items from menu
  getMenuItems(restaurantId: string): Observable<MenuItem[]> {
    return this.getMenu(restaurantId).pipe(
      map(menu => menu ? menu.categories.flatMap(c => c.items || []) : [])
    );
  }

  // Get menu categories with items
  getCategoriesWithItems(restaurantId: string): Observable<(MenuCategory & { items: MenuItem[] })[]> {
    return this.getMenu(restaurantId).pipe(
      map(menu => menu ? menu.categories : [])
    );
  }

  // Dashboard stats from restaurant data
  getDashboardStats(restaurantId: string): Observable<DashboardStats> {
    return this.getRestaurant(restaurantId).pipe(
      map(restaurant => ({
        todayOrders: restaurant?.totalOrders || 0,
        todayRevenue: 0,
        pendingOrders: 0,
        averageRating: restaurant?.averageRating || 0,
        totalReviews: restaurant?.totalRatings || 0
      })),
      catchError(() => of({ todayOrders: 0, todayRevenue: 0, pendingOrders: 0, averageRating: 0, totalReviews: 0 }))
    );
  }

  // Get popular items from menu
  getPopularItems(restaurantId: string): Observable<PopularItem[]> {
    return this.getMenuItems(restaurantId).pipe(
      map(items => items.slice(0, 4).map(item => ({
        name: item.name,
        sold: 0,
        price: item.price,
        image: item.imageUrl
      })))
    );
  }

  // ---- Orders (OrderingSvc) ----

  getRestaurantOrders(restaurantId: string, status?: number, skipCount = 0, maxResultCount = 50): Observable<PagedResult<OrderListItem>> {
    let params = new HttpParams()
      .set('skipCount', skipCount)
      .set('maxResultCount', maxResultCount);
    if (status !== undefined) {
      params = params.set('status', status);
    }
    return this.http.get<PagedResult<OrderListItem>>(`${this.orderingApiUrl}/${restaurantId}/orders`, { params }).pipe(
      catchError(() => of({ items: [], totalCount: 0 }))
    );
  }

  getOrderDetail(restaurantId: string, orderId: string): Observable<OrderDetail | null> {
    return this.http.get<OrderDetail>(`${this.orderingApiUrl}/${restaurantId}/orders/${orderId}`).pipe(
      catchError(() => of(null))
    );
  }

  acceptOrder(restaurantId: string, orderId: string, preparationMinutes = 30): Observable<void> {
    return this.http.post<void>(`${this.orderingApiUrl}/${restaurantId}/orders/${orderId}/accept`, preparationMinutes);
  }

  rejectOrder(restaurantId: string, orderId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.orderingApiUrl}/${restaurantId}/orders/${orderId}/reject`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  startPreparing(restaurantId: string, orderId: string): Observable<void> {
    return this.http.post<void>(`${this.orderingApiUrl}/${restaurantId}/orders/${orderId}/start-preparing`, {});
  }

  markOrderReady(restaurantId: string, orderId: string): Observable<void> {
    return this.http.post<void>(`${this.orderingApiUrl}/${restaurantId}/orders/${orderId}/ready`, {});
  }

  // ---- Menu management (RestaurantSvc) ----

  addMenuItem(restaurantId: string, item: {
    categoryId: string; name: string; description: string; price: number;
    imageUrl?: string; preparationTimeMinutes: number;
    isVegetarian: boolean; isVegan: boolean; isGlutenFree: boolean; isSpicy: boolean; allergens: string[];
  }): Observable<{ id: string; name: string; price: number; description: string; isAvailable: boolean }> {
    return this.http.post<{ id: string; name: string; price: number; description: string; isAvailable: boolean }>(`${this.restaurantApiUrl}/${restaurantId}/menu/items`, item);
  }

  updateMenuItem(restaurantId: string, itemId: string, item: {
    name: string; description: string; price: number; imageUrl?: string;
    preparationTimeMinutes: number; isVegetarian: boolean; isVegan: boolean;
    isGlutenFree: boolean; isSpicy: boolean; allergens: string[];
  }): Observable<void> {
    return this.http.put<void>(`${this.restaurantApiUrl}/${restaurantId}/menu/items/${itemId}`, item);
  }

  toggleMenuItemAvailability(restaurantId: string, itemId: string, isAvailable: boolean): Observable<void> {
    return this.http.patch<void>(`${this.restaurantApiUrl}/${restaurantId}/menu/items/${itemId}/availability`, { isAvailable });
  }

  deleteMenuItem(restaurantId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.restaurantApiUrl}/${restaurantId}/menu/items/${itemId}`);
  }

  // ---- Restaurant settings ----

  updateRestaurant(id: string, data: {
    name: string; description: string; cuisineType: string;
    phoneNumber: string; email: string;
    minimumOrderAmount: number; deliveryFee: number; estimatedDeliveryMinutes: number;
  }): Observable<void> {
    return this.http.put<void>(`${this.restaurantApiUrl}/${id}`, data);
  }

  setOpeningHours(id: string, hours: { day: number; openTime: string; closeTime: string; isClosed: boolean }[]): Observable<void> {
    return this.http.post<void>(`${this.restaurantApiUrl}/${id}/opening-hours`, { hours });
  }
}
