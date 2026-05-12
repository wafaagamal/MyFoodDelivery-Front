import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';
import { DeliveryService } from '../../delivery/services/delivery.service';

@Component({
  selector: 'app-delivery-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './delivery-layout.component.html',
  styleUrls: ['./delivery-layout.component.scss']
})
export class DeliveryLayoutComponent implements OnInit {
  isOnline = false;
  menuOpen = false;
  todayDeliveries = 0;
  todayEarnings = 0;
  rating = 0;
  activeDelivery = false;
  riderName = '';
  riderId = '';
  private rawRiderId = '';
  riderPhoto = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='20' r='12' fill='%23fff'/%3E%3Cellipse cx='30' cy='50' rx='20' ry='12' fill='%23fff'/%3E%3C/svg%3E`;

  constructor(
    private authService: AuthService,
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.riderName = this.authService.getDisplayName();
    this.deliveryService.getMyRider().subscribe(rider => {
      if (rider) {
        this.rawRiderId = rider.id;
        this.riderId = 'RD-' + rider.id.replace(/-/g, '').substring(0, 8).toUpperCase();
        this.isOnline = rider.isOnline;
        this.todayDeliveries = rider.totalDeliveries;
        this.todayEarnings = rider.totalEarnings;
        this.rating = rider.averageRating;
      }
    });
  }

  toggleOnlineStatus(): void {
    const newStatus = !this.isOnline;
    if (this.rawRiderId) {
      this.deliveryService.updateStatus(this.rawRiderId, newStatus).subscribe({
        next: () => { this.isOnline = newStatus; },
        error: () => {} // keep current state on error
      });
    } else {
      this.isOnline = newStatus;
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
