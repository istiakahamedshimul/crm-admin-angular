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
      </section>

      <form class="login-panel" (ngSubmit)="login()">
        <p class="eyebrow">Secure access</p>
        <h2>Admin Login</h2>
        <label>Email<input name="email" [(ngModel)]="email" autocomplete="email"></label>
        <label>Password<input name="password" [(ngModel)]="password" type="password" autocomplete="current-password"></label>
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

  email = 'admin@crm.local';
  password = 'Admin@12345';
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
