import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { DeliveriesComponent } from './deliveries.component';
import { DeliveryService } from '../../services/delivery.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DeliveryHistory, DeliveryTaskStatus } from '../../models/delivery.models';

describe('DeliveriesComponent', () => {
  let component: DeliveriesComponent;
  let fixture: ComponentFixture<DeliveriesComponent>;
  let mockDeliveryService: jasmine.SpyObj<DeliveryService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

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
    },
    {
      id: 'del-2',
      orderId: 'order-2',
      restaurantName: 'Sushi Express',
      customerName: 'Bob Smith',
      pickupAddress: '789 Sushi Blvd',
      dropoffAddress: '789 Home St',
      status: DeliveryTaskStatus.Assigned,
      earning: 8.00,
      tip: 2.00,
      createdAt: new Date()
    },
    {
      id: 'del-3',
      orderId: 'order-3',
      restaurantName: 'Burger Joint',
      customerName: 'Alice Johnson',
      pickupAddress: '321 Burger Lane',
      dropoffAddress: '321 Main St',
      status: DeliveryTaskStatus.Cancelled,
      earning: 0,
      tip: 0,
      completedAt: new Date(),
      createdAt: new Date()
    }
  ];

  beforeEach(async () => {
    mockDeliveryService = jasmine.createSpyObj('DeliveryService', ['getDeliveryHistory']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    mockDeliveryService.getDeliveryHistory.and.returnValue(of(mockDeliveryHistory));

    await TestBed.configureTestingModule({
      imports: [
        DeliveriesComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: DeliveryService, useValue: mockDeliveryService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveriesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load delivery history on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDeliveryService.getDeliveryHistory).toHaveBeenCalled();
    }));

    it('should set deliveries from API', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.deliveries.length).toBe(3);
    }));

    it('should set loading to false after load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.loading).toBe(false);
    }));

    it('should have default activeTab as all', () => {
      expect(component.activeTab).toBe('all');
    });
  });

  describe('Filtering by Tab', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show all deliveries when activeTab is all', () => {
      component.activeTab = 'all';
      
      expect(component.filteredDeliveries.length).toBe(3);
    });

    it('should filter by completed status', () => {
      component.activeTab = 'completed';
      
      const filtered = component.filteredDeliveries;
      expect(filtered.every(d => d.status === 'Completed')).toBe(true);
    });

    it('should filter by in-progress status', () => {
      component.activeTab = 'in-progress';
      
      const filtered = component.filteredDeliveries;
      expect(filtered.every(d => d.status === 'In Progress')).toBe(true);
    });

    it('should filter by cancelled status', () => {
      component.activeTab = 'cancelled';
      
      const filtered = component.filteredDeliveries;
      expect(filtered.every(d => d.status === 'Cancelled')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading history', fakeAsync(() => {
      mockDeliveryService.getDeliveryHistory.and.returnValue(throwError(() => new Error('API Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.loadError).toBe(true);
      expect(mockToastService.error).toHaveBeenCalledWith('Failed to load delivery history.');
    }));

    it('should set loading to false on error', fakeAsync(() => {
      mockDeliveryService.getDeliveryHistory.and.returnValue(throwError(() => new Error('API Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.loading).toBe(false);
    }));
  });

  describe('Display Data Transformation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should transform history to display format', () => {
      const display = component.deliveries[0];
      expect(display.restaurantName).toBe('Pizza Palace');
      expect(display.dropoffAddress).toBe('456 Customer Ave');
      expect(display.earning).toBe(12.50);
      expect(display.tip).toBe(5.00);
    });

    it('should set statusClass based on status', () => {
      const completed = component.deliveries.find(d => d.status === 'Completed');
      const cancelled = component.deliveries.find(d => d.status === 'Cancelled');
      
      expect(completed?.statusClass).toBe('completed');
      expect(cancelled?.statusClass).toBe('cancelled');
    });
  });

  describe('Tab Configuration', () => {
    it('should have all required tabs', () => {
      expect(component.tabs.length).toBe(4);
      expect(component.tabs.map(t => t.value)).toContain('all');
      expect(component.tabs.map(t => t.value)).toContain('completed');
      expect(component.tabs.map(t => t.value)).toContain('in-progress');
      expect(component.tabs.map(t => t.value)).toContain('cancelled');
    });
  });
});
