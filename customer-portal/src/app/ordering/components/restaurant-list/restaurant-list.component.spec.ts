import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, delay } from 'rxjs';
import { RestaurantListComponent } from './restaurant-list.component';
import { OrderingService } from '../../services/ordering.service';
import { Restaurant } from '../../models/ordering.models';

describe('RestaurantListComponent', () => {
  let component: RestaurantListComponent;
  let fixture: ComponentFixture<RestaurantListComponent>;
  let mockOrderingService: jasmine.SpyObj<OrderingService>;

  const mockRestaurants: Restaurant[] = [
    {
      id: 'rest-1',
      name: 'Pizza Palace',
      description: 'Best pizza in town',
      cuisineType: 'Italian',
      phoneNumber: '+1234567890',
      email: 'contact@pizzapalace.com',
      address: {
        street: '123 Pizza St',
        buildingNumber: '1',
        city: 'New York',
        district: 'Manhattan',
        postalCode: '10001',
        country: 'USA',
        latitude: 40.7128,
        longitude: -74.0060,
        fullAddress: '123 Pizza St, Manhattan, New York'
      },
      logoUrl: 'https://example.com/logo1.jpg',
      minimumOrderAmount: 15,
      deliveryFee: 2.99,
      estimatedDeliveryMinutes: 30,
      averageRating: 4.5,
      totalRatings: 250,
      isOpen: true,
      acceptingOrders: true,
      distanceKm: 1.5
    },
    {
      id: 'rest-2',
      name: 'Sushi Express',
      description: 'Fresh sushi daily',
      cuisineType: 'Japanese',
      phoneNumber: '+1987654321',
      email: 'hello@sushiexpress.com',
      address: {
        street: '456 Sushi Ave',
        buildingNumber: '10',
        city: 'New York',
        district: 'Brooklyn',
        postalCode: '11201',
        country: 'USA',
        latitude: 40.6892,
        longitude: -73.9857,
        fullAddress: '456 Sushi Ave, Brooklyn, New York'
      },
      logoUrl: 'https://example.com/logo2.jpg',
      minimumOrderAmount: 20,
      deliveryFee: 0,
      estimatedDeliveryMinutes: 45,
      averageRating: 4.8,
      totalRatings: 180,
      isOpen: true,
      acceptingOrders: true,
      distanceKm: 2.3
    },
    {
      id: 'rest-3',
      name: 'Closed Kitchen',
      description: 'Currently not accepting orders',
      cuisineType: 'American',
      phoneNumber: '+1111111111',
      email: 'hello@closed.com',
      address: {
        street: '789 Closed St',
        buildingNumber: '5',
        city: 'New York',
        district: 'Queens',
        postalCode: '11375',
        country: 'USA',
        latitude: 40.7200,
        longitude: -73.8500,
        fullAddress: '789 Closed St, Queens, New York'
      },
      minimumOrderAmount: 10,
      deliveryFee: 3.99,
      estimatedDeliveryMinutes: 40,
      averageRating: 4.0,
      totalRatings: 100,
      isOpen: false,
      acceptingOrders: false,
      distanceKm: 3.0
    }
  ];

  beforeEach(async () => {
    mockOrderingService = jasmine.createSpyObj('OrderingService', ['searchRestaurants']);
    mockOrderingService.searchRestaurants.and.returnValue(of({ items: mockRestaurants, totalCount: 3 }));

    await TestBed.configureTestingModule({
      imports: [
        RestaurantListComponent,
        FormsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: OrderingService, useValue: mockOrderingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurantListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have empty restaurants list initially', () => {
      expect(component.restaurants).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should have hasMore true initially', () => {
      expect(component.hasMore).toBe(true);
    });

    it('should have empty search term', () => {
      expect(component.searchTerm).toBe('');
    });

    it('should have no cuisine selected', () => {
      expect(component.selectedCuisine).toBeNull();
    });

    it('should have openNow filter off', () => {
      expect(component.openNow).toBe(false);
    });
  });

  describe('Loading Restaurants', () => {
    it('should load restaurants on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockOrderingService.searchRestaurants).toHaveBeenCalled();
    }));

    it('should display loaded restaurants', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.restaurants.length).toBe(3);
      expect(component.restaurants[0].name).toBe('Pizza Palace');
    }));

    it('should set loading state during API call', fakeAsync(() => {
      mockOrderingService.searchRestaurants.and.returnValue(
        of({ items: mockRestaurants, totalCount: 3 }).pipe(delay(100))
      );

      fixture.detectChanges();

      expect(component.isLoading).toBe(true);

      tick(100);

      expect(component.isLoading).toBe(false);
    }));

    it('should handle API errors gracefully', fakeAsync(() => {
      mockOrderingService.searchRestaurants.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.restaurants).toEqual([]);
    }));
  });

  describe('UI Response to Restaurant Data', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should render restaurant cards', () => {
      const cards = fixture.nativeElement.querySelectorAll('.restaurant-card');
      expect(cards.length).toBe(3);
    });

    it('should display restaurant names', () => {
      const names = fixture.nativeElement.querySelectorAll('.restaurant-name');
      expect(names[0].textContent).toContain('Pizza Palace');
      expect(names[1].textContent).toContain('Sushi Express');
    });

    it('should display restaurant ratings', () => {
      const ratings = fixture.nativeElement.querySelectorAll('.rating span');
      expect(ratings[0].textContent).toContain('4.5');
    });

    it('should display cuisine type', () => {
      const cuisines = fixture.nativeElement.querySelectorAll('.cuisine');
      expect(cuisines[0].textContent).toContain('Italian');
      expect(cuisines[1].textContent).toContain('Japanese');
    });

    it('should display delivery time', () => {
      const times = fixture.nativeElement.querySelectorAll('.delivery-time');
      expect(times[0].textContent).toContain('30 min');
    });

    it('should display delivery fee', () => {
      const fees = fixture.nativeElement.querySelectorAll('.delivery-fee');
      expect(fees[0].textContent).toContain('$2.99');
    });

    it('should display free delivery badge for zero fee', () => {
      const promoBadges = fixture.nativeElement.querySelectorAll('.promo-badge');
      // Sushi Express has free delivery
      expect(promoBadges.length).toBeGreaterThan(0);
    });

    it('should display closed overlay for closed restaurants', () => {
      const closedOverlays = fixture.nativeElement.querySelectorAll('.closed-overlay');
      expect(closedOverlays.length).toBe(1);
      expect(closedOverlays[0].textContent).toContain('Closed');
    });

    it('should display distance when available', () => {
      const distances = fixture.nativeElement.querySelectorAll('.distance');
      expect(distances[0].textContent).toContain('1.5 km');
    });
  });

  describe('Loading State UI', () => {
    it('should show loading spinner when loading', fakeAsync(() => {
      mockOrderingService.searchRestaurants.and.returnValue(
        of({ items: [], totalCount: 0 }).pipe(delay(500))
      );

      component.isLoading = true;
      fixture.detectChanges();

      const loading = fixture.nativeElement.querySelector('.loading');
      expect(loading).toBeTruthy();
      expect(loading.textContent).toContain('Loading restaurants');

      tick(500);
    }));

    it('should hide loading spinner when not loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const loading = fixture.nativeElement.querySelector('.loading');
      expect(loading).toBeFalsy();
    }));
  });

  describe('No Results UI', () => {
    it('should show no results message when empty', fakeAsync(() => {
      mockOrderingService.searchRestaurants.and.returnValue(of({ items: [], totalCount: 0 }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const noResults = fixture.nativeElement.querySelector('.no-results');
      expect(noResults).toBeTruthy();
      expect(noResults.textContent).toContain('No restaurants found');
    }));

    it('should hide no results when restaurants exist', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const noResults = fixture.nativeElement.querySelector('.no-results');
      expect(noResults).toBeFalsy();
    }));
  });

  describe('Search Functionality', () => {
    it('should call API with search term', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.searchTerm = 'pizza';
      component.onSearchChange('pizza');
      tick(300); // debounce time

      expect(mockOrderingService.searchRestaurants).toHaveBeenCalledWith(
        jasmine.objectContaining({ search: 'pizza' })
      );
    }));

    it('should debounce search input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockOrderingService.searchRestaurants.calls.reset();

      component.onSearchChange('p');
      tick(100);
      component.onSearchChange('pi');
      tick(100);
      component.onSearchChange('piz');
      tick(100);
      component.onSearchChange('pizza');
      tick(300);

      // Should only call once due to debounce
      expect(mockOrderingService.searchRestaurants).toHaveBeenCalledTimes(1);
    }));

    it('should reset pagination on search', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.searchTerm = 'sushi';
      component.onSearchChange('sushi');
      tick(300);

      expect(mockOrderingService.searchRestaurants).toHaveBeenCalledWith(
        jasmine.objectContaining({ skip: 0 })
      );
    }));
  });

  describe('Cuisine Filter', () => {
    it('should render cuisine filter chips', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('.filter-chip');
      expect(chips.length).toBeGreaterThan(0);
    }));

    it('should filter by cuisine on chip click', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockOrderingService.searchRestaurants.calls.reset();

      component.filterByCuisine('Italian');
      tick();

      expect(component.selectedCuisine).toBe('Italian');
      expect(mockOrderingService.searchRestaurants).toHaveBeenCalledWith(
        jasmine.objectContaining({ cuisine: 'Italian' })
      );
    }));

    it('should clear cuisine filter when selecting All', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedCuisine = 'Italian';
      component.filterByCuisine(null);
      tick();

      expect(component.selectedCuisine).toBeNull();
    }));

    it('should highlight active cuisine chip', fakeAsync(() => {
      component.selectedCuisine = 'Pizza';
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const activeChips = fixture.nativeElement.querySelectorAll('.filter-chip.active');
      expect(activeChips.length).toBeGreaterThan(0);
    }));
  });

  describe('Open Now Filter', () => {
    it('should toggle open now filter', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockOrderingService.searchRestaurants.calls.reset();

      expect(component.openNow).toBe(false);

      component.toggleOpenNow();
      tick();

      expect(component.openNow).toBe(true);
      expect(mockOrderingService.searchRestaurants).toHaveBeenCalledWith(
        jasmine.objectContaining({ openNow: true })
      );
    }));

    it('should highlight open now button when active', fakeAsync(() => {
      component.openNow = true;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const openNowBtn = fixture.nativeElement.querySelector('.filter-btn.active');
      expect(openNowBtn).toBeTruthy();
    }));
  });

  describe('Pagination (Load More)', () => {
    it('should show load more button when hasMore is true', fakeAsync(() => {
      mockOrderingService.searchRestaurants.and.returnValue(
        of({ items: mockRestaurants.slice(0, 2), totalCount: 10 })
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const loadMore = fixture.nativeElement.querySelector('.load-more button');
      expect(loadMore).toBeTruthy();
    }));

    it('should hide load more when no more items', fakeAsync(() => {
      mockOrderingService.searchRestaurants.and.returnValue(
        of({ items: mockRestaurants, totalCount: 3 })
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const loadMore = fixture.nativeElement.querySelector('.load-more');
      expect(loadMore).toBeFalsy();
    }));

    it('should load more restaurants on button click', fakeAsync(() => {
      mockOrderingService.searchRestaurants.and.returnValue(
        of({ items: mockRestaurants.slice(0, 2), totalCount: 10 })
      );

      fixture.detectChanges();
      tick();
      mockOrderingService.searchRestaurants.calls.reset();

      component.loadMore();
      tick();

      expect(mockOrderingService.searchRestaurants).toHaveBeenCalledWith(
        jasmine.objectContaining({ skip: 10 }) // 0 + take(10)
      );
    }));

    it('should append new restaurants to existing list', fakeAsync(() => {
      mockOrderingService.searchRestaurants.and.returnValue(
        of({ items: mockRestaurants.slice(0, 2), totalCount: 10 })
      );

      fixture.detectChanges();
      tick();

      const initialCount = component.restaurants.length;

      mockOrderingService.searchRestaurants.and.returnValue(
        of({ items: [mockRestaurants[2]], totalCount: 10 })
      );

      component.loadMore();
      tick();

      expect(component.restaurants.length).toBe(initialCount + 1);
    }));
  });

  describe('Restaurant Card Navigation', () => {
    it('should have router link to restaurant detail', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.restaurant-card');
      const firstCard = cards[0];

      expect(firstCard.getAttribute('ng-reflect-router-link')).toContain('restaurants');
    }));
  });

  describe('Search Header', () => {
    it('should display location bar', () => {
      fixture.detectChanges();

      const locationBar = fixture.nativeElement.querySelector('.location-bar');
      expect(locationBar).toBeTruthy();
    });

    it('should display search bar', () => {
      fixture.detectChanges();

      const searchBar = fixture.nativeElement.querySelector('.search-bar');
      expect(searchBar).toBeTruthy();
    });

    it('should have change location button', () => {
      fixture.detectChanges();

      const changeBtn = fixture.nativeElement.querySelector('.change-btn');
      expect(changeBtn).toBeTruthy();
      expect(changeBtn.textContent).toContain('Change');
    });
  });

  describe('Component Cleanup', () => {
    it('should complete destroy subject on destroy', () => {
      fixture.detectChanges();

      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
