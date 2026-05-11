import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderingService } from './ordering.service';
import {
  Restaurant,
  Menu,
  Cart,
  AddToCartRequest,
  CreateOrderRequest,
  CreateOrderResult,
  Order,
  OrderTracking,
  OrderListItem,
  PaymentMethodType
} from '../models/ordering.models';
import { environment } from '../../../environments/environment';

describe('OrderingService', () => {
  let service: OrderingService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  // Mock Data
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
      logoUrl: 'https://example.com/logo.jpg',
      bannerUrl: 'https://example.com/banner.jpg',
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
      minimumOrderAmount: 20,
      deliveryFee: 0,
      estimatedDeliveryMinutes: 45,
      averageRating: 4.8,
      totalRatings: 180,
      isOpen: true,
      acceptingOrders: true,
      distanceKm: 2.3
    }
  ];

  const mockMenu: Menu = {
    restaurantId: 'rest-1',
    restaurantName: 'Pizza Palace',
    categories: [
      {
        id: 'cat-1',
        name: 'Pizzas',
        description: 'Our specialty pizzas',
        displayOrder: 1,
        items: [
          {
            id: 'item-1',
            categoryId: 'cat-1',
            name: 'Margherita',
            description: 'Classic tomato and mozzarella',
            price: 12.99,
            discountedPrice: 10.99,
            imageUrl: 'https://example.com/margherita.jpg',
            preparationTimeMinutes: 15,
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            isSpicy: false,
            allergens: ['dairy', 'gluten'],
            isAvailable: true,
            isFeatured: true
          },
          {
            id: 'item-2',
            categoryId: 'cat-1',
            name: 'Pepperoni',
            description: 'Loaded with pepperoni',
            price: 14.99,
            imageUrl: 'https://example.com/pepperoni.jpg',
            preparationTimeMinutes: 15,
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
            isSpicy: true,
            allergens: ['dairy', 'gluten'],
            isAvailable: true,
            isFeatured: false
          }
        ]
      }
    ]
  };

  const mockCart: Cart = {
    customerId: 'customer-123',
    restaurantId: 'rest-1',
    restaurantName: 'Pizza Palace',
    items: [
      {
        menuItemId: 'item-1',
        name: 'Margherita',
        unitPrice: 10.99,
        quantity: 2,
        totalPrice: 21.98,
        specialInstructions: 'Extra cheese please'
      }
    ],
    subtotal: 21.98,
    deliveryFee: 2.99,
    serviceFee: 1.50,
    total: 26.47,
    minimumOrderAmount: 15,
    meetsMinimum: true
  };

  const mockOrderResult: CreateOrderResult = {
    orderId: 'order-123',
    orderNumber: 'ORD-2024-001',
    totalAmount: 26.47,
    payment: {
      requiresAction: false,
      paymentIntentId: 'pi_123'
    }
  };

  const mockOrderList: OrderListItem[] = [
    {
      id: 'order-1',
      orderNumber: 'ORD-2024-001',
      restaurantName: 'Pizza Palace',
      restaurantLogoUrl: 'https://example.com/logo.jpg',
      status: 'Delivered',
      totalAmount: 26.47,
      itemCount: 2,
      createdAt: new Date('2024-06-01T12:00:00'),
      deliveredAt: new Date('2024-06-01T12:45:00')
    } as any
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderingService]
    });
    service = TestBed.inject(OrderingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Restaurant Tests
  describe('Restaurant API', () => {
    describe('searchRestaurants', () => {
      it('should search restaurants with query params', () => {
        const params = {
          search: 'pizza',
          cuisine: 'Italian',
          openNow: true,
          skip: 0,
          take: 10
        };

        service.searchRestaurants(params).subscribe(result => {
          expect(result.items.length).toBe(1);
          expect(result.totalCount).toBe(1);
          expect(result.items[0].name).toBe('Pizza Palace');
        });

        const req = httpMock.expectOne(r => r.url === `${baseUrl}/restaurants`);
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('search')).toBe('pizza');
        expect(req.request.params.get('cuisine')).toBe('Italian');
        expect(req.request.params.get('openNow')).toBe('true');
        req.flush({ items: [mockRestaurants[0]], totalCount: 1 });
      });

      it('should search restaurants without optional params', () => {
        service.searchRestaurants({}).subscribe(result => {
          expect(result.items.length).toBe(2);
        });

        const req = httpMock.expectOne(`${baseUrl}/restaurants`);
        expect(req.request.method).toBe('GET');
        req.flush({ items: mockRestaurants, totalCount: 2 });
      });

      it('should search restaurants with location params', () => {
        const params = {
          lat: 40.7128,
          lng: -74.0060,
          radius: 5
        };

        service.searchRestaurants(params).subscribe();

        const req = httpMock.expectOne(r => r.url === `${baseUrl}/restaurants`);
        expect(req.request.params.get('lat')).toBe('40.7128');
        expect(req.request.params.get('lng')).toBe('-74.006');
        expect(req.request.params.get('radius')).toBe('5');
        req.flush({ items: mockRestaurants, totalCount: 2 });
      });

      it('should handle empty search results', () => {
        service.searchRestaurants({ search: 'nonexistent' }).subscribe(result => {
          expect(result.items.length).toBe(0);
          expect(result.totalCount).toBe(0);
        });

        const req = httpMock.expectOne(r => r.url === `${baseUrl}/restaurants`);
        req.flush({ items: [], totalCount: 0 });
      });
    });

    describe('getNearbyRestaurants', () => {
      it('should get nearby restaurants', () => {
        const lat = 40.7128;
        const lng = -74.0060;

        service.getNearbyRestaurants(lat, lng).subscribe(restaurants => {
          expect(restaurants.length).toBe(2);
        });

        const req = httpMock.expectOne(r => r.url === `${baseUrl}/restaurants/nearby`);
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('lat')).toBe(lat.toString());
        expect(req.request.params.get('lng')).toBe(lng.toString());
        expect(req.request.params.get('radius')).toBe('5');
        req.flush(mockRestaurants);
      });

      it('should get nearby restaurants with custom radius', () => {
        service.getNearbyRestaurants(40.7128, -74.0060, 10).subscribe();

        const req = httpMock.expectOne(r => r.url === `${baseUrl}/restaurants/nearby`);
        expect(req.request.params.get('radius')).toBe('10');
        req.flush(mockRestaurants);
      });
    });

    describe('getRestaurant', () => {
      it('should get a single restaurant by ID', () => {
        const restaurantId = 'rest-1';

        service.getRestaurant(restaurantId).subscribe(restaurant => {
          expect(restaurant.id).toBe(restaurantId);
          expect(restaurant.name).toBe('Pizza Palace');
          expect(restaurant.isOpen).toBe(true);
        });

        const req = httpMock.expectOne(`${baseUrl}/restaurants/${restaurantId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockRestaurants[0]);
      });

      it('should handle restaurant not found', () => {
        const restaurantId = 'nonexistent';

        service.getRestaurant(restaurantId).subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error.status).toBe(404);
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/restaurants/${restaurantId}`);
        req.flush('Restaurant not found', { status: 404, statusText: 'Not Found' });
      });
    });

    describe('getMenu', () => {
      it('should get restaurant menu', () => {
        const restaurantId = 'rest-1';

        service.getMenu(restaurantId).subscribe(menu => {
          expect(menu.restaurantId).toBe(restaurantId);
          expect(menu.categories.length).toBe(1);
          expect(menu.categories[0].items.length).toBe(2);
        });

        const req = httpMock.expectOne(`${baseUrl}/restaurants/${restaurantId}/menu`);
        expect(req.request.method).toBe('GET');
        req.flush(mockMenu);
      });

      it('should include item dietary information', () => {
        const restaurantId = 'rest-1';

        service.getMenu(restaurantId).subscribe(menu => {
          const margherita = menu.categories[0].items[0];
          expect(margherita.isVegetarian).toBe(true);
          expect(margherita.isSpicy).toBe(false);
          expect(margherita.allergens).toContain('dairy');
        });

        const req = httpMock.expectOne(`${baseUrl}/restaurants/${restaurantId}/menu`);
        req.flush(mockMenu);
      });
    });
  });

  // Cart Tests
  describe('Cart API', () => {
    describe('getCart', () => {
      it('should get the current cart', () => {
        service.getCart().subscribe(cart => {
          expect(cart.restaurantId).toBe('rest-1');
          expect(cart.items.length).toBe(1);
          expect(cart.total).toBe(26.47);
          expect(cart.meetsMinimum).toBe(true);
        });

        const req = httpMock.expectOne(`${baseUrl}/cart`);
        expect(req.request.method).toBe('GET');
        req.flush(mockCart);
      });

      it('should handle empty cart', () => {
        const emptyCart: Cart = {
          ...mockCart,
          items: [],
          subtotal: 0,
          total: 0,
          meetsMinimum: false
        };

        service.getCart().subscribe(cart => {
          expect(cart.items.length).toBe(0);
          expect(cart.meetsMinimum).toBe(false);
        });

        const req = httpMock.expectOne(`${baseUrl}/cart`);
        req.flush(emptyCart);
      });
    });

    describe('addToCart', () => {
      it('should add an item to cart', () => {
        const request: AddToCartRequest = {
          restaurantId: 'rest-1',
          menuItemId: 'item-2',
          menuItemName: 'Pepperoni',
          unitPrice: 14.99,
          quantity: 1,
          specialInstructions: 'Extra crispy'
        };

        service.addToCart(request).subscribe(() => {
          // Success
        });

        const req = httpMock.expectOne(`${baseUrl}/cart/items`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(request);
        req.flush(null);
      });

      it('should handle adding item from different restaurant', () => {
        const request: AddToCartRequest = {
          restaurantId: 'rest-2',
          menuItemId: 'item-3',
          menuItemName: 'Salmon Roll',
          unitPrice: 8.99,
          quantity: 2
        };

        service.addToCart(request).subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error.status).toBe(400);
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/cart/items`);
        req.flush('Cannot add items from different restaurant', { status: 400, statusText: 'Bad Request' });
      });
    });

    describe('updateCartItem', () => {
      it('should update cart item quantity', () => {
        const menuItemId = 'item-1';
        const quantity = 3;

        service.updateCartItem(menuItemId, quantity).subscribe(() => {
          // Success
        });

        const req = httpMock.expectOne(`${baseUrl}/cart/items/${menuItemId}`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ quantity });
        req.flush(null);
      });

      it('should handle invalid quantity', () => {
        service.updateCartItem('item-1', 0).subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error.status).toBe(400);
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/cart/items/item-1`);
        req.flush('Quantity must be at least 1', { status: 400, statusText: 'Bad Request' });
      });
    });

    describe('removeFromCart', () => {
      it('should remove an item from cart', () => {
        const menuItemId = 'item-1';

        service.removeFromCart(menuItemId).subscribe(() => {
          // Success
        });

        const req = httpMock.expectOne(`${baseUrl}/cart/items/${menuItemId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
      });
    });

    describe('clearCart', () => {
      it('should clear the entire cart', () => {
        service.clearCart().subscribe(() => {
          // Success
        });

        const req = httpMock.expectOne(`${baseUrl}/cart`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
      });
    });
  });

  // Order Tests
  describe('Order API', () => {
    describe('createOrder', () => {
      it('should create a new order', () => {
        const request: CreateOrderRequest = {
          deliveryAddress: {
            street: '123 Test St',
            buildingNumber: '1',
            city: 'New York',
            latitude: 40.7128,
            longitude: -74.0060
          },
          paymentMethod: PaymentMethodType.CreditCard,
          paymentMethodId: 'pm-1'
        };

        service.createOrder(request).subscribe(result => {
          expect(result.id).toBeTruthy();
          expect(result.orderNumber).toBe('ORD-2024-001');
        });

        const req = httpMock.expectOne(`${baseUrl}/orders`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(request);
        req.flush(mockOrderResult);
      });

      it('should handle order with notes', () => {
        const request: CreateOrderRequest = {
          deliveryAddress: {
            street: '123 Test St',
            buildingNumber: '1',
            city: 'New York',
            latitude: 40.7128,
            longitude: -74.0060,
            deliveryInstructions: 'Leave at door'
          },
          paymentMethod: PaymentMethodType.CashOnDelivery,
          notes: 'Extra napkins please'
        };

        service.createOrder(request).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/orders`);
        expect(req.request.body.notes).toBe('Extra napkins please');
        req.flush(mockOrderResult);
      });

      it('should handle restaurant closed error', () => {
        const request: CreateOrderRequest = {
          deliveryAddress: {
            street: '123 Test St',
            buildingNumber: '1',
            city: 'New York',
            latitude: 40.7128,
            longitude: -74.0060
          },
          paymentMethod: PaymentMethodType.CashOnDelivery
        };

        service.createOrder(request).subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error.status).toBe(400);
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/orders`);
        req.flush('Restaurant is currently closed', { status: 400, statusText: 'Bad Request' });
      });
    });

    describe('getOrder', () => {
      it('should get order details', () => {
        const orderId = 'order-123';

        service.getOrder(orderId).subscribe(order => {
          expect(order.id).toBe(orderId);
        });

        const req = httpMock.expectOne(`${baseUrl}/orders/${orderId}`);
        expect(req.request.method).toBe('GET');
        req.flush({ id: orderId } as Order);
      });
    });

    describe('getMyOrders', () => {
      it('should get order history with pagination', () => {
        service.getMyOrders(undefined, 0, 20).subscribe(result => {
          expect(result.items.length).toBe(1);
          expect(result.items[0].orderNumber).toBe('ORD-2024-001');
        });

        const req = httpMock.expectOne(r => r.url === `${baseUrl}/orders`);
        expect(req.request.params.get('skip')).toBe('0');
        expect(req.request.params.get('take')).toBe('20');
        req.flush({ items: mockOrderList, totalCount: 1 });
      });

      it('should filter orders by status', () => {
        service.getMyOrders('Delivered').subscribe();

        const req = httpMock.expectOne(r => r.url === `${baseUrl}/orders`);
        expect(req.request.params.get('status')).toBe('Delivered');
        req.flush({ items: mockOrderList, totalCount: 1 });
      });
    });

    describe('getActiveOrders', () => {
      it('should get active orders', () => {
        service.getActiveOrders().subscribe(orders => {
          expect(orders.length).toBeGreaterThanOrEqual(0);
        });

        const req = httpMock.expectOne(`${baseUrl}/orders/active`);
        expect(req.request.method).toBe('GET');
        req.flush([]);
      });
    });

    describe('getOrderTracking', () => {
      it('should get order tracking info', () => {
        const orderId = 'order-123';

        service.getOrderTracking(orderId).subscribe(tracking => {
          expect(tracking).toBeTruthy();
        });

        const req = httpMock.expectOne(`${baseUrl}/orders/${orderId}/tracking`);
        expect(req.request.method).toBe('GET');
        req.flush({} as OrderTracking);
      });
    });

    describe('confirmPayment', () => {
      it('should confirm payment for an order', () => {
        const orderId = 'order-123';
        const paymentIntentId = 'pi_123';

        service.confirmPayment(orderId, paymentIntentId).subscribe(() => {
          // Success
        });

        const req = httpMock.expectOne(`${baseUrl}/orders/${orderId}/confirm-payment`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ paymentIntentId });
        req.flush(null);
      });
    });

    describe('cancelOrder', () => {
      it('should cancel an order with reason', () => {
        const orderId = 'order-123';
        const reason = 'Changed my mind';

        service.cancelOrder(orderId, reason).subscribe(() => {
          // Success
        });

        const req = httpMock.expectOne(`${baseUrl}/orders/${orderId}/cancel`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ reason });
        req.flush(null);
      });

      it('should handle cannot cancel order error', () => {
        service.cancelOrder('order-123', 'reason').subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error.status).toBe(400);
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/orders/order-123/cancel`);
        req.flush('Order cannot be cancelled at this stage', { status: 400, statusText: 'Bad Request' });
      });
    });

    describe('rateOrder', () => {
      it('should submit order rating', () => {
        const orderId = 'order-123';

        service.rateOrder(orderId, 5, 4, 'Great food!').subscribe(() => {
          // Success
        });

        const req = httpMock.expectOne(`${baseUrl}/orders/${orderId}/rate`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({
          restaurantRating: 5,
          deliveryRating: 4,
          review: 'Great food!'
        });
        req.flush(null);
      });

      it('should submit rating without delivery rating', () => {
        const orderId = 'order-123';

        service.rateOrder(orderId, 4).subscribe();

        const req = httpMock.expectOne(`${baseUrl}/orders/${orderId}/rate`);
        expect(req.request.body).toEqual({
          restaurantRating: 4,
          deliveryRating: undefined,
          review: undefined
        });
        req.flush(null);
      });

      it('should handle already rated error', () => {
        service.rateOrder('order-123', 5).subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error.status).toBe(400);
          }
        });

        const req = httpMock.expectOne(`${baseUrl}/orders/order-123/rate`);
        req.flush('Order has already been rated', { status: 400, statusText: 'Bad Request' });
      });
    });
  });

  // Error Handling
  describe('Error Handling', () => {
    it('should handle network errors', () => {
      service.searchRestaurants({}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/restaurants`);
      req.error(new ProgressEvent('error'), { status: 0 });
    });

    it('should handle server errors', () => {
      service.getCart().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/cart`);
      req.flush('Internal server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
