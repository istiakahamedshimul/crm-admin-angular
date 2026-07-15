import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { environment } from '../environments/environment';

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

            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              <span>D</span>
              Dashboard
            </a>

            <a routerLink="/users" routerLinkActive="active">
              <span>S</span>
              Sales Accounts
            </a>

            <a routerLink="/leads" routerLinkActive="active">
              <span>L</span>
              Leads
            </a>

            <a routerLink="/followups" routerLinkActive="active">
              <span>F</span>
              Follow-ups
            </a>

            <a routerLink="/customers" routerLinkActive="active">
              <span>C</span>
              Customers
            </a>

            <a routerLink="/properties/projects" routerLinkActive="active">
              <span>P</span>
              Projects
            </a>

            <a routerLink="/invoices" routerLinkActive="active">
              <span>I</span>
              Invoices
            </a>

            <a routerLink="/payments" routerLinkActive="active">
              <span>M</span>
              Payments
            </a>

            <a routerLink="/commissions" routerLinkActive="active">
              <span>W</span>
              Commissions
            </a>

            <a routerLink="/reports" routerLinkActive="active">
              <span>R</span>
              Reports
            </a>

          </nav>

          <a
            class="swagger-link"
            [href]="swaggerUrl"
            target="_blank">
            API Documentation
          </a>

        </aside>

        <section class="workspace">

          <header class="topbar">

            <div>
              <p>Signed in as</p>
              <strong>{{ auth.user()?.fullName || 'CRM Admin' }}</strong>
            </div>

            <button
              type="button"
              class="ghost-button"
              (click)="logout()">
              Logout
            </button>

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

    logout() {
        this.auth.logout();
        this.router.navigateByUrl('/login');
    }

}
