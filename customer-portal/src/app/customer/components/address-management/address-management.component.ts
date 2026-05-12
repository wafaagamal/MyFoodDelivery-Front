import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryAddress } from '../../models/customer.models';
import { CustomerService } from '../../services/customer.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-address-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-management.component.html',
  styleUrls: ['./address-management.component.scss']
})
export class AddressManagementComponent implements OnInit {
  addresses: DeliveryAddress[] = [];

  addressForm!: FormGroup;
  showAddForm = false;
  editingAddress: DeliveryAddress | null = null;
  submitted = false;

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder,
    private toast: ToastService,
    private router: Router
  ) {
    this.initForm();
  }

  goBack(): void { this.router.navigate(['/customer/profile']); }

  ngOnInit(): void {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    this.customerService.getAddresses().subscribe({
      next: (addresses) => { this.addresses = addresses; },
      error: () => this.toast.error('Failed to load addresses.')
    });
  }

  private initForm(): void {
    this.addressForm = this.fb.group({
      label: ['', [Validators.required, Validators.maxLength(50)]],
      street: ['', [Validators.required, Validators.maxLength(200)]],
      buildingNumber: ['', [Validators.required, Validators.maxLength(20)]],
      floor: [null],
      apartment: [null],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      district: [null],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      latitude: [null],
      longitude: [null],
      deliveryInstructions: [null],
      isDefault: [false]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.addressForm.valid) {
      const request = this.addressForm.value;
      if (this.editingAddress) {
        this.customerService.updateAddress(this.editingAddress.id, request).subscribe({
          next: () => {
            this.toast.success('Address updated.');
            this.cancelAdd();
            this.loadAddresses();
          },
          error: () => this.toast.error('Failed to save address. Please try again.')
        });
      } else {
        this.customerService.addAddress(request).subscribe({
          next: () => {
            this.toast.success('Address added.');
            this.cancelAdd();
            this.loadAddresses();
          },
          error: () => this.toast.error('Failed to save address. Please try again.')
        });
      }
    }
  }

  cancelAdd(): void {
    this.showAddForm = false;
    this.editingAddress = null;
    this.submitted = false;
    this.addressForm.reset({ isDefault: false });
  }

  editAddress(address: DeliveryAddress): void {
    this.editingAddress = address;
    this.addressForm.patchValue({
      label: address.label,
      street: address.street,
      buildingNumber: address.buildingNumber,
      floor: address.floor,
      apartment: address.apartment,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      deliveryInstructions: address.deliveryInstructions,
      isDefault: address.isDefault
    });
    this.showAddForm = true;
  }

  setDefault(addressId: string): void {
    this.customerService.setDefaultAddress(addressId).subscribe({
      next: () => {
        this.toast.success('Default address updated.');
        this.loadAddresses();
      },
      error: () => this.toast.error('Failed to set default address.')
    });
  }

  removeAddress(addressId: string): void {
    if (confirm('Are you sure you want to remove this address?')) {
      this.customerService.removeAddress(addressId).subscribe({
        next: () => {
          this.toast.success('Address removed.');
          this.loadAddresses();
        },
        error: () => this.toast.error('Failed to remove address.')
      });
    }
  }
}

