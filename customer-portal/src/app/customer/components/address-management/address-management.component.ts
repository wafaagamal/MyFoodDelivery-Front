import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { 
  CustomerState, 
  LoadAddresses, 
  AddAddress, 
  RemoveAddress, 
  SetDefaultAddress 
} from '../../state/customer.state';
import { DeliveryAddress } from '../../models/customer.models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-address-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-management.component.html',
  styleUrls: ['./address-management.component.scss']
})
export class AddressManagementComponent implements OnInit {
  @Select(CustomerState.addresses) addresses$!: Observable<DeliveryAddress[]>;

  addressForm!: FormGroup;
  showAddForm = false;
  editingAddress: DeliveryAddress | null = null;

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.store.dispatch(new LoadAddresses());
  }

  private initForm(): void {
    this.addressForm = this.fb.group({
      label: ['', [Validators.required, Validators.maxLength(50)]],
      street: ['', [Validators.required, Validators.maxLength(200)]],
      buildingNumber: ['', [Validators.required, Validators.maxLength(20)]],
      floor: [''],
      apartment: [''],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      district: [''],
      postalCode: ['', [Validators.required, Validators.maxLength(20)]],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      latitude: [null],
      longitude: [null],
      deliveryInstructions: [''],
      isDefault: [false]
    });
  }

  onSubmit(): void {
    if (this.addressForm.valid) {
      this.store.dispatch(new AddAddress(this.addressForm.value)).subscribe({
        next: () => {
          this.toast.success(this.editingAddress ? 'Address updated.' : 'Address added.');
          this.cancelAdd();
        },
        error: () => this.toast.error('Failed to save address. Please try again.')
      });
    }
  }

  cancelAdd(): void {
    this.showAddForm = false;
    this.editingAddress = null;
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
    this.store.dispatch(new SetDefaultAddress(addressId)).subscribe({
      next: () => this.toast.success('Default address updated.'),
      error: () => this.toast.error('Failed to set default address.')
    });
  }

  removeAddress(addressId: string): void {
    if (confirm('Are you sure you want to remove this address?')) {
      this.store.dispatch(new RemoveAddress(addressId)).subscribe({
        next: () => this.toast.success('Address removed.'),
        error: () => this.toast.error('Failed to remove address.')
      });
    }
  }
}
