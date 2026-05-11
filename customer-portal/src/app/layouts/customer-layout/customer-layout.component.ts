import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, JwtPayload } from '../../auth/services/auth.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './customer-layout.component.html',
  styleUrls: ['./customer-layout.component.scss']
})
export class CustomerLayoutComponent implements OnInit {
  cartCount = 0;
  currentUser: JwtPayload | null = null;
  displayName = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.displayName = this.authService.getDisplayName();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
