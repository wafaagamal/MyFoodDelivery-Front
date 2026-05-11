// Restaurant models
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineType: string;
  phoneNumber: string;
  email: string;
  address: RestaurantAddress;
  logoUrl?: string;
  bannerUrl?: string;
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  averageRating: number;
  totalRatings: number;
  isOpen: boolean;
  acceptingOrders: boolean;
  distanceKm?: number;
  categories?: MenuCategory[];
}

export interface RestaurantAddress {
  street: string;
  buildingNumber: string;
  city: string;
  district?: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  fullAddress: string;
}

export interface Menu {
  restaurantId: string;
  restaurantName: string;
  categories: MenuCategory[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
  preparationTimeMinutes: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  allergens: string[];
  isAvailable: boolean;
  isFeatured: boolean;
}

// Cart models
export interface Cart {
  customerId: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  minimumOrderAmount: number;
  meetsMinimum: boolean;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface AddToCartRequest {
  restaurantId: string;
  menuItemId: string;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
  specialInstructions?: string;
}

// Order models
export interface DeliveryAddressRequest {
  street: string;
  buildingNumber: string;
  floor?: string | null;
  apartment?: string | null;
  city: string;
  district?: string | null;
  deliveryInstructions?: string | null;
  latitude: number;
  longitude: number;
}

export interface CreateOrderRequest {
  deliveryAddress: DeliveryAddressRequest;
  paymentMethod: PaymentMethodType;
  paymentMethodId?: string;
  notes?: string;
}

export interface OrderItemRequest {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

export enum PaymentMethodType {
  CashOnDelivery = 0,
  CreditCard = 1,
  DebitCard = 2,
  Wallet = 3
}

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  payment: PaymentResult;
}

export interface PaymentResult {
  requiresAction: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  actionUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string;
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  payment: PaymentInfo;
  status: string;
  specialInstructions?: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  tip: number;
  total: number;
  createdAt: Date;
  confirmedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  estimatedMinutes?: number;
  rider?: RiderInfo;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface DeliveryAddress {
  street: string;
  buildingNumber: string;
  floor?: string;
  apartment?: string;
  city: string;
  landmark?: string;
  latitude: number;
  longitude: number;
}

export interface PaymentInfo {
  method: string;
  status: string;
  transactionId?: string;
  amount: number;
  cashCollected?: number;
  changeAmount?: number;
}

export interface RiderInfo {
  riderId: string;
  name: string;
  phone: string;
  photoUrl?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  distanceKm?: number;
  etaMinutes?: number;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: string;
  timeline: TrackingEvent[];
  restaurantLocation?: Location;
  deliveryLocation?: Location;
  rider?: RiderTracking;
  etaMinutes?: number;
  etaText?: string;
}

export interface TrackingEvent {
  status: string;
  title: string;
  description?: string;
  occurredAt?: Date;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface RiderTracking {
  riderId: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  etaMinutes: number;
  vehicleType: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  restaurantName: string;
  restaurantLogo?: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  estimatedMinutes?: number;
}
