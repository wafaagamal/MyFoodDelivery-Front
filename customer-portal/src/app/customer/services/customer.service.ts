import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CustomerProfile,
  DeliveryAddress,
  PaymentMethod,
  LoyaltyInfo,
  UpdateProfileRequest,
  AddAddressRequest,
  AddPaymentMethodRequest
} from '../models/customer.models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly apiUrl = `${environment.customerApiUrl}/api/customers`;

  constructor(private http: HttpClient) {}

  // Profile
  getProfile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${this.apiUrl}/me`);
  }

  updateProfile(request: UpdateProfileRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/me`, request);
  }

  // Addresses
  getAddresses(): Observable<DeliveryAddress[]> {
    return this.http.get<DeliveryAddress[]>(`${this.apiUrl}/me/addresses`);
  }

  getAddress(addressId: string): Observable<DeliveryAddress> {
    return this.http.get<DeliveryAddress>(`${this.apiUrl}/me/addresses/${addressId}`);
  }

  addAddress(request: AddAddressRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/me/addresses`, request);
  }

  updateAddress(addressId: string, request: AddAddressRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/me/addresses/${addressId}`, request);
  }

  setDefaultAddress(addressId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/me/addresses/${addressId}/set-default`, {});
  }

  removeAddress(addressId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me/addresses/${addressId}`);
  }

  // Payment Methods
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/me/payment-methods`);
  }

  addPaymentMethod(request: AddPaymentMethodRequest): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/me/payment-methods`, request);
  }

  setDefaultPaymentMethod(paymentMethodId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/me/payment-methods/${paymentMethodId}/set-default`, {});
  }

  removePaymentMethod(paymentMethodId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me/payment-methods/${paymentMethodId}`);
  }

  // Loyalty
  getLoyaltyInfo(): Observable<LoyaltyInfo> {
    return this.http.get<LoyaltyInfo>(`${this.apiUrl}/me/loyalty`);
  }

  redeemPoints(points: number, orderId?: string): Observable<{ success: boolean; errorMessage?: string }> {
    return this.http.post<{ success: boolean; errorMessage?: string }>(
      `${this.apiUrl}/me/loyalty/redeem`,
      { points, orderId }
    );
  }
}
