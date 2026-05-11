import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface TrackingUpdate {
  riderId: string;
  orderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  estimatedArrivalMinutes?: number;
}

export interface RiderAssignedInfo {
  orderId: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  riderLatitude: number;
  riderLongitude: number;
  estimatedArrivalMinutes: number;
  timestamp: Date;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  timestamp: Date;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private hubConnection!: HubConnection;
  private connectionState = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');

  private riderLocationSubject = new BehaviorSubject<TrackingUpdate | null>(null);
  private riderAssignedSubject = new BehaviorSubject<RiderAssignedInfo | null>(null);
  private orderStatusSubject = new BehaviorSubject<OrderStatusUpdate | null>(null);

  readonly connectionState$ = this.connectionState.asObservable();
  readonly riderLocation$ = this.riderLocationSubject.asObservable();
  readonly riderAssigned$ = this.riderAssignedSubject.asObservable();
  readonly orderStatus$ = this.orderStatusSubject.asObservable();

  constructor(private authService: AuthService) {
    this.buildConnection();
  }

  private buildConnection(): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/tracking`, {
        accessTokenFactory: () => this.authService.getAccessToken() || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Rider location updates
    this.hubConnection.on('RiderLocationUpdated', (data: TrackingUpdate) => {
      this.riderLocationSubject.next(data);
    });

    // Rider assigned to order
    this.hubConnection.on('RiderAssigned', (data: RiderAssignedInfo) => {
      this.riderAssignedSubject.next(data);
    });

    // Order status changes
    this.hubConnection.on('OrderStatusChanged', (data: OrderStatusUpdate) => {
      this.orderStatusSubject.next(data);
    });

    // ETA updates
    this.hubConnection.on('EtaUpdated', (data: any) => {
      // Handle ETA update
      console.log('ETA Updated:', data);
    });

    // Subscription confirmation
    this.hubConnection.on('SubscriptionConfirmed', (data: any) => {
      console.log('Subscription confirmed:', data);
    });

    // Connection events
    this.hubConnection.onreconnecting(() => {
      this.connectionState.next('connecting');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionState.next('connected');
    });

    this.hubConnection.onclose(() => {
      this.connectionState.next('disconnected');
    });
  }

  async connect(): Promise<void> {
    if (this.hubConnection.state === 'Connected') {
      return;
    }

    this.connectionState.next('connecting');

    try {
      await this.hubConnection.start();
      this.connectionState.next('connected');
      console.log('SignalR Connected');
    } catch (error) {
      this.connectionState.next('disconnected');
      console.error('SignalR Connection Error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.hubConnection.state === 'Disconnected') {
      return;
    }

    await this.hubConnection.stop();
    this.connectionState.next('disconnected');
  }

  async subscribeToOrder(orderId: string): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection.invoke('SubscribeToOrder', orderId);
  }

  async unsubscribeFromOrder(orderId: string): Promise<void> {
    if (this.hubConnection.state === 'Connected') {
      await this.hubConnection.invoke('UnsubscribeFromOrder', orderId);
    }
  }

  // For riders to update their location
  async updateRiderLocation(
    latitude: number,
    longitude: number,
    currentOrderId?: string,
    heading?: number,
    speed?: number,
    estimatedArrivalMinutes?: number
  ): Promise<void> {
    await this.ensureConnected();
    await this.hubConnection.invoke('UpdateRiderLocation', {
      latitude,
      longitude,
      heading,
      speed,
      currentOrderId,
      estimatedArrivalMinutes
    });
  }

  private async ensureConnected(): Promise<void> {
    if (this.hubConnection.state !== 'Connected') {
      await this.connect();
    }
  }
}
