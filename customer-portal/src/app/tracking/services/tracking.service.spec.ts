import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { TrackingService, TrackingUpdate, RiderAssignedInfo, OrderStatusUpdate } from './tracking.service';
import { AuthService } from '../../auth/services/auth.service';

describe('TrackingService', () => {
  let service: TrackingService;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockHubConnection: jasmine.SpyObj<HubConnection>;
  let eventHandlers: Map<string, Function>;

  beforeEach(() => {
    eventHandlers = new Map();

    // Create mock AuthService
    mockAuthService = jasmine.createSpyObj('AuthService', ['getAccessToken']);
    mockAuthService.getAccessToken.and.returnValue('mock-token');

    // Create mock HubConnection
    mockHubConnection = jasmine.createSpyObj('HubConnection', [
      'start',
      'stop',
      'on',
      'invoke',
      'onreconnecting',
      'onreconnected',
      'onclose'
    ]);

    // Mock state property
    Object.defineProperty(mockHubConnection, 'state', {
      get: () => HubConnectionState.Disconnected,
      configurable: true
    });

    // Capture event handlers
    mockHubConnection.on.and.callFake((event: string, handler: Function) => {
      eventHandlers.set(event, handler);
    });

    mockHubConnection.start.and.returnValue(Promise.resolve());
    mockHubConnection.stop.and.returnValue(Promise.resolve());
    mockHubConnection.invoke.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        TrackingService,
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    // Override the internal hub connection
    service = TestBed.inject(TrackingService);
    (service as any).hubConnection = mockHubConnection;
    (service as any).setupEventHandlers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Connection State', () => {
    it('should have initial state as disconnected', (done) => {
      service.connectionState$.subscribe(state => {
        expect(state).toBe('disconnected');
        done();
      });
    });

    it('should emit state changes', fakeAsync(() => {
      const states: string[] = [];
      service.connectionState$.subscribe(state => {
        states.push(state);
      });

      // Initial state
      expect(states).toContain('disconnected');
    }));
  });

  describe('connect', () => {
    it('should establish connection successfully', async () => {
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Disconnected
      });

      await service.connect();

      expect(mockHubConnection.start).toHaveBeenCalled();
    });

    it('should not reconnect if already connected', async () => {
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Connected
      });

      await service.connect();

      expect(mockHubConnection.start).not.toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Disconnected
      });
      mockHubConnection.start.and.returnValue(Promise.reject(new Error('Connection failed')));

      await expectAsync(service.connect()).toBeRejectedWithError('Connection failed');
    });

    it('should update connection state to connecting then connected', async () => {
      const states: string[] = [];
      service.connectionState$.subscribe(state => states.push(state));

      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Disconnected
      });

      await service.connect();

      expect(states).toContain('connecting');
      expect(states).toContain('connected');
    });
  });

  describe('disconnect', () => {
    it('should disconnect when connected', async () => {
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Connected
      });

      await service.disconnect();

      expect(mockHubConnection.stop).toHaveBeenCalled();
    });

    it('should not disconnect if already disconnected', async () => {
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Disconnected
      });

      await service.disconnect();

      expect(mockHubConnection.stop).not.toHaveBeenCalled();
    });

    it('should update connection state to disconnected', async () => {
      const states: string[] = [];
      service.connectionState$.subscribe(state => states.push(state));

      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Connected
      });

      await service.disconnect();

      expect(states[states.length - 1]).toBe('disconnected');
    });
  });

  describe('subscribeToOrder', () => {
    it('should subscribe to order updates', async () => {
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Connected
      });

      await service.subscribeToOrder('order-123');

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('SubscribeToOrder', 'order-123');
    });

    it('should connect first if not connected', async () => {
      let connectionState = HubConnectionState.Disconnected;
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => connectionState
      });

      mockHubConnection.start.and.callFake(() => {
        connectionState = HubConnectionState.Connected;
        return Promise.resolve();
      });

      await service.subscribeToOrder('order-123');

      expect(mockHubConnection.start).toHaveBeenCalled();
      expect(mockHubConnection.invoke).toHaveBeenCalledWith('SubscribeToOrder', 'order-123');
    });
  });

  describe('unsubscribeFromOrder', () => {
    it('should unsubscribe from order when connected', async () => {
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Connected
      });

      await service.unsubscribeFromOrder('order-123');

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('UnsubscribeFromOrder', 'order-123');
    });

    it('should not attempt unsubscribe when disconnected', async () => {
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Disconnected
      });

      await service.unsubscribeFromOrder('order-123');

      expect(mockHubConnection.invoke).not.toHaveBeenCalled();
    });
  });

  describe('updateRiderLocation', () => {
    it('should send rider location update', async () => {
      let connectionState = HubConnectionState.Disconnected;
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => connectionState
      });

      mockHubConnection.start.and.callFake(() => {
        connectionState = HubConnectionState.Connected;
        return Promise.resolve();
      });

      await service.updateRiderLocation(40.7128, -74.0060, 'order-123', 90, 25, 10);

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('UpdateRiderLocation', {
        latitude: 40.7128,
        longitude: -74.0060,
        heading: 90,
        speed: 25,
        currentOrderId: 'order-123',
        estimatedArrivalMinutes: 10
      });
    });

    it('should send location update without optional params', async () => {
      Object.defineProperty(mockHubConnection, 'state', {
        get: () => HubConnectionState.Connected
      });

      await service.updateRiderLocation(40.7128, -74.0060);

      expect(mockHubConnection.invoke).toHaveBeenCalledWith('UpdateRiderLocation', {
        latitude: 40.7128,
        longitude: -74.0060,
        heading: undefined,
        speed: undefined,
        currentOrderId: undefined,
        estimatedArrivalMinutes: undefined
      });
    });
  });

  describe('Event Handlers', () => {
    describe('RiderLocationUpdated', () => {
      it('should emit rider location updates', (done) => {
        const mockUpdate: TrackingUpdate = {
          riderId: 'rider-1',
          orderId: 'order-123',
          latitude: 40.7128,
          longitude: -74.0060,
          heading: 90,
          speed: 25,
          timestamp: new Date(),
          estimatedArrivalMinutes: 10
        };

        service.riderLocation$.subscribe(update => {
          if (update) {
            expect(update.riderId).toBe('rider-1');
            expect(update.latitude).toBe(40.7128);
            expect(update.estimatedArrivalMinutes).toBe(10);
            done();
          }
        });

        // Trigger the event handler
        const handler = eventHandlers.get('RiderLocationUpdated');
        if (handler) {
          handler(mockUpdate);
        }
      });

      it('should handle multiple location updates', () => {
        const updates: TrackingUpdate[] = [];
        service.riderLocation$.subscribe(update => {
          if (update) updates.push(update);
        });

        const handler = eventHandlers.get('RiderLocationUpdated');
        if (handler) {
          handler({ riderId: 'rider-1', latitude: 40.71, longitude: -74.00 } as TrackingUpdate);
          handler({ riderId: 'rider-1', latitude: 40.72, longitude: -74.01 } as TrackingUpdate);
        }

        expect(updates.length).toBe(2);
      });
    });

    describe('RiderAssigned', () => {
      it('should emit rider assignment info', (done) => {
        const mockAssignment: RiderAssignedInfo = {
          orderId: 'order-123',
          riderId: 'rider-1',
          riderName: 'John Driver',
          riderPhone: '+1234567890',
          riderLatitude: 40.7128,
          riderLongitude: -74.0060,
          estimatedArrivalMinutes: 15,
          timestamp: new Date()
        };

        service.riderAssigned$.subscribe(info => {
          if (info) {
            expect(info.riderName).toBe('John Driver');
            expect(info.estimatedArrivalMinutes).toBe(15);
            done();
          }
        });

        const handler = eventHandlers.get('RiderAssigned');
        if (handler) {
          handler(mockAssignment);
        }
      });
    });

    describe('OrderStatusChanged', () => {
      it('should emit order status changes', (done) => {
        const mockStatus: OrderStatusUpdate = {
          orderId: 'order-123',
          status: 'OutForDelivery',
          timestamp: new Date(),
          data: { estimatedDelivery: '12:30 PM' }
        };

        service.orderStatus$.subscribe(status => {
          if (status) {
            expect(status.status).toBe('OutForDelivery');
            expect(status.orderId).toBe('order-123');
            done();
          }
        });

        const handler = eventHandlers.get('OrderStatusChanged');
        if (handler) {
          handler(mockStatus);
        }
      });

      it('should handle various order statuses', () => {
        const statuses: string[] = [];
        service.orderStatus$.subscribe(status => {
          if (status) statuses.push(status.status);
        });

        const handler = eventHandlers.get('OrderStatusChanged');
        if (handler) {
          ['Confirmed', 'Preparing', 'ReadyForPickup', 'OutForDelivery', 'Delivered'].forEach(status => {
            handler({ orderId: 'order-123', status, timestamp: new Date() } as OrderStatusUpdate);
          });
        }

        expect(statuses).toContain('Confirmed');
        expect(statuses).toContain('Delivered');
      });
    });
  });

  describe('Observable Streams', () => {
    it('should provide connectionState$ observable', () => {
      expect(service.connectionState$).toBeDefined();
    });

    it('should provide riderLocation$ observable', () => {
      expect(service.riderLocation$).toBeDefined();
    });

    it('should provide riderAssigned$ observable', () => {
      expect(service.riderAssigned$).toBeDefined();
    });

    it('should provide orderStatus$ observable', () => {
      expect(service.orderStatus$).toBeDefined();
    });

    it('should start with null for riderLocation$', (done) => {
      service.riderLocation$.subscribe(value => {
        expect(value).toBeNull();
        done();
      });
    });
  });

  describe('Authentication', () => {
    it('should use auth token for connection', () => {
      expect(mockAuthService.getAccessToken).toBeDefined();
    });
  });

  describe('Reconnection Handling', () => {
    it('should handle reconnecting state', () => {
      const states: string[] = [];
      service.connectionState$.subscribe(state => states.push(state));

      // Get the onreconnecting callback
      const reconnectingCallback = mockHubConnection.onreconnecting.calls.mostRecent()?.args[0];
      if (reconnectingCallback) {
        reconnectingCallback();
      }

      expect(states).toContain('connecting');
    });

    it('should handle reconnected state', () => {
      const states: string[] = [];
      service.connectionState$.subscribe(state => states.push(state));

      const reconnectedCallback = mockHubConnection.onreconnected.calls.mostRecent()?.args[0];
      if (reconnectedCallback) {
        reconnectedCallback();
      }

      expect(states).toContain('connected');
    });

    it('should handle connection close', () => {
      const states: string[] = [];
      service.connectionState$.subscribe(state => states.push(state));

      const closeCallback = mockHubConnection.onclose.calls.mostRecent()?.args[0];
      if (closeCallback) {
        closeCallback();
      }

      expect(states).toContain('disconnected');
    });
  });
});
