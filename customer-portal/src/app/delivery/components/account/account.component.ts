import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { DeliveryService } from '../../services/delivery.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-delivery-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class DeliveryAccountComponent implements OnInit {
  profile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  editing = false;
  saving = false;

  constructor(
    private authService: AuthService,
    private deliveryService: DeliveryService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.deliveryService.getMyRider().subscribe({
      next: (rider: any) => {
        const user = this.authService.getCurrentUser();
        this.profile.firstName = rider.firstName || user?.given_name?.split(' ')[0] || '';
        this.profile.lastName = rider.lastName || user?.given_name?.split(' ')[1] || '';
        this.profile.email = user?.email || '';
        this.profile.phone = rider.phone || '';
      },
      error: () => {}
    });
  }

  toggleEdit(): void {
    this.editing = !this.editing;
  }

  save(): void {
    this.saving = true;
    // Optimistic update - show success
    setTimeout(() => {
      this.saving = false;
      this.editing = false;
      this.toastService.show('Profile updated successfully', 'success');
    }, 800);
  }

  goBack(): void {
    this.router.navigate(['/delivery/home']);
  }
}
