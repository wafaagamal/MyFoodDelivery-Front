import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { TrackingService, TrackingUpdate } from '../../services/tracking.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss']
})
export class TrackingComponent implements OnInit, OnDestroy {
  @Input() orderId!: string;
  @Input() deliveryLatitude!: number;
  @Input() deliveryLongitude!: number;

  private map!: L.Map;
  private riderMarker?: L.Marker;
  private deliveryMarker?: L.Marker;
  private routeLine?: L.Polyline;
  private subscription?: Subscription;

  status = 'Preparing';
  estimatedMinutes: number | null = null;
  riderInfo: {
    riderId: string;
    riderName: string;
    riderPhone: string;
  } | null = null;

  timestamps: {
    confirmed?: Date;
    preparing?: Date;
    pickedUp?: Date;
    delivered?: Date;
  } = {};

  private statusOrder = ['confirmed', 'preparing', 'pickedUp', 'delivered'];

  constructor(private trackingService: TrackingService) {}

  ngOnInit(): void {
    this.initMap();
    this.subscribeToTracking();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.trackingService.unsubscribeFromOrder(this.orderId);
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map('tracking-map').setView(
      [this.deliveryLatitude, this.deliveryLongitude],
      15
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add delivery location marker
    const deliveryIcon = L.divIcon({
      html: '📍',
      iconSize: [30, 30],
      className: 'delivery-marker'
    });

    this.deliveryMarker = L.marker(
      [this.deliveryLatitude, this.deliveryLongitude],
      { icon: deliveryIcon }
    ).addTo(this.map);

    this.deliveryMarker.bindPopup('Delivery Location');
  }

  private subscribeToTracking(): void {
    this.trackingService.subscribeToOrder(this.orderId);

    this.subscription = this.trackingService.riderLocation$.subscribe(
      (update: TrackingUpdate | null) => {
        if (update && update.orderId === this.orderId) {
          this.updateRiderPosition(update.latitude, update.longitude);
          if (update.estimatedArrivalMinutes) {
            this.estimatedMinutes = update.estimatedArrivalMinutes;
          }
        }
      }
    );

    this.trackingService.riderAssigned$.subscribe((info) => {
      if (info && info.orderId === this.orderId) {
        this.riderInfo = {
          riderId: info.riderId,
          riderName: info.riderName,
          riderPhone: info.riderPhone
        };
        this.estimatedMinutes = info.estimatedArrivalMinutes;
        this.updateRiderPosition(info.riderLatitude, info.riderLongitude);
      }
    });

    this.trackingService.orderStatus$.subscribe((statusUpdate) => {
      if (statusUpdate && statusUpdate.orderId === this.orderId) {
        this.status = statusUpdate.status;
        this.updateTimestamp(statusUpdate.status);
      }
    });
  }

  private updateRiderPosition(lat: number, lng: number): void {
    const riderIcon = L.divIcon({
      html: '🏍️',
      iconSize: [30, 30],
      className: 'rider-marker'
    });

    if (this.riderMarker) {
      this.riderMarker.setLatLng([lat, lng]);
    } else {
      this.riderMarker = L.marker([lat, lng], { icon: riderIcon }).addTo(this.map);
      this.riderMarker.bindPopup('Your Rider');
    }

    // Update route line
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    this.routeLine = L.polyline(
      [
        [lat, lng],
        [this.deliveryLatitude, this.deliveryLongitude]
      ],
      { color: '#667eea', weight: 3, dashArray: '10, 10' }
    ).addTo(this.map);

    // Fit map to show both markers
    const bounds = L.latLngBounds(
      [lat, lng],
      [this.deliveryLatitude, this.deliveryLongitude]
    );
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  private updateTimestamp(status: string): void {
    const statusKey = status.toLowerCase().replace(/\s+/g, '') as keyof typeof this.timestamps;
    if (!this.timestamps[statusKey]) {
      this.timestamps[statusKey] = new Date();
    }
  }

  isStepActive(step: string): boolean {
    const currentIndex = this.statusOrder.indexOf(this.status.toLowerCase());
    const stepIndex = this.statusOrder.indexOf(step);
    return currentIndex === stepIndex;
  }

  isStepCompleted(step: string): boolean {
    const currentIndex = this.statusOrder.indexOf(this.status.toLowerCase());
    const stepIndex = this.statusOrder.indexOf(step);
    return currentIndex > stepIndex;
  }
}
