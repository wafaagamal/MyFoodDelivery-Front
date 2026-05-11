import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LocalizationService } from './localization.service';

describe('LocalizationService', () => {
  let service: LocalizationService;
  let httpMock: HttpTestingController;

  const mockTranslations = {
    legal: {
      terms: {
        title: 'Terms of Service',
        lastUpdated: 'May 10, 2026',
        sections: [
          { heading: '1. Test', body: 'Test body' }
        ]
      },
      privacy: {
        title: 'Privacy Policy',
        lastUpdated: 'May 10, 2026',
        sections: [
          { heading: '1. Privacy', body: 'Privacy body' }
        ]
      }
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred'
    },
    auth: {
      login: {
        title: 'Welcome Back'
      }
    },
    roles: {
      customer: 'Customer',
      restaurant: 'Restaurant',
      driver: 'Driver'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LocalizationService]
    });

    service = TestBed.inject(LocalizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadTranslations', () => {
    it('should load translations from JSON file', () => {
      service.loadTranslations('en').subscribe(data => {
        expect(data).toEqual(mockTranslations);
      });

      const req = httpMock.expectOne('/assets/i18n/en.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockTranslations);
    });

    it('should set loaded to true after loading', () => {
      service.loadTranslations('en').subscribe();
      
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockTranslations);
      
      service.isLoaded().subscribe(loaded => {
        expect(loaded).toBe(true);
      });
    });

    it('should handle error and return empty object', () => {
      service.loadTranslations('en').subscribe(data => {
        expect(data).toEqual({});
      });

      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('get', () => {
    beforeEach((done) => {
      service.loadTranslations('en').subscribe(() => done());
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockTranslations);
    });

    it('should get nested value by dot notation key', () => {
      const result = service.get<string>('common.loading');
      expect(result).toBe('Loading...');
    });

    it('should get deeply nested value', () => {
      const result = service.get<string>('auth.login.title');
      expect(result).toBe('Welcome Back');
    });

    it('should return undefined for non-existent key', () => {
      const result = service.get<string>('nonexistent.key');
      expect(result).toBeUndefined();
    });

    it('should get object value', () => {
      const result = service.get<Record<string, string>>('roles');
      expect(result).toEqual({
        customer: 'Customer',
        restaurant: 'Restaurant',
        driver: 'Driver'
      });
    });
  });

  describe('getLegalContent', () => {
    beforeEach((done) => {
      service.loadTranslations('en').subscribe(() => done());
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockTranslations);
    });

    it('should get terms content', () => {
      const result = service.getLegalContent('terms');
      expect(result?.title).toBe('Terms of Service');
      expect(result?.sections.length).toBe(1);
    });

    it('should get privacy content', () => {
      const result = service.getLegalContent('privacy');
      expect(result?.title).toBe('Privacy Policy');
    });
  });

  describe('getCommon', () => {
    beforeEach((done) => {
      service.loadTranslations('en').subscribe(() => done());
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockTranslations);
    });

    it('should get common translation', () => {
      const result = service.getCommon('loading');
      expect(result).toBe('Loading...');
    });

    it('should return key if not found', () => {
      const result = service.getCommon('notfound');
      expect(result).toBe('notfound');
    });
  });

  describe('getAuth', () => {
    beforeEach((done) => {
      service.loadTranslations('en').subscribe(() => done());
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockTranslations);
    });

    it('should get auth translation', () => {
      const result = service.getAuth('login.title');
      expect(result).toBe('Welcome Back');
    });
  });

  describe('getRoles', () => {
    beforeEach((done) => {
      service.loadTranslations('en').subscribe(() => done());
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockTranslations);
    });

    it('should get role translation', () => {
      const result = service.getRoles('customer');
      expect(result).toBe('Customer');
    });

    it('should return key if role not found', () => {
      const result = service.getRoles('unknown');
      expect(result).toBe('unknown');
    });
  });
});
