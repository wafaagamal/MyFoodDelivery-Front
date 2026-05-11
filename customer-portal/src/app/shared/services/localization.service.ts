import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private translations: Record<string, unknown> = {};
  private loaded$ = new BehaviorSubject<boolean>(false);
  private currentLang = 'en';

  constructor(private http: HttpClient) {}

  loadTranslations(lang: string = 'en'): Observable<Record<string, unknown>> {
    this.currentLang = lang;
    return this.http.get<Record<string, unknown>>(`/assets/i18n/${lang}.json`).pipe(
      tap(data => {
        this.translations = data;
        this.loaded$.next(true);
      }),
      catchError(err => {
        console.error('Failed to load translations:', err);
        return of({});
      })
    );
  }

  isLoaded(): Observable<boolean> {
    return this.loaded$.asObservable();
  }

  get<T>(key: string): T | undefined {
    const keys = key.split('.');
    let result: unknown = this.translations;

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }

    return result as T;
  }

  getLegalContent(pageType: 'terms' | 'privacy'): { title: string; lastUpdated: string; sections: { heading: string; body: string }[] } | undefined {
    return this.get<{ title: string; lastUpdated: string; sections: { heading: string; body: string }[] }>(`legal.${pageType}`);
  }

  getCommon(key: string): string {
    return this.get<string>(`common.${key}`) ?? key;
  }

  getAuth(key: string): string {
    return this.get<string>(`auth.${key}`) ?? key;
  }

  getRoles(key: string): string {
    return this.get<string>(`roles.${key}`) ?? key;
  }
}
