import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Rider,
  AvailableDelivery,
  TodaySummary,
  CurrentDelivery,
  DeliveryHistory,
  DeliveryTask,
  EarningsData,
  DailyEarning,
  Transaction,
  RiderProfile,
  RiderSettings,
  RiderStatus,
  DeliveryTaskStatus
} from '../models/delivery.models';

// Re-export models for convenience
export * from '../models/delivery.models';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private readonly riderApiUrl = `${environment.deliveryApiUrl}/api/riders`;
  private readonly taskApiUrl = `${environment.deliveryApiUrl}/api/delivery-tasks`;

  constructor(private http: HttpClient) {}

  // Get current authenticated rider profile
  getMyRider(): Observable<Rider | null> {
    return this.http.get<Rider>(`${this.riderApiUrl}/my`).pipe(
      catchError(() => of(null))
    );
  }

  // Register current user as a rider (idempotent)
  registerMyRider(): Observable<Rider | null> {
    return this.http.post<Rider>(`${this.riderApiUrl}/my`, {}).pipe(
      catchError(() => of(null))
    );
  }

  // Get rider by ID
  getRider(id: string): Observable<Rider | null> {
    return this.http.get<Rider>(`${this.riderApiUrl}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  // Get current rider profile mapped to RiderProfile shape
  getMyProfile(): Observable<RiderProfile | null> {
    return this.getMyRider().pipe(
      map(rider => {
        if (!rider) return null;
        return {
          id: rider.id,
          firstName: rider.firstName,
          lastName: rider.lastName,
          email: rider.email,
          phoneNumber: rider.phoneNumber,
          vehicleType: rider.vehicleType,
          vehiclePlate: rider.vehiclePlate,
          rating: rider.averageRating,
          totalDeliveries: rider.totalDeliveries,
          memberSince: new Date(),
          badges: []
        };
      }),
      catchError(() => of(null))
    );
  }

  // Update rider online/offline status
  updateStatus(riderId: string, isOnline: boolean): Observable<void> {
    return this.http.patch<void>(`${this.riderApiUrl}/${riderId}/status`, { isOnline });
  }

  // Get available deliveries for current rider
  getAvailableDeliveries(): Observable<AvailableDelivery[]> {
    return this.http.get<any[]>(`${this.taskApiUrl}/available`).pipe(
      map(tasks => (tasks || []).map((task: any) => ({
        id: task.id,
        restaurantName: 'Order #' + (task.orderId || '').substring(0, 8).toUpperCase(),
        restaurantLogo: undefined,
        restaurantDistance: 'N/A',
        pickupAddress: task.pickupAddress,
        dropoffAddress: task.deliveryAddress,
        totalDistance: 'N/A',
        estimatedTime: task.estimatedMinutes || 30,
        earning: 0
      } as AvailableDelivery))),
      catchError(() => of([]))
    );
  }

  // Get today's summary for current rider
  getTodaySummary(): Observable<TodaySummary> {
    return this.http.get<TodaySummary>(`${this.riderApiUrl}/my/today-summary`).pipe(
      catchError(() => of({ deliveries: 0, earnings: 0, hours: 0, tips: 0 }))
    );
  }

  // Get current active delivery task
  getCurrentDelivery(): Observable<CurrentDelivery | null> {
    return this.http.get<any>(`${this.taskApiUrl}/my/active`).pipe(
      map(task => {
        if (!task) return null;
        const statusStr = this.numericToStatusString(task.status);
        return {
          id: task.id,
          orderId: task.orderId,
          status: statusStr,
          step: this.statusToStep(statusStr),
          restaurantName: task.restaurantName || 'Restaurant',
          customerName: task.customerName || 'Customer',
          pickupAddress: task.pickupAddress,
          dropoffAddress: task.deliveryAddress
        } as CurrentDelivery;
      }),
      catchError(() => of(null))
    );
  }

  private numericToStatusString(status: number | string): string {
    if (typeof status === 'string') return status;
    const map: { [k: number]: string } = {
      0: DeliveryTaskStatus.Pending,
      1: DeliveryTaskStatus.Assigned,
      2: DeliveryTaskStatus.PickedUp,
      3: DeliveryTaskStatus.Delivered,
      4: DeliveryTaskStatus.Cancelled
    };
    return map[status] ?? DeliveryTaskStatus.Pending;
  }

  private statusToStep(status: string): number {
    switch (status) {
      case DeliveryTaskStatus.Assigned: return 1;
      case DeliveryTaskStatus.PickedUp: return 2;
      case DeliveryTaskStatus.Delivered: return 3;
      default: return 1;
    }
  }

  // Accept a delivery task
  acceptDelivery(deliveryId: string): Observable<void> {
    return this.http.post<void>(`${this.taskApiUrl}/${deliveryId}/accept`, {});
  }

  // Decline a delivery task
  declineDelivery(deliveryId: string): Observable<void> {
    return this.http.post<void>(`${this.taskApiUrl}/${deliveryId}/decline`, {});
  }

  // Get a specific delivery task by ID
  getDeliveryTask(id: string): Observable<DeliveryTask | null> {
    return this.http.get<DeliveryTask>(`${this.taskApiUrl}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  // Confirm pickup of an order
  pickupDelivery(taskId: string): Observable<void> {
    return this.http.post<void>(`${this.taskApiUrl}/${taskId}/picked-up`, {});
  }

  // Mark delivery as completed
  completeDelivery(taskId: string): Observable<void> {
    return this.http.post<void>(`${this.taskApiUrl}/${taskId}/delivered`, {});
  }

  // Get delivery history (my completed/cancelled tasks)
  getDeliveryHistory(skip = 0, take = 50): Observable<DeliveryHistory[]> {
    const params = new HttpParams()
      .set('skipCount', skip)
      .set('maxResultCount', take);
    return this.http.get<{ items: DeliveryTask[] } | DeliveryTask[]>(
      `${this.taskApiUrl}/my`, { params }
    ).pipe(
      map(res => {
        const tasks = Array.isArray(res) ? res : ((res as any).items || []);
        return tasks.map((t: DeliveryTask) => this.taskToHistory(t));
      }),
      catchError(() => of([]))
    );
  }

  private taskToHistory(task: any): DeliveryHistory {
    return {
      id: task.id,
      orderId: task.orderId,
      restaurantName: task.restaurantName || 'Restaurant',
      customerName: task.customerName || 'Customer',
      pickupAddress: task.pickupAddress,
      dropoffAddress: task.deliveryAddress,
      status: this.numericToStatusString(task.status),
      earning: task.earning ?? 0,
      tip: task.tip ?? 0,
      completedAt: task.deliveredAt ? new Date(task.deliveredAt) : undefined,
      createdAt: new Date(task.creationTime)
    };
  }

  // Get earnings summary for a period
  getEarnings(period: 'day' | 'week' | 'month' = 'week'): Observable<EarningsData> {
    const params = new HttpParams().set('period', period);
    return this.http.get<EarningsData>(`${this.riderApiUrl}/my/earnings`, { params }).pipe(
      catchError(() => of({
        totalEarnings: 0, totalDeliveries: 0, totalTips: 0,
        activeHours: 0, avgPerDelivery: 0, availableBalance: 0
      }))
    );
  }

  // Get daily earnings chart data
  getDailyEarnings(period: 'day' | 'week' | 'month' = 'week'): Observable<DailyEarning[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<DailyEarning[]>(`${this.riderApiUrl}/my/earnings/daily`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  // Get transaction history
  getTransactions(period: 'day' | 'week' | 'month' = 'week'): Observable<Transaction[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<Transaction[]>(`${this.riderApiUrl}/my/earnings/transactions`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  // Update rider profile
  updateProfile(riderId: string, profile: Partial<RiderProfile>): Observable<void> {
    return this.http.put<void>(`${this.riderApiUrl}/${riderId}`, profile);
  }

  // Get rider settings
  getSettings(riderId: string): Observable<RiderSettings> {
    return this.http.get<RiderSettings>(`${this.riderApiUrl}/${riderId}/settings`).pipe(
      catchError(() => of({
        pushNotifications: true,
        emailNotifications: true,
        soundAlerts: true,
        navigationApp: 'google'
      }))
    );
  }

  // Update rider settings
  updateSettings(riderId: string, settings: RiderSettings): Observable<void> {
    return this.http.put<void>(`${this.riderApiUrl}/${riderId}/settings`, settings).pipe(
      catchError(() => of(undefined as void))
    );
  }

  // Update location
  updateLocation(riderId: string, latitude: number, longitude: number): Observable<void> {
    return this.http.patch<void>(`${this.riderApiUrl}/${riderId}/location`, { latitude, longitude });
  }
}
