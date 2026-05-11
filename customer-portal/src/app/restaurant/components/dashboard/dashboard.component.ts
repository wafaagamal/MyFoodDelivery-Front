import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RestaurantService, DashboardStats, RecentOrder, PopularItem } from '../../services/restaurant.service';

@Component({
  selector: 'app-restaurant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class RestaurantDashboardComponent implements OnInit {
  today = new Date();
  todayOrders = 0;
  todayRevenue = 0;
  pendingOrders = 0;
  averageRating = 0;
  totalReviews = 0;
  
  recentOrders: RecentOrder[] = [];
  popularItems: PopularItem[] = [];
  
  private restaurantId = '';

  constructor(private restaurantService: RestaurantService) {}

  ngOnInit(): void {
    this.loadRestaurantData();
  }

  private loadRestaurantData(): void {
    this.restaurantService.getRestaurants().subscribe(restaurants => {
      if (restaurants.length > 0) {
        this.restaurantId = restaurants[0].id;
        this.loadDashboardStats();
        this.loadPopularItems();
        this.loadRecentOrders();
      }
    });
  }

  private loadDashboardStats(): void {
    if (!this.restaurantId) return;
    
    this.restaurantService.getDashboardStats(this.restaurantId).subscribe(stats => {
      this.todayOrders = stats.todayOrders;
      this.todayRevenue = stats.todayRevenue;
      this.pendingOrders = stats.pendingOrders;
      this.averageRating = stats.averageRating;
      this.totalReviews = stats.totalReviews;
    });

    // Also get pending orders count from ordering service
    this.restaurantService.getRestaurantOrders(this.restaurantId, 0 /* Pending */, 0, 100).subscribe(result => {
      this.pendingOrders = result.totalCount;
    });
  }

  private loadPopularItems(): void {
    if (!this.restaurantId) return;
    
    this.restaurantService.getPopularItems(this.restaurantId).subscribe(items => {
      this.popularItems = items;
    });
  }

  private loadRecentOrders(): void {
    if (!this.restaurantId) return;

    this.restaurantService.getRestaurantOrders(this.restaurantId, undefined, 0, 5).subscribe(result => {
      this.recentOrders = result.items.map(o => ({
        id: o.orderNumber,
        customer: 'Customer',
        items: o.itemCount,
        total: o.total,
        status: this.orderStatusLabel(o.status),
        time: this.timeAgo(o.creationTime),
        createdAt: new Date(o.creationTime)
      }));
    });
  }

  private orderStatusLabel(status: number): string {
    const labels: { [key: number]: string } = {
      0: 'Pending', 1: 'Pending', 2: 'Preparing', 3: 'Ready',
      4: 'Ready', 5: 'Delivering', 6: 'Delivered', 7: 'Completed', 8: 'Cancelled'
    };
    return labels[status] || 'Unknown';
  }

  private timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
