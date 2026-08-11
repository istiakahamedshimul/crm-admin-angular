import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { environment } from '../environments/environment';
import { VoiceService } from './core/voice.service';

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

            <a *ngIf="auth.hasRole('SuperAdmin')" routerLink="/users" routerLinkActive="active">
              <span>S</span>
              Sales Accounts
            </a>
            <a *ngIf="auth.hasRole('SuperAdmin')" routerLink="/access-control" routerLinkActive="active"><span>A</span>Access Control</a>
            <a *ngIf="auth.hasRole('SuperAdmin')" routerLink="/admin-users" routerLinkActive="active"><span>U</span>Admin Users</a>

            <a *ngIf="auth.hasPermission('leads.manage')" routerLink="/leads" routerLinkActive="active">
              <span>L</span>
              Leads
            </a>

            <a *ngIf="auth.hasPermission('leads.manage')" routerLink="/followups" routerLinkActive="active">
              <span>F</span>
              Follow-ups
            </a>

            <a *ngIf="auth.hasPermission('customers.view')" routerLink="/customers" routerLinkActive="active">
              <span>C</span>
              Customers
            </a>
            <a *ngIf="auth.hasPermission('agreements.manage','payments.view')" routerLink="/financials" routerLinkActive="active"><span>F</span>Financials</a>

            <a *ngIf="auth.hasRole('SuperAdmin','Admin')" routerLink="/properties/projects" routerLinkActive="active">
              <span>P</span>
              Projects
            </a>

            <a *ngIf="auth.hasPermission('transportation.manage')" routerLink="/transport/requests" routerLinkActive="active">
              <span>V</span>
              Transport
            </a>
            <div *ngIf="auth.hasPermission('transportation.manage')" class="sidebar-subnav">
              <a routerLink="/transport/requests" routerLinkActive="active">Requests</a>
              <a routerLink="/transport/schedule" routerLinkActive="active">Schedule Visit</a>
              <a routerLink="/transport/vehicles" routerLinkActive="active">Vehicles</a>
            </div>

            <a *ngIf="auth.hasPermission('payments.view')" routerLink="/payments" routerLinkActive="active">
              <span>M</span>
              Collections
            </a>
            <div *ngIf="auth.hasPermission('payments.view')" class="sidebar-subnav">
              <a routerLink="/payments" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Collection Dashboard</a>
              <a *ngIf="auth.hasPermission('payments.record')" routerLink="/payments/record" routerLinkActive="active">Add Payment</a>
            </div>
            <a *ngIf="auth.hasPermission('notifications.manage')" routerLink="/notifications" routerLinkActive="active"><span>N</span>Notifications</a>

            <a *ngIf="auth.hasPermission('payments.view')" routerLink="/commissions" routerLinkActive="active">
              <span>W</span>
              Commissions
            </a>

            <a *ngIf="auth.hasPermission('reports.view')" routerLink="/reports" routerLinkActive="active">
              <span>R</span>
              Reports
            </a>
            <a *ngIf="auth.hasPermission('reports.view')" routerLink="/daily-work-reports" routerLinkActive="active"><span>D</span>Daily Work Reports</a>

            <a *ngIf="auth.hasPermission('leads.manage')" routerLink="/employee-locations" routerLinkActive="active">
              <span>⌖</span>
              Field Locations
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

            <!-- Voice Command Assistant Controls -->
            <div class="voice-controls-wrapper">
              <!-- Live Listening/Processing Status Info -->
              <div class="voice-status-indicator" *ngIf="(voiceService.listening$ | async) || (voiceService.processing$ | async) || (voiceService.error$ | async)">
                <span class="status-pulse" *ngIf="voiceService.listening$ | async"></span>
                <span class="status-text">
                  {{ (voiceService.listening$ | async) ? 'Listening...' : 
                     (voiceService.processing$ | async) ? 'Processing...' : 
                     (voiceService.error$ | async) }}
                </span>
              </div>

              <!-- English / Bengali Language toggle switch -->
              <button type="button" class="lang-switch-btn" (click)="voiceService.toggleLanguage()" title="Change speech language">
                {{ voiceService.language === 'en' ? 'EN' : 'বাংলা' }}
              </button>

              <!-- Main Pulsating Microphone Button -->
              <button type="button" class="mic-btn" 
                [class.listening]="voiceService.listening$ | async" 
                [class.processing]="voiceService.processing$ | async" 
                (click)="toggleListening()" 
                [title]="(voiceService.listening$ | async) ? 'Stop Listening' : 'Start Voice Assistant'">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="mic-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
                <span class="mic-ripple" *ngIf="voiceService.listening$ | async"></span>
              </button>
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
  `,
  styles: [`
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .voice-controls-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
    }

    .lang-switch-btn {
      min-height: 32px;
      height: 32px;
      padding: 0 12px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 8px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid var(--line);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .lang-switch-btn:hover {
      background: #e2e8f0;
      color: var(--text-dark);
      border-color: #cbd5e1;
    }

    .mic-btn {
      position: relative;
      min-height: 38px;
      height: 38px;
      width: 38px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid var(--line);
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mic-btn:hover {
      background: rgba(15, 118, 110, 0.06);
      color: var(--brand);
      border-color: rgba(15, 118, 110, 0.3);
      transform: scale(1.05);
    }

    .mic-btn.listening {
      background: #fef2f2;
      color: var(--danger-dark);
      border-color: rgba(239, 68, 68, 0.3);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.2);
    }

    .mic-btn.processing {
      background: #eff6ff;
      color: var(--accent);
      border-color: rgba(59, 130, 246, 0.3);
      animation: pulseBlue 1.2s infinite ease-in-out;
    }

    .mic-icon {
      width: 18px;
      height: 18px;
      position: relative;
      z-index: 2;
    }

    .mic-ripple {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid rgba(239, 68, 68, 0.4);
      animation: micPulse 1.5s infinite ease-out;
      pointer-events: none;
    }

    @keyframes micPulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    @keyframes pulseBlue {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }

    .voice-status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid var(--line);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      animation: fadeIn 0.2s ease-out;
      box-shadow: var(--shadow);
    }

    .status-pulse {
      width: 6px;
      height: 6px;
      background: var(--danger);
      border-radius: 50%;
      animation: statusPulse 1s infinite alternate;
    }

    @keyframes statusPulse {
      0% { opacity: 0.4; }
      100% { opacity: 1; }
    }

    .status-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 2000;
      display: grid;
      place-items: center;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }

    .performance-modal-box {
      width: min(520px, 100%);
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.05);
      border: 1px solid var(--line);
      animation: modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes modalScaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }

    .header-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .header-main h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--text-dark);
    }

    .header-main h2::before {
      display: none;
    }

    .tag-badge {
      font-size: 10px;
      font-weight: 700;
      color: var(--brand-dark);
      background: var(--brand-light);
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      width: fit-content;
    }

    .close-btn {
      height: 32px;
      min-height: 32px;
      padding: 0 12px;
      font-size: 13px;
    }

    .modal-stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .modal-stat-card {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: #f8fafc;
      transition: transform 0.2s ease;
    }

    .modal-stat-card:hover {
      transform: translateY(-1px);
    }

    .leads-card {
      grid-column: span 2;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.01) 100%);
      border-color: rgba(99, 102, 241, 0.15);
    }

    .success-card {
      background: linear-gradient(135deg, var(--success-bg) 0%, rgba(16, 185, 129, 0.01) 100%);
      border-color: rgba(16, 185, 129, 0.15);
    }

    .warning-card {
      background: linear-gradient(135deg, var(--warning-bg) 0%, rgba(245, 158, 11, 0.01) 100%);
      border-color: rgba(245, 158, 11, 0.15);
    }

    .danger-card {
      background: linear-gradient(135deg, var(--danger-bg) 0%, rgba(239, 68, 68, 0.01) 100%);
      border-color: rgba(239, 68, 68, 0.15);
    }

    .slate-card {
      background: linear-gradient(135deg, #f1f5f9 0%, rgba(148, 163, 184, 0.01) 100%);
      border-color: rgba(148, 163, 184, 0.15);
    }

    .stat-label {
      font-size: 11px;
      color: var(--muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-dark);
    }

    .leads-card .stat-value {
      font-size: 24px;
      color: #4f46e5;
    }

    .success-card .stat-value { color: var(--success-dark); }
    .warning-card .stat-value { color: var(--warning-dark); }
    .danger-card .stat-value { color: var(--danger-dark); }
    .slate-card .stat-value { color: #475569; }

    /* Narrative Section */
    .report-narrative-section {
      background: #f8fafc;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 16px;
    }

    .report-narrative-section h3 {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-dark);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      margin-top: 0;
    }

    .narrative-text {
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
      margin: 0 0 14px 0;
    }

    .replay-btn {
      min-height: 34px;
      height: 34px;
      padding: 0 12px;
      font-size: 12px;
      border-radius: 8px;
      background: var(--brand-light);
      color: var(--brand-dark);
      border: 1px solid rgba(15, 118, 110, 0.2);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .replay-btn:hover {
      background: var(--brand);
      color: white;
      border-color: var(--brand);
      transform: translateY(-1px);
    }

    .replay-icon {
      width: 14px;
      height: 14px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  voiceService = inject(VoiceService);
  private router = inject(Router);

  swaggerUrl = environment.swaggerUrl;

  toggleListening() {
    this.voiceService.listening$.subscribe(listening => {
      if (listening) {
        this.voiceService.stopListening();
      } else {
        this.voiceService.startListening();
      }
    }).unsubscribe();
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
