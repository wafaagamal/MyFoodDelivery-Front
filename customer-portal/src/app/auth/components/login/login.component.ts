import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  selectedRole: UserRole = UserRole.Customer;
  isLoading = false;
  error = '';
  showPassword = false;

  roles = [
    { value: UserRole.Customer, label: 'Customer', icon: 'fas fa-user' },
    { value: UserRole.Restaurant, label: 'Restaurant', icon: 'fas fa-store' },
    { value: UserRole.Delivery, label: 'Delivery', icon: 'fas fa-motorcycle' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // Read role from query params to pre-select
    this.route.queryParams.subscribe(params => {
      const role = params['role']?.toLowerCase();
      if (role === 'customer') {
        this.selectedRole = UserRole.Customer;
      } else if (role === 'restaurant') {
        this.selectedRole = UserRole.Restaurant;
      } else if (role === 'delivery') {
        this.selectedRole = UserRole.Delivery;
      }
    });
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.login(this.email, this.password, this.selectedRole).subscribe({
      next: () => {
        // Navigate to the appropriate portal based on role
        this.authService.navigateToRolePortal();
      },
      error: (err: Error) => {
        this.error = 'Invalid email or password';
        this.isLoading = false;
      }
    });
  }

}
