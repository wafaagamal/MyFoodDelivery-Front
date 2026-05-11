import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

/**
 * Guard that checks if user has the required role to access a route.
 * Usage in routes:
 * {
 *   path: 'restaurant',
 *   canActivate: [roleGuard],
 *   data: { roles: [UserRole.Restaurant, UserRole.Admin] },
 *   ...
 * }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: route.url.join('/') } 
    });
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as UserRole[] | undefined;
  
  // If no roles specified, allow access (just needs to be authenticated)
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Check if user has any of the required roles
  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  // User doesn't have required role - redirect to their appropriate portal
  authService.navigateToRolePortal();
  return false;
};

/**
 * Guard that redirects authenticated users to their role-based portal.
 * Useful for the portal selector page - if already logged in, go to the right portal.
 */
export const redirectIfAuthenticatedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    const role = authService.getUserRole();
    if (role) {
      authService.navigateToRolePortal();
      return false;
    }
  }

  return true;
};

/**
 * Guard that ensures user can only access their own portal based on role.
 * For example, a Customer can only access /customer routes.
 */
export const ownPortalGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const userRole = authService.getUserRole();
  const path = route.url[0]?.path;

  // Map path to expected role
  const pathRoleMap: Record<string, UserRole> = {
    'customer': UserRole.Customer,
    'restaurant': UserRole.Restaurant,
    'delivery': UserRole.Delivery,
    'admin': UserRole.Admin
  };

  const expectedRole = pathRoleMap[path];
  
  // Admin can access any portal
  if (userRole === UserRole.Admin) {
    return true;
  }

  // Check if user's role matches the portal they're trying to access
  if (expectedRole && userRole === expectedRole) {
    return true;
  }

  // Redirect to their own portal
  authService.navigateToRolePortal();
  return false;
};
