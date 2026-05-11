import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, JwtPayload } from '../../auth/services/auth.service';

@Component({
  selector: 'app-delivery-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './delivery-layout.component.html',
  styleUrls: ['./delivery-layout.component.scss']
})
export class DeliveryLayoutComponent implements OnInit {
  isOnline = true;
  menuOpen = false;
  todayDeliveries = 8;
  todayEarnings = 127.50;
  rating = 4.9;
  activeDelivery = true;
  riderName = 'John Smith';
  riderId = 'RD-12345';
  riderPhoto = 'https://via.placeholder.com/60';
  currentUser: JwtPayload | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser?.firstName) {
      this.riderName = this.currentUser.firstName + (this.currentUser.lastName ? ' ' + this.currentUser.lastName : '');
    }
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
