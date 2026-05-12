import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';

interface Review {
  id: string;
  customer: string;
  date: string;
  rating: number;
  text: string;
  orderItems: string[];
  reply: string | null;
}

@Component({
  selector: 'app-restaurant-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss']
})
export class RestaurantReviewsComponent implements OnInit {
  averageRating = 0;
  totalReviews = 0;
  activeFilter = 'all';
  loading = false;
  replyingTo: string | null = null;
  replyText = '';
  
  ratingBars: { stars: number; count: number; percentage: number }[] = [
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ];
  
  filters = [
    { label: 'All', value: 'all' },
    { label: '5 Stars', value: '5' },
    { label: '4 Stars', value: '4' },
    { label: 'Needs Reply', value: 'noreply' },
  ];
  
  reviews: Review[] = [];

  private restaurantId = '';

  constructor(private restaurantService: RestaurantService, private router: Router) {}

  goBack(): void { this.router.navigate(['/restaurant/dashboard']); }

  ngOnInit(): void {
    this.restaurantService.getRestaurants().subscribe(restaurants => {
      if (restaurants.length > 0) {
        this.restaurantId = restaurants[0].id;
        this.loadReviews();
      }
    });
  }

  loadReviews(): void {
    this.loading = true;
    // Load rating summary from restaurant data
    this.restaurantService.getRestaurant(this.restaurantId).subscribe(r => {
      this.loading = false;
      if (r) {
        this.averageRating = r.averageRating;
        this.totalReviews = r.totalRatings;
      }
      // Reviews list endpoint not available — show empty state
      this.reviews = [];
    });
  }
  
  get filteredReviews(): Review[] {
    if (this.activeFilter === 'all') return this.reviews;
    if (this.activeFilter === 'noreply') return this.reviews.filter(r => !r.reply);
    return this.reviews.filter(r => r.rating === parseInt(this.activeFilter));
  }
  
  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
  
  startReply(review: Review): void {
    this.replyingTo = review.id;
    this.replyText = review.reply || '';
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.replyText = '';
  }

  submitReply(review: Review): void {
    if (!this.replyText.trim()) return;
    // No reply API endpoint available — update locally
    review.reply = this.replyText;
    this.replyingTo = null;
    this.replyText = '';
  }
}
