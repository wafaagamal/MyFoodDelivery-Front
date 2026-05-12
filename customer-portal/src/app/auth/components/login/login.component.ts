import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';
import { LocalizationService } from '../../../shared/services/localization.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  selectedRole: UserRole = UserRole.Customer;
  isLoading = false;
  error = '';
  showPassword = false;

  // Localized strings
  i18n: Record<string, string> = {};

  roles = [
    { value: UserRole.Customer, label: 'Customer', icon: 'fas fa-user' },
    { value: UserRole.Restaurant, label: 'Restaurant', icon: 'fas fa-store' },
    { value: UserRole.Delivery, label: 'Delivery', icon: 'fas fa-motorcycle' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private localization: LocalizationService
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

  ngOnInit(): void {
    this.loadTranslations();
  }

  private loadTranslations(): void {
    this.localization.loadTranslations('en').subscribe(() => {
      const login = this.localization.get<Record<string, string>>('auth.login') ?? {};
      const roles = this.localization.get<Record<string, string>>('roles') ?? {};
      
      this.i18n = { ...login };
      
      // Update role labels from localization
      this.roles = [
        { value: UserRole.Customer, label: roles['customer'] ?? 'Customer', icon: 'fas fa-user' },
        { value: UserRole.Restaurant, label: roles['restaurant'] ?? 'Restaurant', icon: 'fas fa-store' },
        { value: UserRole.Delivery, label: roles['driver'] ?? 'Driver', icon: 'fas fa-motorcycle' }
      ];
    });
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = this.localization.get<string>('auth.errors.emailRequired') ?? 'Please enter email and password';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.login(this.email, this.password, this.selectedRole).subscribe({
      next: () => {
        const actualRole = this.authService.getUserRole();
        // Allow Admin to log in from any tab
        if (actualRole && actualRole !== UserRole.Admin && actualRole !== this.selectedRole) {
          this.authService.logout();
          const actualLabel = this.roles.find(r => r.value === actualRole)?.label ?? actualRole;
          this.error = `This account is registered as "${actualLabel}". Please select the correct login tab.`;
          this.isLoading = false;
          return;
        }
        this.authService.navigateToRolePortal();
      },
      error: (err: Error) => {
        this.error = this.localization.get<string>('auth.errors.invalidCredentials') ?? 'Invalid email or password';
        this.isLoading = false;
      }
    });
  }

}
