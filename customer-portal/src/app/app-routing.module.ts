import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { redirectIfAuthenticatedGuard, ownPortalGuard } from './auth/guards/role.guard';
import { UserRole } from './auth/services/auth.service';

export const routes: Routes = [
  // Portal Selector (Landing Page) - redirects if already authenticated
  {
    path: '',
    loadComponent: () => import('./layouts/portal-selector/portal-selector.component')
      .then(m => m.PortalSelectorComponent),
    canActivate: [redirectIfAuthenticatedGuard]
  },
  
  // Customer Portal - protected by role
  {
    path: 'customer',
    loadComponent: () => import('./layouts/customer-layout/customer-layout.component')
      .then(m => m.CustomerLayoutComponent),
    canActivate: [ownPortalGuard],
    data: { roles: [UserRole.Customer, UserRole.Admin] },
    children: [
      {
        path: '',
        redirectTo: 'restaurants',
        pathMatch: 'full'
      },
      {
        path: 'restaurants',
        loadComponent: () => import('./ordering/components/restaurant-list/restaurant-list.component')
          .then(m => m.RestaurantListComponent)
      },
      {
        path: 'restaurants/:id',
        loadComponent: () => import('./ordering/components/restaurant-detail/restaurant-detail.component')
          .then(m => m.RestaurantDetailComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./ordering/components/checkout/checkout.component')
          .then(m => m.CheckoutComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./ordering/components/order-history/order-history.component')
          .then(m => m.OrderHistoryComponent)
      },
      {
        path: 'orders/:id/tracking',
        loadComponent: () => import('./ordering/components/order-tracking/order-tracking.component')
          .then(m => m.OrderTrackingComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./customer/components/profile/profile.component')
          .then(m => m.ProfileComponent)
      },
      {
        path: 'payment-methods',
        loadComponent: () => import('./customer/components/payment-methods/payment-methods.component')
          .then(m => m.PaymentMethodsComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./customer/components/cart/cart.component')
          .then(m => m.CartComponent)
      },
      {
        path: 'addresses',
        loadComponent: () => import('./customer/components/address-management/address-management.component')
          .then(m => m.AddressManagementComponent)
      }
    ]
  },
  
  // Restaurant Portal - protected by role
  {
    path: 'restaurant',
    loadComponent: () => import('./layouts/restaurant-layout/restaurant-layout.component')
      .then(m => m.RestaurantLayoutComponent),
    canActivate: [ownPortalGuard],
    data: { roles: [UserRole.Restaurant, UserRole.Admin] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./restaurant/components/dashboard/dashboard.component')
          .then(m => m.RestaurantDashboardComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./restaurant/components/orders/orders.component')
          .then(m => m.RestaurantOrdersComponent)
      },
      {
        path: 'menu',
        loadComponent: () => import('./restaurant/components/menu-management/menu-management.component')
          .then(m => m.MenuManagementComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./restaurant/components/analytics/analytics.component')
          .then(m => m.RestaurantAnalyticsComponent)
      },
      {
        path: 'reviews',
        loadComponent: () => import('./restaurant/components/reviews/reviews.component')
          .then(m => m.RestaurantReviewsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./restaurant/components/settings/settings.component')
          .then(m => m.RestaurantSettingsComponent)
      }
    ]
  },
  
  // Delivery Portal - protected by role
  {
    path: 'delivery',
    loadComponent: () => import('./layouts/delivery-layout/delivery-layout.component')
      .then(m => m.DeliveryLayoutComponent),
    canActivate: [ownPortalGuard],
    data: { roles: [UserRole.Delivery, UserRole.Admin] },
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./delivery/components/home/home.component')
          .then(m => m.DeliveryHomeComponent)
      },
      {
        path: 'deliveries',
        loadComponent: () => import('./delivery/components/deliveries/deliveries.component')
          .then(m => m.DeliveriesComponent)
      },
      {
        path: 'deliveries/:id',
        loadComponent: () => import('./delivery/components/delivery-detail/delivery-detail.component')
          .then(m => m.DeliveryDetailComponent)
      },
      {
        path: 'earnings',
        loadComponent: () => import('./delivery/components/earnings/earnings.component')
          .then(m => m.EarningsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./delivery/components/profile/profile.component')
          .then(m => m.DeliveryProfileComponent)
      },
      {
        path: 'account',
        loadComponent: () => import('./delivery/components/account/account.component')
          .then(m => m.DeliveryAccountComponent)
      },
      {
        path: 'vehicle',
        loadComponent: () => import('./delivery/components/vehicle/vehicle.component')
          .then(m => m.DeliveryVehicleComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./delivery/components/documents/documents.component')
          .then(m => m.DeliveryDocumentsComponent)
      },
      {
        path: 'support',
        loadComponent: () => import('./delivery/components/support/support.component')
          .then(m => m.DeliverySupportComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./delivery/components/history/history.component')
          .then(m => m.DeliveryHistoryComponent)
      }
    ]
  },
  
  // Auth Routes (shared)
  {
    path: 'login',
    loadComponent: () => import('./auth/components/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/components/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/components/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'terms',
    loadComponent: () => import('./legal/legal.component').then(m => m.LegalComponent),
    data: { page: 'terms' }
  },
  {
    path: 'privacy',
    loadComponent: () => import('./legal/legal.component').then(m => m.LegalComponent),
    data: { page: 'privacy' }
  },
  
  // Legacy redirects
  {
    path: 'restaurants',
    redirectTo: 'customer/restaurants',
    pathMatch: 'full'
  },
  {
    path: 'orders',
    redirectTo: 'customer/orders',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    redirectTo: 'customer/profile',
    pathMatch: 'full'
  },
  
  // Fallback
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
