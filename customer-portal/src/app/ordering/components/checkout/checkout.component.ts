import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OrderingService } from '../../services/ordering.service';
import { CustomerService } from '../../../customer/services/customer.service';
import { Cart, CreateOrderRequest, DeliveryAddressRequest, PaymentMethodType, Order } from '../../models/ordering.models';
import { DeliveryAddress, PaymentMethod } from '../../../customer/models/customer.models';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  PaymentMethodType = PaymentMethodType;
  
  cart: Cart | null = null;
  isLoadingCart = true;
  addresses: DeliveryAddress[] = [];
  paymentMethods: PaymentMethod[] = [];

  selectedAddressId: string | null = null;
  selectedPaymentMethod: PaymentMethodType = PaymentMethodType.CashOnDelivery;
  selectedPaymentMethodId: string | null = null;
  
  promoCode = '';
  promoApplied = false;
  discount = 0;

  tipOptions = [0, 2, 5, 10];
  selectedTip = 0;
  customTip: number | null = null;
  customTipValue = 0;
  showCustomTipInput = false;

  specialInstructions = '';
  isProcessing = false;

  constructor(
    private router: Router,
    private orderingService: OrderingService,
    private customerService: CustomerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadAddresses();
    this.loadPaymentMethods();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCart(): void {
    this.isLoadingCart = true;
    this.orderingService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cart = cart;
          this.isLoadingCart = false;
        },
        error: () => {
          this.cart = null;
          this.isLoadingCart = false;
        }
      });
  }

  private loadAddresses(): void {
    this.customerService.getAddresses()
      .pipe(takeUntil(this.destroy$))
      .subscribe(addresses => {
        this.addresses = addresses;
        const defaultAddr = addresses.find(a => a.isDefault);
        if (defaultAddr) {
          this.selectedAddressId = defaultAddr.id;
        } else if (addresses.length > 0) {
          this.selectedAddressId = addresses[0].id;
        }
      });
  }

  private loadPaymentMethods(): void {
    this.customerService.getPaymentMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe(methods => {
        this.paymentMethods = methods;
        const defaultMethod = methods.find(m => m.isDefault);
        if (defaultMethod) {
          this.selectedPaymentMethodId = defaultMethod.id;
        }
      });
  }

  selectAddress(id: string): void {
    this.selectedAddressId = id;
  }

  selectPaymentMethod(method: PaymentMethodType): void {
    this.selectedPaymentMethod = method;
    if (method === PaymentMethodType.CashOnDelivery) {
      this.selectedPaymentMethodId = null;
    }
  }

  selectCard(id: string): void {
    this.selectedPaymentMethodId = id;
  }

  addNewCard(): void {
    this.router.navigate(['/payment-methods/add']);
  }

  applyPromo(): void {
    if (this.promoCode.toLowerCase() === 'save10') {
      this.promoApplied = true;
      this.discount = (this.cart?.subtotal || 0) * 0.1;
    }
  }

  removePromo(): void {
    this.promoCode = '';
    this.promoApplied = false;
    this.discount = 0;
  }

  selectTip(amount: number): void {
    this.selectedTip = amount;
    this.customTip = null;
    this.showCustomTipInput = false;
  }

  showCustomTip(): void {
    this.showCustomTipInput = true;
  }

  applyCustomTip(): void {
    if (this.customTipValue > 0) {
      this.customTip = this.customTipValue;
      this.selectedTip = 0;
      this.showCustomTipInput = false;
    }
  }

  getTip(): number {
    return this.customTip ?? this.selectedTip;
  }

  getTotal(): number {
    if (!this.cart) return 0;
    return this.cart.subtotal + this.cart.deliveryFee + this.cart.serviceFee - this.discount + this.getTip();
  }

  get canPlaceOrder(): boolean {
    return !!(
      this.cart &&
      this.cart.items.length > 0 &&
      this.selectedAddressId &&
      this.selectedPaymentMethod !== null && this.selectedPaymentMethod !== undefined
    );
  }

  placeOrder(): void {
    if (!this.canPlaceOrder || !this.cart) return;

    const selectedAddr = this.addresses.find(a => a.id === this.selectedAddressId);
    if (!selectedAddr) return;

    this.isProcessing = true;

    const deliveryAddress: DeliveryAddressRequest = {
      street: selectedAddr.street,
      buildingNumber: selectedAddr.buildingNumber,
      floor: selectedAddr.floor,
      apartment: selectedAddr.apartment,
      city: selectedAddr.city,
      district: selectedAddr.district,
      deliveryInstructions: selectedAddr.deliveryInstructions,
      latitude: selectedAddr.latitude ?? 0,
      longitude: selectedAddr.longitude ?? 0
    };

    const request: CreateOrderRequest = {
      deliveryAddress,
      paymentMethod: this.selectedPaymentMethod,
      paymentMethodId: this.selectedPaymentMethodId || undefined,
      notes: this.specialInstructions || undefined
    };

    this.orderingService.createOrder(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order: Order) => {
          this.toast.success('Order placed successfully!');
          this.router.navigate(
            ['/customer/orders', order.id, 'tracking'],
            { queryParams: { success: '1' } }
          );
        },
        error: (err) => {
          this.isProcessing = false;
          this.toast.error(err?.error?.message || 'Failed to place order. Please try again.');
        }
      });
  }

  private handleCardPayment(orderId: string): void {
    this.router.navigate(['/customer/orders', orderId, 'tracking']);
  }
}
