import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DriverProfile, VehicleInfo, RiderDocument } from '../../models/delivery.models';

@Component({
  selector: 'app-delivery-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class DeliveryProfileComponent implements OnInit {
  profile: DriverProfile = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
    rating: 0,
    totalReviews: 0,
    totalDeliveries: 0,
    monthsActive: 0,
    acceptanceRate: 0,
    completionRate: 0,
    badges: [],
    joinedDate: new Date()
  };

  vehicle: VehicleInfo = {
    type: '',
    make: '',
    model: '',
    year: 0,
    color: '',
    licensePlate: '',
    insuranceExpiry: new Date()
  };

  documents: RiderDocument[] = [];

  settings = {
    notifications: true,
    sounds: true,
    navigationApp: 'Google Maps'
  };

  navigationApps = ['Google Maps', 'Apple Maps', 'Waze', 'Here Maps'];

  // Modal states
  showEditProfileModal = false;
  showVehicleModal = false;
  showDocumentsModal = false;
  showNavigationModal = false;
  showHelpModal = false;
  showAboutModal = false;

  // Edit forms
  editForm = {
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  };

  vehicleForm = {
    type: '',
    make: '',
    model: '',
    year: 0,
    color: '',
    licensePlate: ''
  };

  isSaving = false;
  profileSubmitted = false;
  vehicleSubmitted = false;

  constructor(
    private deliveryService: DeliveryService,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const jwtUser = this.authService.getCurrentUser();
    const displayName = this.authService.getDisplayName();
    const [jwtFirst = '', jwtLast = ''] = displayName.split(' ');

    this.deliveryService.getMyRider().subscribe({
      next: rider => {
        if (rider) {
          this.profile = {
            id: rider.id,
            firstName: jwtUser?.given_name || jwtUser?.firstName || jwtFirst || '',
            lastName: jwtUser?.family_name || jwtUser?.lastName || jwtLast || '',
            email: jwtUser?.email || '',
            phone: '',
            avatar: '',
            rating: rider.averageRating || 0,
            totalReviews: rider.ratingCount || 0,
            totalDeliveries: rider.totalDeliveries || 0,
            monthsActive: 0,
            acceptanceRate: 0,
            completionRate: 0,
            badges: [],
            joinedDate: new Date()
          };
          this.vehicle = {
            type: rider.vehicleType || '',
            make: '',
            model: '',
            year: 0,
            color: '',
            licensePlate: rider.vehiclePlate || '',
            insuranceExpiry: new Date()
          };
          this.editForm = {
            firstName: this.profile.firstName,
            lastName: this.profile.lastName,
            phone: this.profile.phone,
            email: this.profile.email
          };
          this.vehicleForm = { ...this.vehicle };
        } else {
          this.toast.error('Failed to load rider profile.');
        }
      },
      error: () => this.toast.error('Failed to load rider profile.')
    });

    const user = this.authService.getCurrentUser();
    if (user?.sub) {
      this.deliveryService.getSettings(user.sub).subscribe({
        next: s => {
          this.settings.notifications = s.pushNotifications;
          this.settings.sounds = s.soundAlerts;
          this.settings.navigationApp = s.navigationApp || 'Google Maps';
        },
        error: () => {}
      });
    }
  }

  get fullName(): string {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }

  getInitials(): string {
    return `${this.profile.firstName[0] || ''}${this.profile.lastName[0] || ''}`.toUpperCase();
  }

  getMemberSince(): string {
    return this.profile.joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  getDocumentStatusClass(status: string): string {
    return status;
  }

  isDocumentExpiringSoon(doc: RiderDocument): boolean {
    if (!doc.expiryDate) return false;
    const daysUntilExpiry = Math.ceil((doc.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }

  // Edit Profile
  editProfile(): void {
    this.editForm = {
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      phone: this.profile.phone,
      email: this.profile.email
    };
    this.showEditProfileModal = true;
  }

  saveProfile(): void {
    this.profileSubmitted = true;
    if (!this.editForm.firstName.trim() || !this.editForm.lastName.trim() || !this.editForm.phone.trim()) return;
    if (!this.profile.id) return;
    this.isSaving = true;
    this.deliveryService.updateProfile(this.profile.id, {
      firstName: this.editForm.firstName,
      lastName: this.editForm.lastName,
      phoneNumber: this.editForm.phone
    }).subscribe({
      next: () => {
        this.profile.firstName = this.editForm.firstName;
        this.profile.lastName = this.editForm.lastName;
        this.profile.phone = this.editForm.phone;
        this.isSaving = false;
        this.showEditProfileModal = false;
        this.toast.success('Profile updated successfully.');
      },
      error: () => {
        this.isSaving = false;
        this.toast.error('Failed to update profile.');
      }
    });
  }

  // Vehicle Management
  manageVehicle(): void {
    this.vehicleForm = { ...this.vehicle };
    this.showVehicleModal = true;
  }

  saveVehicle(): void {
    this.vehicleSubmitted = true;
    if (!this.vehicleForm.licensePlate.trim()) return;
    if (!this.profile.id) return;
    this.isSaving = true;
    this.deliveryService.updateProfile(this.profile.id, {
      vehicleType: this.vehicleForm.type,
      vehiclePlate: this.vehicleForm.licensePlate
    }).subscribe({
      next: () => {
        this.vehicle = { ...this.vehicle, ...this.vehicleForm };
        this.isSaving = false;
        this.showVehicleModal = false;
        this.toast.success('Vehicle details updated.');
      },
      error: () => {
        this.isSaving = false;
        this.toast.error('Failed to update vehicle details.');
      }
    });
  }

  // Documents
  manageDocuments(): void {
    this.showDocumentsModal = true;
  }

  uploadDocument(type: string): void {
    this.toast.warning('Document upload is not available yet. Please contact support.');
  }

  // Navigation App
  openNavigationSelector(): void {
    this.showNavigationModal = true;
  }

  selectNavigationApp(app: string): void {
    this.settings.navigationApp = app;
    this.showNavigationModal = false;
    this.persistSettings();
  }

  // Help & Support
  openHelp(): void {
    this.showHelpModal = true;
  }

  // About
  openAbout(): void {
    this.showAboutModal = true;
  }

  // Close modals
  closeModals(): void {
    this.showEditProfileModal = false;
    this.showVehicleModal = false;
    this.showDocumentsModal = false;
    this.showNavigationModal = false;
    this.showHelpModal = false;
    this.showAboutModal = false;
  }

  // Logout
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Settings toggles

  toggleNotifications(): void {
    this.settings.notifications = !this.settings.notifications;
    this.persistSettings();
  }

  toggleSounds(): void {
    this.settings.sounds = !this.settings.sounds;
    this.persistSettings();
  }

  private persistSettings(): void {
    if (!this.profile.id) return;
    this.deliveryService.updateSettings(this.profile.id, {
      pushNotifications: this.settings.notifications,
      emailNotifications: this.settings.notifications,
      soundAlerts: this.settings.sounds,
      navigationApp: this.settings.navigationApp
    }).subscribe({
      error: () => this.toast.error('Failed to save settings.')
    });
  }
}
