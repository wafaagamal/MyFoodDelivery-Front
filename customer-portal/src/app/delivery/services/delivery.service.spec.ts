import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DeliveryService } from './delivery.service';
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
import { environment } from '../../../environments/environment';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.deliveryApiUrl;

  // Mock Data
  const mockRider: Rider = {
    id: 'rider-1',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    email: 'john@test.com',
    status: RiderStatus.Available,
    vehicleType: 'Motorcycle',
    vehiclePlate: 'NYC-M101',
    isOnline: true,
    isActive: true,
    currentLatitude: 40.7580,
    currentLongitude: -73.9855,
    totalDeliveries: 150,
    totalEarnings: 2500.00,
    averageRating: 4.8,
    ratingCount: 120
  };

  const mockAvailableDeliveries: AvailableDelivery[] = [
    {
      id: 'del-1',
      restaurantName: 'Pizza Palace',
      restaurantLogo: 'https://example.com/logo.png',
      restaurantDistance: '1.2 km',
      pickupAddress: '123 Restaurant St',
      dropoffAddress: '456 Customer Ave',
      totalDistance: '3.5 km',
      estimatedTime: 25,
      earning: 12.50
    },
    {
      id: 'del-2',
      restaurantName: 'Sushi Express',
      restaurantLogo: 'https://example.com/sushi.png',
      restaurantDistance: '0.8 km',
      pickupAddress: '789 Sushi Blvd',
      dropoffAddress: '321 Home St',
      totalDistance: '2.0 km',
      estimatedTime: 15,
      earning: 8.00
    }
  ];

  const mockTodaySummary: TodaySummary = {
    deliveries: 8,
    earnings: 127.50,
    hours: 5.5,
    tips: 25.00
  };

  const mockCurrentDelivery: CurrentDelivery = {
    id: 'del-1',
    orderId: 'order-1',
    status: DeliveryTaskStatus.Assigned,
    step: 1,
    restaurantName: 'Pizza Palace',
    customerName: 'Jane Doe',
    pickupAddress: '123 Restaurant St',
    dropoffAddress: '456 Customer Ave'
  };

  const mockDeliveryHistory: DeliveryHistory[] = [
    {
      id: 'del-1',
      orderId: 'order-1',
      restaurantName: 'Pizza Palace',
      customerName: 'Jane Doe',
      pickupAddress: '123 Restaurant St',
      dropoffAddress: '456 Customer Ave',
      status: DeliveryTaskStatus.Delivered,
      earning: 12.50,
      tip: 5.00,
      completedAt: new Date(),
      createdAt: new Date()
    }
  ];

  const mockDeliveryTask: DeliveryTask = {
    id: 'del-1',
    orderId: 'order-1',
    orderNumber: 'ORD-001',
    status: DeliveryTaskStatus.Assigned,
    restaurantName: 'Pizza Palace',
    restaurantLogoUrl: 'https://example.com/logo.png',
    restaurantAddress: '123 Restaurant St',
    customerName: 'Jane Doe',
    customerPhone: '+1987654321',
    deliveryAddress: '456 Customer Ave',
    distanceKm: 3.5,
    estimatedMinutes: 25,
    earning: 12.50,
    tip: 5.00,
    notes: 'Leave at door',
    creationTime: new Date().toISOString(),
    items: [
      { name: 'Margherita Pizza', quantity: 2, unitPrice: 12.99 }
    ]
  };

  const mockEarningsData: EarningsData = {
    totalEarnings: 1250.00,
    totalDeliveries: 85,
    totalTips: 200.00,
    activeHours: 40,
    avgPerDelivery: 14.70,
    availableBalance: 500.00
  };

  const mockDailyEarnings: DailyEarning[] = [
    { day: 'Mon', deliveries: 8, earnings: 127.50 },
    { day: 'Tue', deliveries: 6, earnings: 98.00 }
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'trans-1',
      type: 'delivery',
      description: 'Delivery #12345',
      amount: 12.50,
      date: new Date()
    },
    {
      id: 'trans-2',
      type: 'tip',
      description: 'Tip from customer',
      amount: 5.00,
      date: new Date()
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DeliveryService]
    });

    service = TestBed.inject(DeliveryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Rider Profile', () => {
    it('should get current rider profile', () => {
      service.getMyRider().subscribe(rider => {
        expect(rider).toEqual(mockRider);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/my`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRider);
    });

    it('should update rider status', () => {
      const riderId = 'rider-1';
      const isOnline = true;
      
      service.updateStatus(riderId, isOnline).subscribe(response => {
        expect(response).toBeFalsy(); // void returns undefined
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/${riderId}/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: RiderStatus.Available });
      req.flush(null);
    });

    it('should update rider location', () => {
      const riderId = 'rider-1';
      const lat = 40.7580;
      const lng = -73.9855;
      
      service.updateLocation(riderId, lat, lng).subscribe(response => {
        expect(response).toBeFalsy(); // void returns undefined
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/${riderId}/location`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ latitude: lat, longitude: lng });
      req.flush(null);
    });
  });

  describe('Available Deliveries', () => {
    it('should get available deliveries', () => {
      service.getAvailableDeliveries().subscribe(deliveries => {
        expect(deliveries).toEqual(mockAvailableDeliveries);
        expect(deliveries.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/available`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAvailableDeliveries);
    });

    it('should return empty array when no deliveries available', () => {
      service.getAvailableDeliveries().subscribe(deliveries => {
        expect(deliveries).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/available`);
      req.flush([]);
    });
  });

  describe('Today Summary', () => {
    it('should get today summary', () => {
      service.getTodaySummary().subscribe(summary => {
        expect(summary).toEqual(mockTodaySummary);
        expect(summary.deliveries).toBe(8);
        expect(summary.earnings).toBe(127.50);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/my/today-summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTodaySummary);
    });
  });

  describe('Current Delivery', () => {
    it('should get current active delivery', () => {
      // Service maps DeliveryTask to CurrentDelivery
      const expectedResult: CurrentDelivery = {
        id: mockDeliveryTask.id,
        orderId: mockDeliveryTask.orderNumber || mockDeliveryTask.orderId,
        status: mockDeliveryTask.status,
        step: 1, // Assigned = step 1
        restaurantName: mockDeliveryTask.restaurantName,
        customerName: mockDeliveryTask.customerName,
        pickupAddress: mockDeliveryTask.restaurantAddress,
        dropoffAddress: mockDeliveryTask.deliveryAddress
      };

      service.getCurrentDelivery().subscribe(delivery => {
        expect(delivery).toEqual(expectedResult);
        expect(delivery?.status).toBe(DeliveryTaskStatus.Assigned);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/my/active`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDeliveryTask);
    });

    it('should return null when no active delivery', () => {
      service.getCurrentDelivery().subscribe(delivery => {
        expect(delivery).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/my/active`);
      req.flush(null);
    });
  });

  describe('Delivery Task Operations', () => {
    it('should get delivery task by ID', () => {
      const taskId = 'del-1';
      
      service.getDeliveryTask(taskId).subscribe(task => {
        expect(task).toEqual(mockDeliveryTask);
        expect(task!.id).toBe(taskId);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/${taskId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDeliveryTask);
    });

    it('should accept a delivery', () => {
      const taskId = 'del-1';
      
      service.acceptDelivery(taskId).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/${taskId}/accept`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should decline a delivery', () => {
      const taskId = 'del-1';
      
      service.declineDelivery(taskId).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/${taskId}/decline`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should mark delivery as picked up', () => {
      const taskId = 'del-1';
      
      service.pickupDelivery(taskId).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/${taskId}/pickup`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should complete a delivery', () => {
      const taskId = 'del-1';
      
      service.completeDelivery(taskId).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/${taskId}/complete`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });
  });

  describe('Delivery History', () => {
    it('should get delivery history', () => {
      // Service maps DeliveryTask array to DeliveryHistory array
      const expectedHistory: DeliveryHistory[] = [{
        id: mockDeliveryTask.id,
        orderId: mockDeliveryTask.orderId,
        restaurantName: mockDeliveryTask.restaurantName,
        customerName: mockDeliveryTask.customerName,
        pickupAddress: mockDeliveryTask.restaurantAddress,
        dropoffAddress: mockDeliveryTask.deliveryAddress,
        status: mockDeliveryTask.status,
        earning: mockDeliveryTask.earning,
        tip: mockDeliveryTask.tip,
        completedAt: mockDeliveryTask.completedTime ? new Date(mockDeliveryTask.completedTime) : undefined,
        createdAt: new Date(mockDeliveryTask.creationTime)
      }];

      service.getDeliveryHistory().subscribe(history => {
        expect(history.length).toBe(1);
        expect(history[0].restaurantName).toBe(expectedHistory[0].restaurantName);
        expect(history[0].pickupAddress).toBe(expectedHistory[0].pickupAddress);
      });

      const req = httpMock.expectOne(r => 
        r.url === `${baseUrl}/api/app/delivery-task/my` &&
        r.params.get('skipCount') === '0' &&
        r.params.get('maxResultCount') === '50'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ items: [mockDeliveryTask] });
    });
  });

  describe('Earnings', () => {
    it('should get earnings for day', () => {
      service.getEarnings('day').subscribe(earnings => {
        expect(earnings).toEqual(mockEarningsData);
        expect(earnings.totalEarnings).toBe(1250.00);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/my/earnings?period=day`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEarningsData);
    });

    it('should get earnings for this week', () => {
      service.getEarnings('week').subscribe(earnings => {
        expect(earnings).toEqual(mockEarningsData);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/my/earnings?period=week`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEarningsData);
    });

    it('should get earnings for this month', () => {
      service.getEarnings('month').subscribe(earnings => {
        expect(earnings).toEqual(mockEarningsData);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/my/earnings?period=month`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEarningsData);
    });

    it('should get daily earnings breakdown', () => {
      service.getDailyEarnings('week').subscribe(daily => {
        expect(daily).toEqual(mockDailyEarnings);
        expect(daily.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/my/earnings/daily?period=week`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDailyEarnings);
    });

    it('should get transactions', () => {
      service.getTransactions('week').subscribe(transactions => {
        expect(transactions).toEqual(mockTransactions);
        expect(transactions.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/my/earnings/transactions?period=week`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTransactions);
    });
  });

  describe('Error Handling', () => {
    it('should return null on HTTP error for getMyRider', () => {
      // Service catches errors and returns null
      service.getMyRider().subscribe({
        next: (result) => expect(result).toBeNull(),
        error: () => fail('Should not throw error')
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/rider/my`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle HTTP errors for acceptDelivery', () => {
      let errorResponse: any;
      
      service.acceptDelivery('del-1').subscribe({
        next: () => fail('Expected error'),
        error: (error) => errorResponse = error
      });

      const req = httpMock.expectOne(`${baseUrl}/api/app/delivery-task/del-1/accept`);
      req.flush('Already assigned', { status: 400, statusText: 'Bad Request' });

      expect(errorResponse.status).toBe(400);
    });
  });
});
