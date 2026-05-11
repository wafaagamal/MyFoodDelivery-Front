import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { OrderingService } from '../../services/ordering.service';
import { Restaurant } from '../../models/ordering.models';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.scss']
})
export class RestaurantListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  restaurants: Restaurant[] = [];
  isLoading = false;
  hasMore = true;
  showLocationPicker = false;
  
  searchTerm = '';
  selectedCuisine: string | null = null;
  openNow = false;
  currentLocation = 'Current Location';
  
  cuisines = ['Pizza', 'Burgers', 'Sushi', 'Chinese', 'Indian', 'Mexican', 'Italian', 'Thai'];

  readonly presetCities = [
    { name: 'Dubai', lat: 25.276987, lng: 55.296249 },
    { name: 'Abu Dhabi', lat: 24.453884, lng: 54.377343 },
    { name: 'Riyadh', lat: 24.774265, lng: 46.738586 },
    { name: 'Jeddah', lat: 21.485811, lng: 39.192505 },
    { name: 'Cairo', lat: 30.044420, lng: 31.235712 },
  ];
  
  private skip = 0;
  private take = 10;
  private userLat?: number;
  private userLng?: number;

  constructor(private orderingService: OrderingService) {}

  ngOnInit(): void {
    this.getCurrentLocation();
    this.loadRestaurants();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.resetAndLoad();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLat = pos.coords.latitude;
          this.userLng = pos.coords.longitude;
          this.currentLocation = 'Near You';
          this.loadRestaurants();
        },
        () => {
          this.userLat = 25.276987;
          this.userLng = 55.296249;
          this.currentLocation = 'Dubai';
        }
      );
    }
  }

  private loadRestaurants(): void {
    this.isLoading = true;

    this.orderingService.searchRestaurants({
      search: this.searchTerm || undefined,
      cuisine: this.selectedCuisine || undefined,
      lat: this.userLat,
      lng: this.userLng,
      openNow: this.openNow || undefined,
      skip: this.skip,
      take: this.take
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (this.skip === 0) {
            this.restaurants = result.items;
          } else {
            this.restaurants = [...this.restaurants, ...result.items];
          }
          this.hasMore = this.restaurants.length < result.totalCount;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private resetAndLoad(): void {
    this.skip = 0;
    this.loadRestaurants();
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  filterByCuisine(cuisine: string | null): void {
    this.selectedCuisine = cuisine;
    this.resetAndLoad();
  }

  toggleOpenNow(): void {
    this.openNow = !this.openNow;
    this.resetAndLoad();
  }

  showSortOptions(): void {
    // Would show sort modal
  }

  showFilters(): void {
    // Would show filters modal
  }

  changeLocation(): void {
    this.showLocationPicker = !this.showLocationPicker;
  }

  selectCity(city: { name: string; lat: number; lng: number }): void {
    this.currentLocation = city.name;
    this.userLat = city.lat;
    this.userLng = city.lng;
    this.showLocationPicker = false;
    this.resetAndLoad();
  }

  useCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLat = pos.coords.latitude;
          this.userLng = pos.coords.longitude;
          this.currentLocation = 'Near You';
          this.showLocationPicker = false;
          this.resetAndLoad();
        },
        () => { this.showLocationPicker = false; }
      );
    }
  }

  loadMore(): void {
    this.skip += this.take;
    this.loadRestaurants();
  }
}
