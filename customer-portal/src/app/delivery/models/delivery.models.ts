// Delivery Task Status enum matching backend
export enum DeliveryTaskStatus {
  Pending = 'Pending',
  Assigned = 'Assigned',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

// Rider status enum
export enum RiderStatus {
  Offline = 'Offline',
  Available = 'Available',
  Busy = 'Busy',
  OnDelivery = 'OnDelivery'
}

// Rider model from API
export interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  vehicleType: string;
  vehiclePlate?: string;
  status: string;
  isOnline: boolean;
  isActive: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  totalDeliveries: number;
  totalEarnings: number;
  averageRating: number;
  ratingCount: number;
}

// Available delivery for rider to accept
export interface AvailableDelivery {
  id: string;
  restaurantName: string;
  restaurantLogo?: string;
  restaurantDistance: string;
  pickupAddress: string;
  dropoffAddress: string;
  totalDistance: string;
  estimatedTime: number;
  earning: number;
}

// Today's summary stats
export interface TodaySummary {
  deliveries: number;
  earnings: number;
  hours: number;
  tips: number;
}

// Current active delivery
export interface CurrentDelivery {
  id: string;
  orderId: string;
  status: string;
  step: number;
  restaurantName: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
}

// Delivery history item
export interface DeliveryHistory {
  id: string;
  orderId: string;
  restaurantName: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  earning: number;
  tip: number;
  completedAt?: Date;
  createdAt: Date;
}

// Order item within a delivery task
export interface DeliveryTaskItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

// Full delivery task from API
export interface DeliveryTask {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  restaurantName: string;
  restaurantLogoUrl?: string;
  restaurantAddress: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  distanceKm?: number;
  estimatedMinutes?: number;
  earning: number;
  tip: number;
  notes?: string;
  creationTime: string;
  completedTime?: string;
  items?: DeliveryTaskItem[];
}

// Earnings summary data
export interface EarningsData {
  totalEarnings: number;
  totalDeliveries: number;
  totalTips: number;
  activeHours: number;
  avgPerDelivery: number;
  availableBalance: number;
}

// Daily earnings for chart
export interface DailyEarning {
  day: string;
  deliveries: number;
  earnings: number;
}

// Transaction types
export type TransactionType = 'delivery' | 'tip' | 'bonus' | 'withdrawal';

// Transaction record
export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: Date;
}

// Rider profile for display
export interface RiderProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
  vehicleType: string;
  vehiclePlate?: string;
  rating: number;
  totalDeliveries: number;
  memberSince: Date;
  badges: string[];
}

// Rider settings/preferences
export interface RiderSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  soundAlerts: boolean;
  navigationApp: string;
}

// Driver profile for display (component-level, extended from RiderProfile)
export interface DriverProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  totalDeliveries: number;
  monthsActive: number;
  acceptanceRate: number;
  completionRate: number;
  badges: string[];
  joinedDate: Date;
}

// Vehicle information
export interface VehicleInfo {
  type: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  insuranceExpiry: Date;
}

// Document status enum
export type DocumentStatus = 'verified' | 'pending' | 'expired' | 'rejected';

// Rider document
export interface RiderDocument {
  id: string;
  type: string;
  name: string;
  status: DocumentStatus;
  expiryDate?: Date;
  uploadedDate: Date;
}
