import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="login-page">
      <section class="login-hero">
        <div class="login-brand">
          <div class="brand-mark large">RE</div>
          <span>Real Estate CRM</span>
        </div>
        <h1>Admin control for leads, sales teams, payments, and commissions.</h1>
        <p>Manage sales executives, assign leads correctly, verify collections, and keep the business flow visible from one dashboard.</p>
        
        <!-- Interactive Floating Mockup Widget -->
        <div class="hero-mockup-card" style="margin-top: 48px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; backdrop-filter: blur(8px); max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div style="display: flex; gap: 6px;">
              <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span>
              <span style="width: 8px; height: 8px; background: #fbbf24; border-radius: 50%;"></span>
              <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
            </div>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a5f3fc; font-weight: 700;">Live Analytics</span>
          </div>
          <div style="display: flex; align-items: flex-end; gap: 8px; height: 60px; margin-top: 10px;">
            <div style="flex: 1; height: 35%; background: linear-gradient(0deg, #0f766e, #0ea5e9); border-radius: 4px;"></div>
            <div style="flex: 1; height: 65%; background: linear-gradient(0deg, #0f766e, #0ea5e9); border-radius: 4px;"></div>
            <div style="flex: 1; height: 45%; background: linear-gradient(0deg, #0f766e, #0ea5e9); border-radius: 4px;"></div>
            <div style="flex: 1; height: 90%; background: linear-gradient(0deg, #0f766e, #0ea5e9); border-radius: 4px;"></div>
            <div style="flex: 1; height: 75%; background: linear-gradient(0deg, #0f766e, #0ea5e9); border-radius: 4px;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 11px; color: #64748b;">
            <span>Leads +42%</span>
            <span>Target Reached</span>
          </div>
        </div>
      </section>

      <form class="login-panel" (ngSubmit)="login()">
        <p class="eyebrow">Secure access</p>
        <h2>Admin Login</h2>
        <label>
          Email
          <input name="email" [(ngModel)]="email" autocomplete="email" placeholder="admin@realestate.com" required>
        </label>
        <label>
          Password
          <input name="password" [(ngModel)]="password" type="password" autocomplete="current-password" placeholder="••••••••" required>
        </label>
        <button type="submit" [disabled]="loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>
    </main>
  `
})
export class LoginComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';

  login() {
    this.loading = true;
    this.error = '';
    this.api.login(this.email, this.password).subscribe({
      next: response => {
        this.auth.setSession(response);
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.error = 'Login failed. Check backend, database, and credentials.';
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }
}
