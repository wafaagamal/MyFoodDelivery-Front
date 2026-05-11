import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, delay, BehaviorSubject } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService, AuthResponse, UserRole } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-token-123',
    refreshToken: 'mock-refresh',
    expiresIn: 3600
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'navigateToRolePortal']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    queryParamsSubject = new BehaviorSubject<any>({});

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        FormsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable(),
            snapshot: {
              queryParams: {}
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have empty email and password', () => {
      expect(component.email).toBe('');
      expect(component.password).toBe('');
    });

    it('should not be loading initially', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should have no error message initially', () => {
      expect(component.error).toBe('');
    });

    it('should render login form', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('form')).toBeTruthy();
      expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
      expect(compiled.querySelector('input[type="password"]')).toBeTruthy();
      expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should display welcome message', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('h1').textContent).toContain('Welcome Back');
    });
  });

  describe('Role Selection from Query Params', () => {
    it('should pre-select Customer role when role=customer in query params', fakeAsync(() => {
      queryParamsSubject.next({ role: 'customer' });
      tick();
      expect(component.selectedRole).toBe(UserRole.Customer);
    }));

    it('should pre-select Restaurant role when role=restaurant in query params', fakeAsync(() => {
      queryParamsSubject.next({ role: 'restaurant' });
      tick();
      expect(component.selectedRole).toBe(UserRole.Restaurant);
    }));

    it('should pre-select Delivery role when role=delivery in query params', fakeAsync(() => {
      queryParamsSubject.next({ role: 'delivery' });
      tick();
      expect(component.selectedRole).toBe(UserRole.Delivery);
    }));

    it('should handle case-insensitive role query param', fakeAsync(() => {
      queryParamsSubject.next({ role: 'DELIVERY' });
      tick();
      expect(component.selectedRole).toBe(UserRole.Delivery);
    }));

    it('should default to Customer when no role query param', fakeAsync(() => {
      queryParamsSubject.next({});
      tick();
      expect(component.selectedRole).toBe(UserRole.Customer);
    }));

    it('should show correct submit button text based on selected role', fakeAsync(() => {
      queryParamsSubject.next({ role: 'delivery' });
      tick();
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.textContent).toContain('Delivery');
    }));
  });

  describe('Role Selection via UI', () => {
    it('should change selected role when selectRole is called', () => {
      component.selectRole(UserRole.Restaurant);
      expect(component.selectedRole).toBe(UserRole.Restaurant);
    });

    it('should have three role options', () => {
      expect(component.roles.length).toBe(3);
      expect(component.roles.map(r => r.value)).toEqual([
        UserRole.Customer,
        UserRole.Restaurant,
        UserRole.Delivery
      ]);
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting with empty fields', () => {
      component.email = '';
      component.password = '';

      component.onSubmit();

      expect(component.error).toBe('Please enter email and password');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should show error when email is empty', () => {
      component.email = '';
      component.password = 'password123';

      component.onSubmit();

      expect(component.error).toBe('Please enter email and password');
    });

    it('should show error when password is empty', () => {
      component.email = 'test@example.com';
      component.password = '';

      component.onSubmit();

      expect(component.error).toBe('Please enter email and password');
    });
  });

  describe('Login API Call', () => {
    it('should call auth service login with credentials and role', fakeAsync(() => {
      mockAuthService.login.and.returnValue(of(mockAuthResponse));

      component.email = 'test@example.com';
      component.password = 'password123';
      component.selectedRole = UserRole.Customer;

      component.onSubmit();
      tick();

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123', UserRole.Customer);
    }));

    it('should pass selected role to login service', fakeAsync(() => {
      mockAuthService.login.and.returnValue(of(mockAuthResponse));

      component.email = 'test@example.com';
      component.password = 'password123';
      component.selectedRole = UserRole.Delivery;

      component.onSubmit();
      tick();

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123', UserRole.Delivery);
    }));

    it('should set loading state during login', fakeAsync(() => {
      mockAuthService.login.and.returnValue(of(mockAuthResponse).pipe(delay(100)));

      component.email = 'test@example.com';
      component.password = 'password123';

      component.onSubmit();

      expect(component.isLoading).toBe(true);

      tick(100);

      // Loading might still be true until navigation completes
    }));

    it('should clear error before login attempt', fakeAsync(() => {
      mockAuthService.login.and.returnValue(of(mockAuthResponse));
      component.error = 'Previous error';

      component.email = 'test@example.com';
      component.password = 'password123';

      component.onSubmit();
      tick();

      expect(component.error).toBe('');
    }));
  });

  describe('Successful Login', () => {
    it('should call navigateToRolePortal on success', fakeAsync(() => {
      mockAuthService.login.and.returnValue(of(mockAuthResponse));

      component.email = 'test@example.com';
      component.password = 'password123';

      component.onSubmit();
      tick();

      expect(mockAuthService.navigateToRolePortal).toHaveBeenCalled();
    }));
  });

  describe('Failed Login', () => {
    it('should display error message on login failure', fakeAsync(() => {
      mockAuthService.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

      component.email = 'test@example.com';
      component.password = 'wrongpassword';

      component.onSubmit();
      tick();

      expect(component.error).toBe('Invalid email or password');
    }));

    it('should stop loading state on error', fakeAsync(() => {
      mockAuthService.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

      component.email = 'test@example.com';
      component.password = 'wrongpassword';

      component.onSubmit();
      tick();

      expect(component.isLoading).toBe(false);
    }));

    it('should not navigate on login failure', fakeAsync(() => {
      mockAuthService.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

      component.email = 'test@example.com';
      component.password = 'wrongpassword';

      component.onSubmit();
      tick();

      expect(mockAuthService.navigateToRolePortal).not.toHaveBeenCalled();
    }));
  });

  describe('UI Response to API State', () => {
    it('should show loading indicator when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const loadingText = compiled.querySelector('button[type="submit"] span');
      expect(loadingText.textContent).toContain('Signing in');
    });

    it('should disable submit button when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.disabled).toBe(true);
    });

    it('should enable submit button when not loading', () => {
      component.isLoading = false;
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.disabled).toBe(false);
    });

    it('should display error message when error exists', () => {
      component.error = 'Test error message';
      fixture.detectChanges();

      const errorDiv = fixture.nativeElement.querySelector('.error-message');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.textContent).toContain('Test error message');
    });

    it('should hide error message when error is empty', () => {
      component.error = '';
      fixture.detectChanges();

      const errorDiv = fixture.nativeElement.querySelector('.error-message');
      expect(errorDiv).toBeFalsy();
    });
  });

  describe('Register Link', () => {
    it('should have link to register page', () => {
      const registerLink = fixture.nativeElement.querySelector('.register-link a');
      expect(registerLink).toBeTruthy();
      expect(registerLink.getAttribute('routerLink')).toBe('/register');
    });
  });

  describe('Form Input Binding', () => {
    it('should update email on input', fakeAsync(() => {
      const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
      emailInput.value = 'newemail@test.com';
      emailInput.dispatchEvent(new Event('input'));
      tick();

      expect(component.email).toBe('newemail@test.com');
    }));

    it('should update password on input', fakeAsync(() => {
      const passwordInput = fixture.nativeElement.querySelector('input[type="password"]');
      passwordInput.value = 'newpassword';
      passwordInput.dispatchEvent(new Event('input'));
      tick();

      expect(component.password).toBe('newpassword');
    }));
  });
});
