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


            <!-- Visit -->
<a href="javascript:void(0)"
   (click)="showVisitMenu = !showVisitMenu">

  <span>V</span>

  Visit

  <span
    class="menu-arrow"
    [style.transform]="showVisitMenu ? 'rotate(90deg)' : 'rotate(0deg)'">
    ▶
  </span>

</a>

<div
  *ngIf="showVisitMenu"
  style="padding-left:35px;display:flex;flex-direction:column;gap:6px;">

  <a
    routerLink="/visit/booking"
    routerLinkActive="active">
    Visit Booking
  </a>

  <a
    routerLink="/visit/booking-list"
    routerLinkActive="active">
    Booking List
  </a>

</div>

 <!-- cars -->
<a routerLink="/cars" routerLinkActive="active">
    <span>C</span>
    Cars
</a>

            <!-- Projects & Units -->
            <a href="javascript:void(0)"
               (click)="showPropertyMenu = !showPropertyMenu">

              <span>P</span>

              Projects & Units

              <span
    class="menu-arrow"
    [style.transform]="showPropertyMenu ? 'rotate(90deg)' : 'rotate(0deg)'">
    ▶
</span>

            </a>

            <div
              *ngIf="showPropertyMenu"
              style="padding-left:35px;display:flex;flex-direction:column;gap:6px;">

              <a
                routerLink="/properties/projects"
                routerLinkActive="active">
                Projects
              </a>

              <a
                routerLink="/properties/units"
                routerLinkActive="active">
                Units
              </a>

            </div>

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
    showVisitMenu = true;

    showPropertyMenu = true;

    logout() {
        this.auth.logout();
        this.router.navigateByUrl('/login');
    }

}