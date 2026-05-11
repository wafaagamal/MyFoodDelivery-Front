import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OrderingService } from '../../services/ordering.service';
import { Restaurant, Menu, MenuItem, AddToCartRequest, Cart } from '../../models/ordering.models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.scss']
})
export class RestaurantDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  restaurantId!: string;
  restaurant: Restaurant | null = null;
  menu: Menu | null = null;
  cart: Cart | null = null;
  
  activeCategory: string | null = null;
  selectedItem: MenuItem | null = null;
  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderingService: OrderingService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.restaurantId = this.route.snapshot.params['id'];
    this.loadRestaurant();
    this.loadCart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRestaurant(): void {
    this.orderingService.getRestaurant(this.restaurantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (restaurant) => {
          this.restaurant = restaurant;
          // Build menu from restaurant categories
          if (restaurant.categories && restaurant.categories.length > 0) {
            this.menu = {
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              categories: restaurant.categories
            };
            this.activeCategory = this.menu.categories[0].id;
          } else {
            // Create mock categories if none exist
            this.menu = {
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              categories: [
                {
                  id: 'cat-1',
                  name: 'Popular',
                  description: 'Our most popular items',
                  displayOrder: 1,
                  items: [
                    { id: 'item-1', categoryId: 'cat-1', name: 'Margherita Pizza', description: 'Classic tomato and mozzarella', price: 12.99, preparationTimeMinutes: 20, isAvailable: true, isVegetarian: true, isVegan: false, isGlutenFree: false, isSpicy: false, isFeatured: true, allergens: [] },
                    { id: 'item-2', categoryId: 'cat-1', name: 'Pepperoni Pizza', description: 'Loaded with pepperoni', price: 14.99, preparationTimeMinutes: 20, isAvailable: true, isVegetarian: false, isVegan: false, isGlutenFree: false, isSpicy: false, isFeatured: true, allergens: [] }
                  ]
                },
                {
                  id: 'cat-2',
                  name: 'Pasta',
                  description: 'Fresh pasta dishes',
                  displayOrder: 2,
                  items: [
                    { id: 'item-3', categoryId: 'cat-2', name: 'Spaghetti Bolognese', description: 'Classic meat sauce', price: 13.99, preparationTimeMinutes: 15, isAvailable: true, isVegetarian: false, isVegan: false, isGlutenFree: false, isSpicy: false, isFeatured: false, allergens: [] },
                    { id: 'item-4', categoryId: 'cat-2', name: 'Fettuccine Alfredo', description: 'Creamy parmesan sauce', price: 12.99, preparationTimeMinutes: 15, isAvailable: true, isVegetarian: true, isVegan: false, isGlutenFree: false, isSpicy: false, isFeatured: false, allergens: ['dairy'] }
                  ]
                },
                {
                  id: 'cat-3',
                  name: 'Salads',
                  displayOrder: 3,
                  items: [
                    { id: 'item-5', categoryId: 'cat-3', name: 'Caesar Salad', description: 'Fresh romaine with caesar dressing', price: 8.99, preparationTimeMinutes: 10, isAvailable: true, isVegetarian: true, isVegan: false, isGlutenFree: true, isSpicy: false, isFeatured: false, allergens: [] },
                    { id: 'item-6', categoryId: 'cat-3', name: 'Garden Salad', description: 'Mixed greens with vinaigrette', price: 7.99, preparationTimeMinutes: 10, isAvailable: true, isVegetarian: true, isVegan: true, isGlutenFree: true, isSpicy: false, isFeatured: false, allergens: [] }
                  ]
                }
              ]
            };
            this.activeCategory = 'cat-1';
          }
        },
        error: (err) => {
          console.error('Error loading restaurant:', err);
        }
      });
  }

  private loadCart(): void {
    this.orderingService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cart = cart;
        },
        error: () => {
          // Cart service not available, use mock cart
          this.cart = { 
            customerId: '', 
            restaurantId: this.restaurantId, 
            restaurantName: this.restaurant?.name || '', 
            items: [], 
            subtotal: 0, 
            deliveryFee: 0, 
            serviceFee: 0, 
            total: 0,
            minimumOrderAmount: 0,
            meetsMinimum: true
          };
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/customer/restaurants']);
  }

  scrollToCategory(categoryId: string): void {
    this.activeCategory = categoryId;
    const element = document.getElementById('category-' + categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openItemModal(item: MenuItem): void {
    if (!item.isAvailable) return;
    this.selectedItem = item;
    this.quantity = 1;
  }

  closeModal(): void {
    this.selectedItem = null;
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(item: MenuItem, event: Event): void {
    event.stopPropagation();
    if (!item.isAvailable || !this.restaurant) return;

    const request: AddToCartRequest = {
      restaurantId: this.restaurant.id,
      menuItemId: item.id,
      menuItemName: item.name,
      unitPrice: item.discountedPrice || item.price,
      quantity: 1
    };

    this.orderingService.addToCart(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`${item.name} added to cart.`);
          this.loadCart();
        },
        error: () => this.toast.error('Failed to add item to cart.')
      });
  }

  confirmAddToCart(): void {
    if (!this.selectedItem || !this.restaurant) return;

    const request: AddToCartRequest = {
      restaurantId: this.restaurant.id,
      menuItemId: this.selectedItem.id,
      menuItemName: this.selectedItem.name,
      unitPrice: this.selectedItem.discountedPrice || this.selectedItem.price,
      quantity: this.quantity
    };

    this.orderingService.addToCart(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.success(`${this.selectedItem!.name} ×${this.quantity} added to cart.`);
          this.loadCart();
          this.closeModal();
        },
        error: () => this.toast.error('Failed to add item to cart.')
      });
  }
}
