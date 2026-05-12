import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-restaurant-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class RestaurantSettingsComponent implements OnInit {
  loading = false;
  saving = false;
  saveSuccess = false;
  submitted = false;
  private restaurantId = '';

  store = {
    name: '',
    phone: '',
    email: '',
    description: '',
    cuisineType: '',
    address: ''
  };
  
  hours = DAY_NAMES.map((day, i) => ({
    day,
    dayIndex: i,
    open: true,
    start: '11:00',
    end: '22:00'
  }));
  
  delivery = {
    minOrder: 0,
    fee: 0,
    estimatedTime: 30,
    radius: 5
  };
  
  notifications = {
    newOrders: true,
    lowStock: true,
    reviews: true,
    emailReports: false
  };

  constructor(private restaurantService: RestaurantService, private router: Router) {}

  goBack(): void { this.router.navigate(['/restaurant/dashboard']); }

  ngOnInit(): void {
    this.loading = true;
    this.restaurantService.getRestaurants().subscribe(restaurants => {
      if (restaurants.length > 0) {
        this.restaurantId = restaurants[0].id;
        this.restaurantService.getRestaurant(this.restaurantId).subscribe(r => {
          this.loading = false;
          if (r) {
            this.store = {
              name: r.name,
              phone: r.phoneNumber || '',
              email: r.email || '',
              description: r.description || '',
              cuisineType: r.cuisineType,
              address: r.address ? `${r.address.street}, ${r.address.city}` : ''
            };
            this.delivery = {
              minOrder: r.minimumOrderAmount || 0,
              fee: r.deliveryFee || 0,
              estimatedTime: r.estimatedDeliveryMinutes || 30,
              radius: 5
            };
            if (r.openingHours && r.openingHours.length > 0) {
              this.hours = DAY_NAMES.map((day, i) => {
                const h = r.openingHours.find(oh => oh.day === i);
                return {
                  day,
                  dayIndex: i,
                  open: h ? !h.isClosed : true,
                  start: h ? h.openTime.substring(0, 5) : '11:00',
                  end: h ? h.closeTime.substring(0, 5) : '22:00'
                };
              });
            }
          }
        });
      } else {
        this.loading = false;
      }
    });
  }

  saveSettings(): void {
    this.submitted = true;
    if (!this.store.name.trim() || !this.store.phone.trim()) return;
    if (!this.restaurantId) return;
    this.saving = true;
    this.saveSuccess = false;

    this.restaurantService.updateRestaurant(this.restaurantId, {
      name: this.store.name,
      description: this.store.description,
      cuisineType: this.store.cuisineType,
      phoneNumber: this.store.phone,
      email: this.store.email,
      minimumOrderAmount: this.delivery.minOrder,
      deliveryFee: this.delivery.fee,
      estimatedDeliveryMinutes: this.delivery.estimatedTime
    }).subscribe({
      next: () => {
        // Also save opening hours
        const hoursPayload = this.hours.map(h => ({
          day: h.dayIndex,
          openTime: h.start + ':00',
          closeTime: h.end + ':00',
          isClosed: !h.open
        }));
        this.restaurantService.setOpeningHours(this.restaurantId, hoursPayload).subscribe({
          next: () => { this.saving = false; this.saveSuccess = true; setTimeout(() => this.saveSuccess = false, 3000); },
          error: () => { this.saving = false; this.saveSuccess = true; setTimeout(() => this.saveSuccess = false, 3000); }
        });
      },
      error: () => { this.saving = false; alert('Failed to save settings'); }
    });
  }
}
