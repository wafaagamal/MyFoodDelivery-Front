import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { DeliveryHomeComponent } from './home.component';
import { DeliveryService } from '../../services/delivery.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  Rider,
  AvailableDelivery,
  TodaySummary,
  CurrentDelivery,
  RiderStatus,
  DeliveryTaskStatus
} from '../../models/delivery.models';

describe('DeliveryHomeComponent', () => {
  let component: DeliveryHomeComponent;
  let fixture: ComponentFixture<DeliveryHomeComponent>;
  let mockDeliveryService: jasmine.SpyObj<DeliveryService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

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

  beforeEach(async () => {
    mockDeliveryService = jasmine.createSpyObj('DeliveryService', [
      'getMyRider',
      'getAvailableDeliveries',
      'getTodaySummary',
      'getCurrentDelivery',
      'updateStatus',
      'acceptDelivery',
      'declineDelivery'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    // Setup default return values
    mockDeliveryService.getMyRider.and.returnValue(of(mockRider));
    mockDeliveryService.getAvailableDeliveries.and.returnValue(of(mockAvailableDeliveries));
    mockDeliveryService.getTodaySummary.and.returnValue(of(mockTodaySummary));
    mockDeliveryService.getCurrentDelivery.and.returnValue(of(null));
    mockDeliveryService.updateStatus.and.returnValue(of(undefined));
    mockDeliveryService.acceptDelivery.and.returnValue(of(undefined));
    mockDeliveryService.declineDelivery.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [
        DeliveryHomeComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: DeliveryService, useValue: mockDeliveryService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryHomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load rider profile on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDeliveryService.getMyRider).toHaveBeenCalled();
    }));

    it('should load available deliveries when online', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDeliveryService.getAvailableDeliveries).toHaveBeenCalled();
    }));

    it('should load today summary on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDeliveryService.getTodaySummary).toHaveBeenCalled();
    }));

    it('should load current delivery on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDeliveryService.getCurrentDelivery).toHaveBeenCalled();
    }));

    it('should set isOnline from rider data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isOnline).toBe(true);
    }));

    it('should set available deliveries from API', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.availableDeliveries).toEqual(mockAvailableDeliveries);
    }));

    it('should set today summary from API', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.todaySummary).toEqual(mockTodaySummary);
    }));
  });

  describe('Online/Offline Toggle', () => {
    it('should toggle status', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.isOnline = true;
      component.toggleStatus();
      tick();

      expect(mockDeliveryService.updateStatus).toHaveBeenCalledWith('rider-1', true);
    }));

    it('should show success toast when going online', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.isOnline = true;
      component.toggleStatus();
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith('You are now online.');
    }));

    it('should show success toast when going offline', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.isOnline = false;
      component.toggleStatus();
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith('You are now offline.');
    }));

    it('should handle error when toggling status', fakeAsync(() => {
      mockDeliveryService.updateStatus.and.returnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();
      tick();

      component.isOnline = true;
      component.toggleStatus();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Failed to update status. Please try again.');
    }));
  });

  describe('Accept Delivery', () => {
    it('should call accept delivery API with delivery', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const delivery = mockAvailableDeliveries[0];
      component.acceptDelivery(delivery);
      tick();

      expect(mockDeliveryService.acceptDelivery).toHaveBeenCalledWith('del-1');
    }));

    it('should show success toast on accept', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const delivery = mockAvailableDeliveries[0];
      component.acceptDelivery(delivery);
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith('Delivery accepted!');
    }));

    it('should remove delivery from list after accepting', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.availableDeliveries.length).toBe(1);
      
      const delivery = mockAvailableDeliveries[0];
      component.acceptDelivery(delivery);
      tick();

      expect(component.availableDeliveries.length).toBe(0);
    }));

    it('should handle error when accepting delivery', fakeAsync(() => {
      mockDeliveryService.acceptDelivery.and.returnValue(throwError(() => new Error('Already taken')));
      fixture.detectChanges();
      tick();

      const delivery = mockAvailableDeliveries[0];
      component.acceptDelivery(delivery);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Failed to accept delivery.');
    }));
  });

  describe('Decline Delivery', () => {
    it('should call decline delivery API', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const delivery = mockAvailableDeliveries[0];
      component.declineDelivery(delivery);
      tick();

      expect(mockDeliveryService.declineDelivery).toHaveBeenCalledWith('del-1');
    }));

    it('should remove delivery from list after declining', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.availableDeliveries.length).toBe(1);
      
      const delivery = mockAvailableDeliveries[0];
      component.declineDelivery(delivery);
      tick();

      expect(component.availableDeliveries.length).toBe(0);
    }));
  });

  describe('Current Delivery Display', () => {
    it('should show current delivery when active', fakeAsync(() => {
      mockDeliveryService.getCurrentDelivery.and.returnValue(of(mockCurrentDelivery));
      
      fixture.detectChanges();
      tick();

      expect(component.currentDelivery).toEqual(mockCurrentDelivery);
    }));

    it('should not show current delivery when null', fakeAsync(() => {
      mockDeliveryService.getCurrentDelivery.and.returnValue(of(null));
      
      fixture.detectChanges();
      tick();

      expect(component.currentDelivery).toBeNull();
    }));
  });

  describe('Error Handling', () => {
    it('should handle error when loading rider profile', fakeAsync(() => {
      mockDeliveryService.getMyRider.and.returnValue(throwError(() => new Error('API Error')));
      
      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Failed to load rider data.');
    }));

    it('should show error when rider not found', fakeAsync(() => {
      mockDeliveryService.getMyRider.and.returnValue(of(null as unknown as Rider));
      
      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('No rider profile found for your account.');
    }));
  });
});
