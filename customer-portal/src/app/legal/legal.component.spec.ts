import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { LegalComponent } from './legal.component';
import { LocalizationService } from '../shared/services/localization.service';

describe('LegalComponent', () => {
  let component: LegalComponent;
  let fixture: ComponentFixture<LegalComponent>;
  let mockLocalization: jasmine.SpyObj<LocalizationService>;

  const mockTermsContent = {
    title: 'Terms of Service',
    lastUpdated: 'May 10, 2026',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By accessing or using MyFoodDelivery you agree...' },
      { heading: '2. Use of the Service', body: 'You must be at least 18 years old...' }
    ]
  };

  const mockPrivacyContent = {
    title: 'Privacy Policy',
    lastUpdated: 'May 10, 2026',
    sections: [
      { heading: '1. Information We Collect', body: 'We collect information you provide...' },
      { heading: '2. How We Use Your Information', body: 'We use your information to process orders...' }
    ]
  };

  function createComponent(pageType: 'terms' | 'privacy' = 'terms') {
    mockLocalization = jasmine.createSpyObj('LocalizationService', ['loadTranslations', 'getLegalContent']);
    mockLocalization.loadTranslations.and.returnValue(of({}));
    mockLocalization.getLegalContent.and.callFake((type: 'terms' | 'privacy') => {
      return type === 'terms' ? mockTermsContent : mockPrivacyContent;
    });

    TestBed.configureTestingModule({
      imports: [LegalComponent, RouterTestingModule],
      providers: [
        { provide: LocalizationService, useValue: mockLocalization },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { page: pageType }
            }
          }
        }
      ]
    });

    fixture = TestBed.createComponent(LegalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Terms of Service Page', () => {
    beforeEach(() => {
      createComponent('terms');
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set pageType to terms', () => {
      expect(component.pageType).toBe('terms');
    });

    it('should load terms content from localization', fakeAsync(() => {
      tick();
      expect(mockLocalization.loadTranslations).toHaveBeenCalledWith('en');
      expect(mockLocalization.getLegalContent).toHaveBeenCalledWith('terms');
    }));

    it('should display terms title', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(component.title).toBe('Terms of Service');
    }));

    it('should display last updated date', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(component.lastUpdated).toBe('May 10, 2026');
    }));

    it('should have sections array', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(component.sections.length).toBe(2);
    }));

    it('should render section headings', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const headings = fixture.nativeElement.querySelectorAll('h2');
      expect(headings.length).toBe(2);
      expect(headings[0].textContent).toContain('1. Acceptance of Terms');
    }));

    it('should set loading to false after content loads', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(component.loading).toBe(false);
    }));
  });

  describe('Privacy Policy Page', () => {
    beforeEach(() => {
      createComponent('privacy');
    });

    it('should set pageType to privacy', () => {
      expect(component.pageType).toBe('privacy');
    });

    it('should load privacy content from localization', fakeAsync(() => {
      tick();
      expect(mockLocalization.getLegalContent).toHaveBeenCalledWith('privacy');
    }));

    it('should display privacy policy title', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      expect(component.title).toBe('Privacy Policy');
    }));

    it('should render privacy sections', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const headings = fixture.nativeElement.querySelectorAll('h2');
      expect(headings[0].textContent).toContain('1. Information We Collect');
    }));
  });

  describe('Loading State', () => {
    beforeEach(() => {
      createComponent('terms');
    });

    it('should show loading initially', () => {
      component.loading = true;
      fixture.detectChanges();
      const loadingEl = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingEl).toBeTruthy();
    });

    it('should hide content while loading', () => {
      component.loading = true;
      fixture.detectChanges();
      const contentEl = fixture.nativeElement.querySelector('.legal-content');
      expect(contentEl).toBeFalsy();
    });

    it('should show content after loading', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const contentEl = fixture.nativeElement.querySelector('.legal-content');
      expect(contentEl).toBeTruthy();
    }));
  });

  describe('Navigation', () => {
    beforeEach(() => {
      createComponent('terms');
    });

    it('should have back link to register', fakeAsync(() => {
      tick();
      fixture.detectChanges();
      const backLink = fixture.nativeElement.querySelector('a[routerLink="/register"]');
      expect(backLink).toBeTruthy();
    }));
  });
});
