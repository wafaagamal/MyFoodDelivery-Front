// Customer State Model
export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  isActive: boolean;
  createdAt: Date;
  lastOrderDate: Date | null;
  totalOrders: number;
}

export interface DeliveryAddress {
  id: string;
  label: string;
  street: string;
  buildingNumber: string;
  floor: string | null;
  apartment: string | null;
  city: string;
  district: string | null;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  deliveryInstructions: string | null;
  isDefault: boolean;
  fullAddress: string;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  last4Digits: string | null;
  cardBrand: string | null;
  isDefault: boolean;
  isExpired: boolean;
  expiryDate: Date | null;
  displayName: string;
}

export interface LoyaltyInfo {
  customerId: string;
  currentPoints: number;
  lifetimePoints: number;
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  pointsValue: number;
}

export enum LoyaltyTier {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Platinum = 'Platinum'
}

export enum PaymentMethodType {
  CreditCard = 'CreditCard',
  DebitCard = 'DebitCard',
  PayPal = 'PayPal',
  ApplePay = 'ApplePay',
  GooglePay = 'GooglePay',
  CashOnDelivery = 'CashOnDelivery'
}

// Request DTOs
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;
}

export interface AddAddressRequest {
  label: string;
  street: string;
  buildingNumber: string;
  floor: string | null;
  apartment: string | null;
  city: string;
  district: string | null;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  deliveryInstructions: string | null;
  isDefault: boolean;
}

export interface AddPaymentMethodRequest {
  type: PaymentMethodType;
  label: string;
  last4Digits: string | null;
  cardBrand: string | null;
  externalToken: string | null;
  expiryDate: Date | null;
  isDefault: boolean;
}
