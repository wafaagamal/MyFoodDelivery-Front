import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, JwtPayload } from '../../auth/services/auth.service';
import { RestaurantService } from '../../restaurant/services/restaurant.service';

@Component({
  selector: 'app-restaurant-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './restaurant-layout.component.html',
  styleUrls: ['./restaurant-layout.component.scss']
})
export class RestaurantLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  isOpen = false;
  pendingOrders = 0;
  notifications = 0;
  restaurantName = '';
  restaurantLogo = '';
  currentUser: JwtPayload | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private restaurantService: RestaurantService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadRestaurantInfo();
  }

  private loadRestaurantInfo(): void {
    this.restaurantService.getRestaurants().subscribe(restaurants => {
      if (restaurants.length > 0) {
        const r = restaurants[0];
        this.restaurantName = r.name;
        this.restaurantLogo = r.logoUrl || '';
        this.isOpen = r.isOpen;
        // Load pending orders count
        this.restaurantService.getRestaurantOrders(r.id, 0 /* Pending */, 0, 1).subscribe(result => {
          this.pendingOrders = result.totalCount;
        });
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleNotifications(): void {
    // Show notifications panel
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
