import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService, MenuItem, MenuCategory } from '../../services/restaurant.service';

interface MenuItemDisplay {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  available: boolean;
  description: string;
  image?: string;
}

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss']
})
export class MenuManagementComponent implements OnInit {
  showAddModal = false;
  activeCategory = 'All';
  editingItem: MenuItemDisplay | null = null;
  
  categories: string[] = ['All'];
  categoriesForSelect: { id: string; name: string }[] = [];
  menuItems: MenuItemDisplay[] = [];
  
  newItem = {
    name: '',
    categoryId: '',
    price: 0,
    description: '',
    imageUrl: '',
    isAvailable: true
  };
  
  private restaurantId = '';
  private categoryMap: Map<string, string> = new Map();

  constructor(private restaurantService: RestaurantService) {}

  ngOnInit(): void {
    this.loadRestaurantData();
  }

  private loadRestaurantData(): void {
    this.restaurantService.getRestaurants().subscribe(restaurants => {
      if (restaurants.length > 0) {
        this.restaurantId = restaurants[0].id;
        this.loadMenuItems();
      }
      // If no restaurants, leave empty state
    });
  }

  private loadCategories(): void {
    // Kept for reference but not called independently anymore
  }

  private loadMenuItems(): void {
    this.restaurantService.getCategoriesWithItems(this.restaurantId).subscribe(cats => {
      if (cats.length > 0) {
        this.categories = ['All', ...cats.map(c => c.name)];
        this.categoriesForSelect = cats.map(c => ({ id: c.id, name: c.name }));
        cats.forEach(c => this.categoryMap.set(c.id, c.name));
        this.menuItems = cats.flatMap(c => (c.items || []).map(item => ({
          id: item.id,
          name: item.name,
          category: c.name,
          categoryId: item.categoryId,
          price: item.price,
          available: item.isAvailable,
          description: item.description,
          image: item.imageUrl
        })));
      } else {
        // No data — show empty state
        this.categories = ['All'];
        this.categoriesForSelect = [];
        this.menuItems = [];
      }
    });
  }

  private useMockData(): void {
    // Removed — no mock data; show empty state instead
    this.categories = ['All'];
    this.categoriesForSelect = [];
    this.menuItems = [];
  }
  
  get filteredItems(): MenuItemDisplay[] {
    if (this.activeCategory === 'All') return this.menuItems;
    return this.menuItems.filter(i => i.category === this.activeCategory);
  }
  
  editItem(item: MenuItemDisplay): void {
    this.editingItem = item;
    this.newItem = {
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      description: item.description,
      imageUrl: item.image || '',
      isAvailable: item.available
    };
    this.showAddModal = true;
  }

  closeModal(): void {
    this.showAddModal = false;
    this.editingItem = null;
    this.resetForm();
  }

  resetForm(): void {
    this.newItem = {
      name: '',
      categoryId: '',
      price: 0,
      description: '',
      imageUrl: '',
      isAvailable: true
    };
  }

  isFormValid(): boolean {
    return this.newItem.name.trim() !== '' && 
           this.newItem.categoryId !== '' && 
           this.newItem.price > 0;
  }

  saveItem(): void {
    if (!this.isFormValid()) return;

    if (this.editingItem) {
      // Update via API
      this.restaurantService.updateMenuItem(this.restaurantId, this.editingItem.id, {
        name: this.newItem.name,
        description: this.newItem.description,
        price: this.newItem.price,
        imageUrl: this.newItem.imageUrl || undefined,
        preparationTimeMinutes: 15,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isSpicy: false,
        allergens: []
      }).subscribe({
        next: () => {
          const index = this.menuItems.findIndex(i => i.id === this.editingItem!.id);
          if (index !== -1) {
            this.menuItems[index] = {
              ...this.menuItems[index],
              name: this.newItem.name,
              categoryId: this.newItem.categoryId,
              category: this.categoryMap.get(this.newItem.categoryId) || 'Other',
              price: this.newItem.price,
              description: this.newItem.description,
              image: this.newItem.imageUrl || '',
              available: this.newItem.isAvailable
            };
          }
          this.closeModal();
        },
        error: () => alert('Failed to update item')
      });
    } else {
      // Add via API
      this.restaurantService.addMenuItem(this.restaurantId, {
        categoryId: this.newItem.categoryId,
        name: this.newItem.name,
        description: this.newItem.description,
        price: this.newItem.price,
        imageUrl: this.newItem.imageUrl || undefined,
        preparationTimeMinutes: 15,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isSpicy: false,
        allergens: []
      }).subscribe({
        next: (created) => {
          this.menuItems.push({
            id: created.id,
            name: this.newItem.name,
            categoryId: this.newItem.categoryId,
            category: this.categoryMap.get(this.newItem.categoryId) || 'Other',
            price: this.newItem.price,
            description: this.newItem.description,
            image: this.newItem.imageUrl || '',
            available: this.newItem.isAvailable
          });
          this.closeModal();
        },
        error: () => alert('Failed to add item')
      });
    }
  }
  
  deleteItem(item: MenuItemDisplay): void {
    // Remove from UI immediately; API call is best-effort
    this.menuItems = this.menuItems.filter(i => i.id !== item.id);
    this.restaurantService.deleteMenuItem(this.restaurantId, item.id).subscribe({
      error: () => {} // Silently ignore API errors for mock items
    });
  }

  toggleAvailability(item: MenuItemDisplay): void {
    const newAvail = !item.available;
    this.restaurantService.toggleMenuItemAvailability(
      this.restaurantId, 
      item.id, 
      newAvail
    ).subscribe({
      next: () => { item.available = newAvail; },
      error: () => {} // Silently ignore - toggle might not be supported
    });
  }
}
