import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { CustomerService } from '../../services/customer.service';
import { CustomerProfile } from '../../models/customer.models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile: CustomerProfile | null = null;
  isLoading = false;

  profileForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private customerService: CustomerService,
    private toast: ToastService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Personal info (name, email) comes from JWT claims; loyalty/order stats from CustomerSvc
    this.customerService.getProfile().subscribe({
      next: (apiProfile) => {
        this.profile = {
          ...apiProfile,
          firstName: user.given_name || user.firstName || '',
          lastName: user.family_name || user.lastName || '',
          email: user.email,
          phoneNumber: apiProfile.phoneNumber ?? null,
          profileImageUrl: apiProfile.profileImageUrl ?? null
        };

        this.profileForm.patchValue({
          firstName: this.profile.firstName,
          lastName: this.profile.lastName,
          phoneNumber: this.profile.phoneNumber ?? ''
        });
      },
      error: () => {
        // Fallback to JWT-only if CustomerSvc is unavailable
        this.profile = {
          id: user.sub,
          firstName: user.given_name || user.firstName || '',
          lastName: user.family_name || user.lastName || '',
          email: user.email,
          phoneNumber: null,
          profileImageUrl: null,
          loyaltyPoints: 0,
          loyaltyTier: 'Bronze' as any,
          isActive: true,
          createdAt: new Date(),
          lastOrderDate: null,
          totalOrders: 0
        };

        this.profileForm.patchValue({
          firstName: this.profile.firstName,
          lastName: this.profile.lastName,
          phoneNumber: ''
        });
      }
    });
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.maxLength(100)]],
      phoneNumber: ['', [ProfileComponent.egyptianPhoneValidator]],
      profileImageUrl: ['']
    });
  }

  /** Accepts +201XXXXXXXX, 01XXXXXXXX, or 1XXXXXXXX (Vodafone/Orange/Etisalat/WE) */
  static egyptianPhoneValidator(control: AbstractControl): ValidationErrors | null {
    const value: string = (control.value ?? '').trim();
    if (!value) return null; // optional field — empty is fine
    const clean = value.replace(/^(\+?20|0)/, '');
    return /^1[0125][0-9]{8}$/.test(clean) ? null : { egyptianPhone: true };
  }

  getInitials(profile: CustomerProfile): string {
    const first = profile.firstName?.[0] ?? '';
    const second = profile.lastName?.[0] ?? profile.firstName?.[1] ?? '';
    return `${first}${second}`.toUpperCase();
  }

  getMemberSince(profile: CustomerProfile): string {
    const date = new Date(profile.createdAt);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.profile) return;

    this.isLoading = true;

    this.customerService.updateProfile({
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      phoneNumber: this.profileForm.value.phoneNumber || null,
      profileImageUrl: this.profileForm.value.profileImageUrl || null
    }).subscribe({
      next: () => {
        this.profile = {
          ...this.profile!,
          firstName: this.profileForm.value.firstName,
          lastName: this.profileForm.value.lastName,
          phoneNumber: this.profileForm.value.phoneNumber || null
        };
        this.isLoading = false;
        this.profileForm.markAsPristine();
        this.toast.success('Profile updated successfully.');
      },
      error: (err) => {
        this.isLoading = false;
        this.toast.error(err?.error?.message ?? 'Failed to save profile. Please try again.');
      }
    });
  }

  resetForm(): void {
    if (this.profile) {
      this.profileForm.patchValue({
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        phoneNumber: this.profile.phoneNumber ?? ''
      });
      this.profileForm.markAsPristine();
    }
  }
}
