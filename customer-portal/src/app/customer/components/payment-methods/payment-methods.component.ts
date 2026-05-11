import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { PaymentMethod, PaymentMethodType, AddPaymentMethodRequest } from '../../models/customer.models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.scss']
})
export class PaymentMethodsComponent implements OnInit {
  PaymentMethodType = PaymentMethodType;

  paymentMethods: PaymentMethod[] = [];
  isLoading = false;

  showAddForm = false;
  isAdding = false;

  // New card form fields
  cardNumber = '';
  cardHolder = '';
  expiryMonth = '';
  expiryYear = '';
  cvv = '';
  cardLabel = '';
  setAsDefault = false;

  constructor(private customerService: CustomerService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.isLoading = true;
    this.customerService.getPaymentMethods().subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to load payment methods.');
        this.isLoading = false;
      }
    });
  }

  get cardBrand(): string {
    const n = this.cardNumber.replace(/\s/g, '');
    if (/^4/.test(n)) return 'visa';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    return 'unknown';
  }

  get last4(): string {
    const n = this.cardNumber.replace(/\s/g, '');
    return n.length >= 4 ? n.slice(-4) : '';
  }

  get expiryDate(): Date | null {
    const m = parseInt(this.expiryMonth, 10);
    const y = parseInt(this.expiryYear, 10);
    if (!m || !y || m < 1 || m > 12) return null;
    const fullYear = y < 100 ? 2000 + y : y;
    return new Date(fullYear, m - 1, 1);
  }

  get isFormValid(): boolean {
    const digits = this.cardNumber.replace(/\s/g, '');
    return (
      digits.length >= 15 &&
      this.cardHolder.trim().length >= 2 &&
      !!this.expiryDate &&
      this.cvv.length >= 3 &&
      this.cardLabel.trim().length >= 1
    );
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    this.cardNumber = val;
  }

  submitCard(): void {
    if (!this.isFormValid) return;
    this.isAdding = true;

    const request: AddPaymentMethodRequest = {
      type: PaymentMethodType.CreditCard,
      label: this.cardLabel.trim(),
      last4Digits: this.last4,
      cardBrand: this.cardBrand,
      externalToken: null,
      expiryDate: this.expiryDate,
      isDefault: this.setAsDefault
    };

    this.customerService.addPaymentMethod(request).subscribe({
      next: () => {
        this.toast.success('Card added successfully!');
        this.showAddForm = false;
        this.resetForm();
        this.loadPaymentMethods();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to add card. Please try again.');
        this.isAdding = false;
      }
    });
  }

  setDefault(id: string): void {
    this.customerService.setDefaultPaymentMethod(id).subscribe({
      next: () => {
        this.paymentMethods = this.paymentMethods.map(m => ({ ...m, isDefault: m.id === id }));
        this.toast.success('Default card updated.');
      },
      error: () => { this.toast.error('Failed to set default card.'); }
    });
  }

  removeCard(id: string): void {
    if (!confirm('Remove this card?')) return;
    this.customerService.removePaymentMethod(id).subscribe({
      next: () => {
        this.paymentMethods = this.paymentMethods.filter(m => m.id !== id);
        this.toast.success('Card removed.');
      },
      error: () => { this.toast.error('Failed to remove card.'); }
    });
  }

  cancelAdd(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.cardNumber = '';
    this.cardHolder = '';
    this.expiryMonth = '';
    this.expiryYear = '';
    this.cvv = '';
    this.cardLabel = 'My Card';
    this.setAsDefault = false;
    this.isAdding = false;
  }
}
