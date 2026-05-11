import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type Step = 'request' | 'reset' | 'done';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  step: Step = 'request';

  // Step 1 – request
  email = '';
  devToken = '';       // returned by backend in dev mode
  requestLoading = false;
  requestError = '';

  // Step 2 – reset
  token = '';
  newPassword = '';
  confirmPassword = '';
  resetLoading = false;
  resetError = '';

  private readonly authBase = environment.auth.authority;

  constructor(private http: HttpClient) {}

  onRequestSubmit(): void {
    if (!this.email) { this.requestError = 'Please enter your email address.'; return; }
    this.requestLoading = true;
    this.requestError = '';

    this.http.post<{ message: string; devToken?: string }>(
      `${this.authBase}/api/account/forgot-password`,
      { email: this.email }
    ).subscribe({
      next: (res) => {
        this.requestLoading = false;
        this.devToken = res.devToken ?? '';   // populated in dev mode
        this.step = 'reset';
      },
      error: (err) => {
        this.requestLoading = false;
        this.requestError = err?.error?.message ?? 'Request failed. Please try again.';
      }
    });
  }

  onResetSubmit(): void {
    if (!this.token)           { this.resetError = 'Please paste the reset token.'; return; }
    if (!this.newPassword)     { this.resetError = 'New password is required.'; return; }
    if (this.newPassword.length < 8) { this.resetError = 'Password must be at least 8 characters.'; return; }
    if (this.newPassword !== this.confirmPassword) { this.resetError = 'Passwords do not match.'; return; }

    this.resetLoading = true;
    this.resetError = '';

    this.http.post<{ message: string }>(
      `${this.authBase}/api/account/reset-password`,
      { email: this.email, token: this.token, newPassword: this.newPassword }
    ).subscribe({
      next: () => {
        this.resetLoading = false;
        this.step = 'done';
      },
      error: (err) => {
        this.resetLoading = false;
        const errors: string[] = err?.error?.errors ?? [];
        this.resetError = errors.length
          ? errors.join(' ')
          : (err?.error?.message ?? 'Reset failed. The token may have expired.');
      }
    });
  }

  copyToken(): void {
    navigator.clipboard?.writeText(this.devToken).catch(() => {});
  }
}
