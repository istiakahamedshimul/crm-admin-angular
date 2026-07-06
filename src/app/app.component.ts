import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { environment } from '../environments/environment';

type NavItem = {
  label: string;
  route: string;
  icon: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ng-container *ngIf="auth.isLoggedIn(); else publicPage">
      <main class="app-shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-mark">RE</div>
            <div>
              <strong>Estate CRM</strong>
              <span>Admin Console</span>
            </div>
          </div>

          <nav>
            <a *ngFor="let item of nav" [routerLink]="item.route" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.route === '/' }">
              <span>{{ item.icon }}</span>
              {{ item.label }}
            </a>
          </nav>

          <a class="swagger-link" [href]="swaggerUrl" target="_blank">API Documentation</a>
        </aside>

        <section class="workspace">
          <header class="topbar">
            <div>
              <p>Signed in as</p>
              <strong>{{ auth.user()?.fullName || 'CRM Admin' }}</strong>
            </div>
            <button type="button" class="ghost-button" (click)="logout()">Logout</button>
          </header>

          <router-outlet></router-outlet>
        </section>
      </main>
    </ng-container>

    <ng-template #publicPage>
      <router-outlet></router-outlet>
    </ng-template>
  `
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  swaggerUrl = environment.swaggerUrl;

  nav: NavItem[] = [
    { label: 'Dashboard', route: '/', icon: 'D' },
    { label: 'Sales Accounts', route: '/users', icon: 'S' },
    { label: 'Leads', route: '/leads', icon: 'L' },
    { label: 'Follow-ups', route: '/followups', icon: 'F' },
    { label: 'Customers', route: '/customers', icon: 'C' },
    { label: 'Projects & Units', route: '/properties', icon: 'P' },
    { label: 'Invoices', route: '/invoices', icon: 'I' },
    { label: 'Payments', route: '/payments', icon: 'M' },
    { label: 'Commissions', route: '/commissions', icon: 'W' },
    { label: 'Reports', route: '/reports', icon: 'R' }
  ];

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
