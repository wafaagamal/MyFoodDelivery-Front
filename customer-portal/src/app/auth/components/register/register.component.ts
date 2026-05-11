import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;
  isLoading = false;
  error = '';
  showPassword = false;
  showConfirmPassword = false;
  selectedRole: UserRole = UserRole.Customer;

  roles = [
    { value: UserRole.Customer, label: 'Customer', icon: 'fas fa-user', description: 'Order food from restaurants' },
    { value: UserRole.Restaurant, label: 'Restaurant Owner', icon: 'fas fa-store', description: 'Manage your restaurant' },
    { value: UserRole.Delivery, label: 'Delivery Partner', icon: 'fas fa-motorcycle', description: 'Deliver orders and earn' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Check for role parameter in URL (e.g., /register?role=restaurant)
    const roleParam = this.route.snapshot.queryParams['role'];
    if (roleParam) {
      const roleMap: { [key: string]: UserRole } = {
        'customer': UserRole.Customer,
        'restaurant': UserRole.Restaurant,
        'delivery': UserRole.Delivery
      };
      this.selectedRole = roleMap[roleParam.toLowerCase()] || UserRole.Customer;
    }
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
  }

  onSubmit(): void {
    if (!this.name || !this.email || !this.phone || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters';
      return;
    }

    const egyptianPhoneRegex = /^1[0125][0-9]{8}$/;
    if (!egyptianPhoneRegex.test(this.phone)) {
      this.error = 'Enter a valid Egyptian mobile number (e.g. 1012345678 — 10 digits starting with 10, 11, 12, or 15)';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.register({
      firstName: this.name.split(' ')[0] || this.name,
      lastName: this.name.split(' ').slice(1).join(' ') || '',
      email: this.email,
      phoneNumber: '+20' + this.phone,
      password: this.password,
      role: this.selectedRole
    }).subscribe({
      next: () => {
        // Auto-login after successful registration
        this.authService.login(this.email, this.password, this.selectedRole).subscribe({
          next: () => {
            this.authService.navigateToRolePortal();
          },
          error: () => {
            // Registration succeeded but login failed — redirect to login page
            this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
          }
        });
      },
      error: (err: any) => {
        const body = err.error;
        if (body?.errors && Array.isArray(body.errors) && body.errors.length > 0) {
          // Backend returns individual validation errors (e.g. password rules)
          this.error = body.errors.join(' ');
        } else if (err.status === 409) {
          this.error = 'An account with this email already exists. Try logging in instead.';
        } else {
          this.error = body?.message || 'Registration failed. Please try again.';
        }
        this.isLoading = false;
      }
    });
  }
}
