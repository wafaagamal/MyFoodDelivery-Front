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
  riderPhoto = 'https://via.placeholder.com/60';

  constructor(
    private authService: AuthService,
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.riderName = this.authService.getDisplayName();
    this.deliveryService.getMyRider().subscribe(rider => {
      if (rider) {
        this.riderId = 'RD-' + rider.id.replace(/-/g, '').substring(0, 8).toUpperCase();
        this.isOnline = rider.isOnline;
        this.todayDeliveries = rider.totalDeliveries;
        this.todayEarnings = rider.totalEarnings;
        this.rating = rider.averageRating;
      }
    });
  }

  toggleOnlineStatus(): void {
    this.isOnline = !this.isOnline;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
