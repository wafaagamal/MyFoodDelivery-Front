import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export enum UserRole {
  Customer = 'Customer',
  Restaurant = 'Restaurant',
  Delivery = 'Delivery',
  Admin = 'Admin'
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  /** OpenID Connect standard claim names as issued by the backend */
  given_name?: string;
  family_name?: string;
  /** Legacy aliases — kept for backward compat with other parts of the app */
  firstName?: string;
  lastName?: string;
  exp: number;
  iat: number;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role?: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private accessToken = new BehaviorSubject<string | null>(null);
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private _currentRole = new BehaviorSubject<UserRole | null>(null);

  readonly isAuthenticated$: Observable<boolean> = this._isAuthenticated.asObservable();
  readonly currentRole$: Observable<UserRole | null> = this._currentRole.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkStoredToken();
  }

  private checkStoredToken(): void {
    const token = localStorage.getItem('access_token');
    if (token && !this.isTokenExpired(token)) {
      this.accessToken.next(token);
      this._isAuthenticated.next(true);
      const payload = this.decodeToken(token);
      if (payload) {
        this._currentRole.next(payload.role);
      }
    } else if (token) {
      // Token expired, clear it
      this.logout();
    }
  }

  /**
   * Decode a JWT token without verification (client-side only)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }
    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate <= new Date();
  }

  /**
   * Get current user's role from JWT
   */
  getUserRole(): UserRole | null {
    return this._currentRole.getValue();
  }

  /**
   * Get the portal route based on user role
   */
  getPortalRouteForRole(role: UserRole): string {
    switch (role) {
      case UserRole.Customer:
        return '/customer';
      case UserRole.Restaurant:
        return '/restaurant';
      case UserRole.Delivery:
        return '/delivery';
      case UserRole.Admin:
        return '/admin';
      default:
        return '/';
    }
  }

  /**
   * Navigate to the appropriate portal based on user role
   */
  navigateToRolePortal(): void {
    const role = this.getUserRole();
    if (role) {
      const route = this.getPortalRouteForRole(role);
      this.router.navigate([route]);
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this._currentRole.getValue() === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const currentRole = this._currentRole.getValue();
    return currentRole !== null && roles.includes(currentRole);
  }

  getAccessToken(): string | null {
    return this.accessToken.getValue();
  }

  setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.accessToken.next(token);
    this._isAuthenticated.next(true);
    
    const payload = this.decodeToken(token);
    if (payload) {
      this._currentRole.next(payload.role);
    }
  }

  login(email: string, password: string, role: UserRole = UserRole.Customer): Observable<AuthResponse> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('username', email);
    body.set('password', password);
    body.set('client_id', 'angular-customer-portal');
    body.set('scope', 'openid profile email roles myfooddelivery');

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.http.post<{ access_token: string; refresh_token: string; expires_in: number }>(
      `${environment.auth.authority}/connect/token`,
      body.toString(),
      { headers }
    ).pipe(
      map(response => ({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in
      })),
      tap(response => {
        this.setAccessToken(response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refresh_token', response.refreshToken);
        }
      })
    );
  }

  register(dto: RegisterDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.auth.authority}/api/account/register`,
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        role: dto.role ?? UserRole.Customer
      }
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.accessToken.next(null);
    this._isAuthenticated.next(false);
    this._currentRole.next(null);
  }

  isLoggedIn(): boolean {
    return this._isAuthenticated.getValue();
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated.getValue();
  }

  /**
   * Get decoded token payload for current user
   */
  getCurrentUser(): JwtPayload | null {
    const token = this.getAccessToken();
    if (!token) return null;
    return this.decodeToken(token);
  }

  /** Returns the user's full name from JWT claims, falling back to email */
  getDisplayName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    const first = user.given_name || user.firstName || '';
    const last = user.family_name || user.lastName || '';
    const full = [first, last].filter(Boolean).join(' ');
    return full || user.email;
  }
}
