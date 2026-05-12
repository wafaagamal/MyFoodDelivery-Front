import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';

interface DailyRevenue { label: string; value: number; }
interface TopItem { name: string; category: string; orders: number; revenue: number; percentage: number; image: string; }

@Component({
  selector: 'app-restaurant-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class RestaurantAnalyticsComponent implements OnInit {
  activeRange = 'week';
  loading = false;
  
  dateRanges = [
    { label: 'Today', value: 'today' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
  ];
  
  totalRevenue = 0;
  totalOrders = 0;
  avgOrderValue = 0;
  customerRating = 0;
  ratingBars: number[] = [0, 0, 0, 0, 0];
  
  weeklyRevenue: DailyRevenue[] = [];
  topItems: TopItem[] = [];

  private restaurantId = '';

  constructor(private restaurantService: RestaurantService, private router: Router) {}

  goBack(): void { this.router.navigate(['/restaurant/dashboard']); }

  ngOnInit(): void {
    this.restaurantService.getRestaurants().subscribe(restaurants => {
      if (restaurants.length > 0) {
        this.restaurantId = restaurants[0].id;
        this.loadAnalytics();
      }
    });
  }

  loadAnalytics(): void {
    this.loading = true;

    // Load restaurant rating info
    this.restaurantService.getRestaurant(this.restaurantId).subscribe(r => {
      if (r) {
        this.customerRating = r.averageRating;
        // totalRatings available; distribution not available from API so hide bars
        this.ratingBars = [0, 0, 0, 0, 0];
      }
    });

    // Compute revenue/orders from order history
    const { from, to } = this.getDateRange();
    this.restaurantService.getRestaurantOrders(this.restaurantId, undefined, 0, 500).subscribe(result => {
      this.loading = false;
      const orders = result.items.filter(o => {
        const d = new Date(o.creationTime);
        return d >= from && d <= to;
      });

      // Exclude cancelled (8)
      const validOrders = orders.filter(o => o.status !== 8);
      this.totalOrders = validOrders.length;
      this.totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
      this.avgOrderValue = this.totalOrders > 0 ? this.totalRevenue / this.totalOrders : 0;

      this.buildRevenueChart(validOrders, from, to);
    });

    // Top items from menu (sold count not available without analytics endpoint)
    this.restaurantService.getCategoriesWithItems(this.restaurantId).subscribe(cats => {
      const allItems = cats.flatMap(c => c.items.map(i => ({ ...i, categoryName: c.name })));
      this.topItems = allItems.slice(0, 5).map((item, idx) => ({
        name: item.name,
        category: (item as any).categoryName || '',
        orders: 0,
        revenue: 0,
        percentage: 0,
        image: item.imageUrl || ''
      }));
    });
  }

  private buildRevenueChart(orders: any[], from: Date, to: Date): void {
    const days = this.activeRange === 'today' ? 24 :
                 this.activeRange === 'week' ? 7 :
                 this.activeRange === 'month' ? 30 : 12;
    
    const labels = this.getChartLabels(from, to);
    const buckets: { [key: string]: number } = {};
    labels.forEach(l => buckets[l] = 0);

    orders.forEach(o => {
      const d = new Date(o.creationTime);
      const key = this.getBucketKey(d);
      if (buckets[key] !== undefined) buckets[key] += o.total;
    });

    this.weeklyRevenue = labels.map(l => ({ label: l, value: buckets[l] || 0 }));
  }

  private getDateRange(): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();
    if (this.activeRange === 'today') {
      from.setHours(0, 0, 0, 0);
    } else if (this.activeRange === 'week') {
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
    } else if (this.activeRange === 'month') {
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
    } else {
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
    }
    return { from, to };
  }

  private getChartLabels(from: Date, to: Date): string[] {
    if (this.activeRange === 'today') {
      return Array.from({ length: 24 }, (_, i) => `${i}h`);
    } else if (this.activeRange === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        return days[d.getDay()];
      });
    } else if (this.activeRange === 'month') {
      return Array.from({ length: 30 }, (_, i) => `${i + 1}`);
    } else {
      return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    }
  }

  private getBucketKey(d: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (this.activeRange === 'today') return `${d.getHours()}h`;
    if (this.activeRange === 'week') return days[d.getDay()];
    if (this.activeRange === 'month') return `${d.getDate()}`;
    return months[d.getMonth()];
  }

  get maxRevenue(): number {
    return Math.max(...this.weeklyRevenue.map(d => d.value), 1);
  }

  onRangeChange(range: string): void {
    this.activeRange = range;
    if (this.restaurantId) this.loadAnalytics();
  }
}
