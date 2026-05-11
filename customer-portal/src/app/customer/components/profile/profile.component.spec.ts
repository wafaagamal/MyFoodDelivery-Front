import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxsModule, Store } from '@ngxs/store';
import { BehaviorSubject, of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { CustomerState, LoadProfile, UpdateProfile } from '../../state/customer.state';
import { CustomerProfile, LoyaltyTier } from '../../models/customer.models';
import { CustomerService } from '../../services/customer.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let store: Store;
  let mockCustomerService: jasmine.SpyObj<CustomerService>;

  const mockProfile: CustomerProfile = {
    id: 'customer-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    profileImageUrl: null,
    loyaltyPoints: 500,
    loyaltyTier: LoyaltyTier.Silver,
    isActive: true,
    createdAt: new Date('2023-01-15'),
    lastOrderDate: new Date('2024-06-01'),
    totalOrders: 25
  };

  // Create BehaviorSubjects to simulate NGXS selectors
  let profileSubject: BehaviorSubject<CustomerProfile | null>;
  let loadingSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    profileSubject = new BehaviorSubject<CustomerProfile | null>(null);
    loadingSubject = new BehaviorSubject<boolean>(false);

    mockCustomerService = jasmine.createSpyObj('CustomerService', [
      'getProfile',
      'updateProfile'
    ]);
    mockCustomerService.getProfile.and.returnValue(of(mockProfile));
    mockCustomerService.updateProfile.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        ReactiveFormsModule,
        NgxsModule.forRoot([CustomerState])
      ],
      providers: [
        { provide: CustomerService, useValue: mockCustomerService }
      ]
    }).compileComponents();

    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    // Override the Select decorators with our subjects
    Object.defineProperty(component, 'profile$', {
      get: () => profileSubject.asObservable()
    });
    Object.defineProperty(component, 'loading$', {
      get: () => loadingSubject.asObservable()
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize form with empty values', () => {
      fixture.detectChanges();

      expect(component.profileForm.get('firstName')?.value).toBe('');
      expect(component.profileForm.get('lastName')?.value).toBe('');
      expect(component.profileForm.get('phoneNumber')?.value).toBe('');
    });

    it('should not be loading initially', () => {
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
    });

    it('should dispatch LoadProfile action on init', () => {
      spyOn(store, 'dispatch');
      fixture.detectChanges();

      expect(store.dispatch).toHaveBeenCalledWith(jasmine.any(LoadProfile));
    });
  });

  describe('Profile Data Loading', () => {
    it('should populate form when profile is loaded', fakeAsync(() => {
      fixture.detectChanges();

      profileSubject.next(mockProfile);
      tick();

      expect(component.profileForm.get('firstName')?.value).toBe('John');
      expect(component.profileForm.get('lastName')?.value).toBe('Doe');
      expect(component.profileForm.get('phoneNumber')?.value).toBe('+1234567890');
    }));

    it('should update isLoading when loading state changes', fakeAsync(() => {
      fixture.detectChanges();

      loadingSubject.next(true);
      tick();

      expect(component.isLoading).toBe(true);

      loadingSubject.next(false);
      tick();

      expect(component.isLoading).toBe(false);
    }));
  });

  describe('UI Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      profileSubject.next(mockProfile);
      tick();
      fixture.detectChanges();
    }));

    it('should display user initials when no profile image', () => {
      const placeholder = fixture.nativeElement.querySelector('.avatar-placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder.textContent.trim()).toBe('JD');
    });

    it('should display loyalty badge', () => {
      const badge = fixture.nativeElement.querySelector('.loyalty-badge');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('Silver');
    });

    it('should display loyalty points in badge', () => {
      const points = fixture.nativeElement.querySelector('.loyalty-badge .points');
      expect(points.textContent).toContain('500');
    });

    it('should display total orders in stats', () => {
      const stats = fixture.nativeElement.querySelectorAll('.stat-value');
      expect(stats[0].textContent).toContain('25');
    });

    it('should display loyalty points in stats', () => {
      const stats = fixture.nativeElement.querySelectorAll('.stat-value');
      expect(stats[1].textContent).toContain('500');
    });

    it('should display member since date', () => {
      const stats = fixture.nativeElement.querySelectorAll('.stat-value');
      expect(stats[2].textContent).toContain('2023');
    });

    it('should display email as disabled field', () => {
      const emailInput = fixture.nativeElement.querySelector('input#email');
      expect(emailInput).toBeTruthy();
      expect(emailInput.disabled).toBe(true);
      expect(emailInput.value).toBe('john.doe@example.com');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark firstName as required', () => {
      const control = component.profileForm.get('firstName');
      control?.setValue('');
      control?.markAsTouched();

      expect(control?.errors?.['required']).toBeTruthy();
    });

    it('should mark lastName as required', () => {
      const control = component.profileForm.get('lastName');
      control?.setValue('');
      control?.markAsTouched();

      expect(control?.errors?.['required']).toBeTruthy();
    });

    it('should allow empty phone number', () => {
      const control = component.profileForm.get('phoneNumber');
      control?.setValue('');

      expect(control?.valid).toBe(true);
    });

    it('should disable submit button when form is invalid', fakeAsync(() => {
      profileSubject.next(mockProfile);
      tick();
      fixture.detectChanges();

      component.profileForm.get('firstName')?.setValue('');
      component.profileForm.markAsDirty();
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('.btn-primary');
      expect(submitBtn.disabled).toBe(true);
    }));

    it('should disable submit button when form is pristine', fakeAsync(() => {
      profileSubject.next(mockProfile);
      tick();
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('.btn-primary');
      expect(submitBtn.disabled).toBe(true);
    }));

    it('should enable submit button when form is valid and dirty', fakeAsync(() => {
      profileSubject.next(mockProfile);
      tick();
      fixture.detectChanges();

      component.profileForm.get('firstName')?.setValue('Jane');
      component.profileForm.markAsDirty();
      fixture.detectChanges();

      const submitBtn = fixture.nativeElement.querySelector('.btn-primary');
      expect(submitBtn.disabled).toBe(false);
    }));
  });

  describe('Form Submission', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      profileSubject.next(mockProfile);
      tick();
    }));

    it('should dispatch UpdateProfile action on valid submit', () => {
      spyOn(store, 'dispatch');

      component.profileForm.patchValue({
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+9876543210'
      });

      component.onSubmit();

      expect(store.dispatch).toHaveBeenCalledWith(
        jasmine.any(UpdateProfile)
      );
    });

    it('should not dispatch action when form is invalid', () => {
      spyOn(store, 'dispatch');

      component.profileForm.get('firstName')?.setValue('');
      component.onSubmit();

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should include form values in UpdateProfile action', () => {
      spyOn(store, 'dispatch');

      component.profileForm.patchValue({
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+9876543210',
        profileImageUrl: 'https://example.com/avatar.jpg'
      });

      component.onSubmit();

      const dispatchCall = (store.dispatch as jasmine.Spy).calls.mostRecent();
      const action = dispatchCall.args[0] as UpdateProfile;
      
      expect(action.payload.firstName).toBe('Jane');
      expect(action.payload.lastName).toBe('Smith');
    });
  });

  describe('Form Reset', () => {
    it('should reset form to original values on cancel', fakeAsync(() => {
      fixture.detectChanges();
      profileSubject.next(mockProfile);
      tick();

      // Modify form
      component.profileForm.get('firstName')?.setValue('Modified');
      component.profileForm.markAsDirty();

      // Reset
      component.resetForm();
      tick();

      expect(component.profileForm.get('firstName')?.value).toBe('John');
      expect(component.profileForm.pristine).toBe(true);
    }));
  });

  describe('Loading State UI', () => {
    it('should show loading spinner when loading', fakeAsync(() => {
      fixture.detectChanges();
      profileSubject.next(mockProfile);
      loadingSubject.next(true);
      tick();
      fixture.detectChanges();

      const loading = fixture.nativeElement.querySelector('.loading');
      expect(loading).toBeTruthy();
      expect(loading.textContent).toContain('Saving');
    }));

    it('should hide form when loading', fakeAsync(() => {
      fixture.detectChanges();
      profileSubject.next(mockProfile);
      tick();
      fixture.detectChanges();

      // Form should be visible when not loading
      let form = fixture.nativeElement.querySelector('form');
      expect(form).toBeTruthy();

      loadingSubject.next(true);
      tick();
      fixture.detectChanges();

      // Form should be hidden when loading
      form = fixture.nativeElement.querySelector('form');
      expect(form).toBeFalsy();
    }));
  });

  describe('Helper Methods', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      profileSubject.next(mockProfile);
      tick();
    }));

    it('should generate correct initials', () => {
      const initials = component.getInitials(mockProfile);
      expect(initials).toBe('JD');
    });

    it('should format member since date correctly', () => {
      const memberSince = component.getMemberSince(mockProfile);
      expect(memberSince).toContain('Jan');
      expect(memberSince).toContain('2023');
    });
  });

  describe('Loyalty Badge Styles', () => {
    it('should apply correct class for Silver tier', fakeAsync(() => {
      fixture.detectChanges();
      profileSubject.next(mockProfile);
      tick();
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.loyalty-badge');
      expect(badge.classList).toContain('silver');
    }));

    it('should apply correct class for Gold tier', fakeAsync(() => {
      const goldProfile = { ...mockProfile, loyaltyTier: LoyaltyTier.Gold };
      fixture.detectChanges();
      profileSubject.next(goldProfile);
      tick();
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.loyalty-badge');
      expect(badge.classList).toContain('gold');
    }));

    it('should apply correct class for Platinum tier', fakeAsync(() => {
      const platinumProfile = { ...mockProfile, loyaltyTier: LoyaltyTier.Platinum };
      fixture.detectChanges();
      profileSubject.next(platinumProfile);
      tick();
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.loyalty-badge');
      expect(badge.classList).toContain('platinum');
    }));
  });

  describe('Profile Image Display', () => {
    it('should show avatar image when profileImageUrl exists', fakeAsync(() => {
      const profileWithImage = { 
        ...mockProfile, 
        profileImageUrl: 'https://example.com/avatar.jpg' 
      };
      
      fixture.detectChanges();
      profileSubject.next(profileWithImage);
      tick();
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('.avatar img');
      expect(img).toBeTruthy();
      expect(img.src).toBe('https://example.com/avatar.jpg');
    }));

    it('should show placeholder when no profileImageUrl', fakeAsync(() => {
      fixture.detectChanges();
      profileSubject.next(mockProfile);
      tick();
      fixture.detectChanges();

      const placeholder = fixture.nativeElement.querySelector('.avatar-placeholder');
      expect(placeholder).toBeTruthy();
    }));
  });
});
