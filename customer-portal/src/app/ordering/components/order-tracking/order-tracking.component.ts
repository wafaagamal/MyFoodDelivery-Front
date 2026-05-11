import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import * as L from 'leaflet';
import { OrderingService } from '../../services/ordering.service';
import { TrackingService } from '../../../tracking/services/tracking.service';
import { Order, OrderTracking, RiderTracking } from '../../models/ordering.models';
import { ToastService } from '../../../shared/services/toast.service';

// Default map centre: Cairo, Egypt
const DEFAULT_LAT = 30.0550;
const DEFAULT_LNG = 31.2345;
const DEFAULT_ZOOM = 12;

function validCoord(lat: number | null | undefined, lng: number | null | undefined): boolean {
  return lat != null && lng != null && (lat !== 0 || lng !== 0);
}

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss']
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private map!: L.Map;
  private riderMarker?: L.Marker;
  private restaurantMarker?: L.Marker;
  private deliveryMarker?: L.Marker;

  orderId!: string;
  tracking: OrderTracking | null = null;
  order: Order | null = null;

  /** @deprecated Kept for template compatibility – replaced by ToastService */
  showSuccessBanner = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderingService: OrderingService,
    private trackingService: TrackingService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.params['id'];
    this.showSuccessBanner = this.route.snapshot.queryParams['success'] === '1';

    if (this.showSuccessBanner) {
      this.toast.success('Order placed successfully! We are processing your order.');
      setTimeout(() => { this.showSuccessBanner = false; }, 4000);
    }

    this.loadOrder();
    this.loadTracking();
    this.setupRealtimeTracking();

    interval(10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTracking());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  private loadOrder(): void {
    this.orderingService.getOrder(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(order => {
        this.order = order;
      });
  }

  private loadTracking(): void {
    this.orderingService.getOrderTracking(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tracking => {
          this.tracking = tracking;
          // Force DOM update so *ngIf="tracking" renders #tracking-map
          this.cdr.detectChanges();
          if (!this.map) {
            this.initMap();
          }
          this.updateMap();
        },
        error: () => { /* leave spinner */ }
      });
  }

  private setupRealtimeTracking(): void {
    this.trackingService.subscribeToOrder(this.orderId);

    this.trackingService.riderLocation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(location => {
        if (location && this.tracking?.rider && this.map) {
          this.tracking.rider.latitude = location.latitude;
          this.tracking.rider.longitude = location.longitude;
          this.updateRiderMarker(location.latitude, location.longitude);
        }
      });

    this.trackingService.orderStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTracking());
  }

  private initMap(): void {
    const el = document.getElementById('tracking-map');
    if (!el) return;
    try {
      // Centre on delivery address coords if valid, otherwise fall back to NYC
      const lat = this.tracking?.deliveryLocation?.latitude;
      const lng = this.tracking?.deliveryLocation?.longitude;
      const centre: [number, number] =
        (validCoord(lat, lng))
          ? [lat!, lng!]
          : [DEFAULT_LAT, DEFAULT_LNG];

      this.map = L.map('tracking-map').setView(centre, DEFAULT_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.map);
    } catch {
      /* ignore – will retry on next poll */
    }
  }

  private updateMap(): void {
    if (!this.map || !this.tracking) return;

    const validPoints: L.LatLng[] = [];

    // Restaurant marker
    const rl = this.tracking.restaurantLocation;
    if (rl && validCoord(rl.latitude, rl.longitude)) {
      if (!this.restaurantMarker) {
        this.restaurantMarker = L.marker([rl.latitude, rl.longitude], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#ff5722;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,.4);">🍽</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          })
        }).bindPopup(rl.label ?? 'Restaurant').addTo(this.map);
      }
      validPoints.push(L.latLng(rl.latitude, rl.longitude));
    }

    // Delivery marker
    const dl = this.tracking.deliveryLocation;
    if (dl && validCoord(dl.latitude, dl.longitude)) {
      if (!this.deliveryMarker) {
        this.deliveryMarker = L.marker([dl.latitude, dl.longitude], {
          icon: L.divIcon({
            className: '',
            html: '<div style="background:#4caf50;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,.4);">📍</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          })
        }).bindPopup(dl.label ?? 'Delivery Location').addTo(this.map);
      }
      validPoints.push(L.latLng(dl.latitude, dl.longitude));
    }

    // Rider marker
    const rider = this.tracking.rider;
    if (rider && validCoord(rider.latitude, rider.longitude)) {
      this.updateRiderMarker(rider.latitude, rider.longitude);
      validPoints.push(L.latLng(rider.latitude, rider.longitude));
    }

    if (validPoints.length > 1) {
      this.map.fitBounds(L.latLngBounds(validPoints), { padding: [50, 50] });
    } else if (validPoints.length === 1) {
      this.map.setView(validPoints[0], DEFAULT_ZOOM);
    }
    // else: map stays at default city view
  }

  private updateRiderMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (!this.riderMarker) {
      this.riderMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="background:#1565c0;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);">🏍</div>',
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        })
      }).bindPopup('Rider').addTo(this.map);
    } else {
      this.riderMarker.setLatLng([lat, lng]);
    }
  }

  get canCancel(): boolean {
    return ['Pending', 'PaymentConfirmed'].includes(this.tracking?.status ?? '');
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'Preparing': 'preparing',
      'ReadyForPickup': 'preparing',
      'AwaitingPickup': 'preparing',
      'InTransit': 'in-transit',
      'Delivered': 'delivered',
      'Completed': 'delivered'
    };
    return classMap[status] ?? '';
  }

  getStatusText(status: string): string {
    const textMap: Record<string, string> = {
      'Pending': 'Order Confirmed',
      'PaymentConfirmed': 'Payment Confirmed',
      'Preparing': 'Preparing',
      'ReadyForPickup': 'Ready for Pickup',
      'AwaitingPickup': 'Waiting for Rider',
      'InTransit': 'On the Way',
      'Delivered': 'Delivered',
      'Completed': 'Completed',
      'Cancelled': 'Cancelled'
    };
    return textMap[status] ?? status;
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  openChat(): void {
    this.toast.warning('Live chat coming soon!');
  }

  cancelOrder(): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.orderingService.cancelOrder(this.orderId, 'Customer requested cancellation')
        .subscribe({
          next: () => {
            this.toast.success('Order cancelled successfully.');
            this.loadTracking();
          },
          error: (err) => this.toast.error(err?.error?.message || 'Cannot cancel this order.')
        });
    }
  }
}
