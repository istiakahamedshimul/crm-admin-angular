import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { DashboardSummary, Commission, Payment } from '../../models/crm.models';
import { money } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Overview</p>
        <h1>Admin Dashboard</h1>
        <p class="page-copy">Real-time indicators of your sales funnel, properties, and collections.</p>
      </div>
      <button type="button" class="ghost-button refresh-btn" (click)="load()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="refresh-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        <span>Refresh</span>
      </button>
    </section>

    <!-- Visual Dashboard Banner -->
    <div class="dashboard-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <span class="banner-eyebrow">System Console</span>
        <h2>Welcome Back, Administrator</h2>
        <p>Operations are running smoothly. The current lead-to-customer conversion rate is at <strong>{{ conversionRate }}%</strong>.</p>
      </div>
      <div class="banner-metrics">
        <div class="banner-metric-pill">
          <span class="pulse-indicator"></span>
          <span>Live Session</span>
        </div>
      </div>
    </div>

    <!-- Quick Action Shortcuts -->
    <section class="quick-shortcuts-panel">
      <span class="section-tag">Quick Actions</span>
      <div class="shortcuts-grid">
        <a routerLink="/leads" class="shortcut-card">
          <div class="shortcut-icon-bg leads-bg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
          <div class="shortcut-info">
            <strong>Create Lead</strong>
            <span>Add a new lead to the CRM</span>
          </div>
        </a>
        <a routerLink="/properties/projects" class="shortcut-card">
          <div class="shortcut-icon-bg projects-bg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.203 0-4.361.152-6.475.445V21M3 21h18M12 11.25H12.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div class="shortcut-info">
            <strong>New Project</strong>
            <span>Create property listings</span>
          </div>
        </a>
        <a routerLink="/payments" class="shortcut-card">
          <div class="shortcut-icon-bg collections-bg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <div class="shortcut-info">
            <strong>Verify Collections</strong>
            <span>Review payment receipts</span>
          </div>
        </a>
        <a routerLink="/transport/schedule" class="shortcut-card">
          <div class="shortcut-icon-bg transport-bg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125a1.125 1.125 0 0 0 1.125-1.125V9.75M8.25 4.5h8.25a8.967 8.967 0 0 1 7.305 3.75M8.25 4.5 1.5 12m7.5-7.5v3.75M22.5 12h-9m9 0a8.967 8.967 0 0 1-4.5 7.75M12.75 12h-9m0 0 7.5 6.75M12.75 12v3.75m0 0H8.25m4.5 0h4.5" />
            </svg>
          </div>
          <div class="shortcut-info">
            <strong>Schedule Visit</strong>
            <span>Set up client vehicle transport</span>
          </div>
        </a>
      </div>
    </section>

    <!-- Visual Dashboard Metrics Cards -->
    <section class="metric-grid-dashboard">
      <!-- Total Leads -->
      <article class="dashboard-metric-card">
        <div class="icon-wrapper leads-theme">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 12.75 0ZM15 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6.75 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <div class="body-wrapper">
          <span class="card-label">Total Leads</span>
          <strong class="card-val">{{ summary.leads || 0 }}</strong>
        </div>
      </article>

      <!-- Booked Customers -->
      <article class="dashboard-metric-card">
        <div class="icon-wrapper customers-theme">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
          </svg>
        </div>
        <div class="body-wrapper">
          <span class="card-label">Booked Customers</span>
          <strong class="card-val">{{ summary.customers || 0 }}</strong>
        </div>
      </article>

      <!-- Active Projects -->
      <article class="dashboard-metric-card">
        <div class="icon-wrapper projects-theme">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.203 0-4.361.152-6.475.445V21M3 21h18M12 11.25H12.008v.008H12v-.008Z" />
          </svg>
        </div>
        <div class="body-wrapper">
          <span class="card-label">Active Projects</span>
          <strong class="card-val">{{ summary.projects || 0 }}</strong>
        </div>
      </article>

      <!-- Pending Collections (Shown as "Collection" amount) -->
      <article class="dashboard-metric-card">
        <div class="icon-wrapper pending-collections-theme">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.708.282.115-.03a.5.5 0 0 0 .277-.61l-.424-1.272a.5.5 0 0 0-.61-.277l-.708.282m3.056.818.708-.282.115.03a.5.5 0 0 1 .277.61l-.424 1.272a.5.5 0 0 1-.61.277l-.708-.282m0-3.056a1.5 1.5 0 0 0-2.029 2.029l.708-.282m0-1.747-.708.282M12 6.75V18.75m0-12H9.75M12 6.75h2.25M12 18.75v-1.125" />
          </svg>
        </div>
        <div class="body-wrapper">
          <span class="card-label">Collection</span>
          <strong class="card-val">{{ formatMoney(pendingCollectionsSum) }}</strong>
        </div>
      </article>

      <!-- This Month Collection (Clickable Card Linked to payments/collections) -->
      <a routerLink="/payments" class="dashboard-metric-card clickable-card">
        <div class="icon-wrapper collections-theme">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75m-.75-1.5h1.5m-1.5 15h1.5m-1.5-1.5v1.5m15-15h1.5m-1.5 0v1.5m-1.5 15h1.5m0-1.5v1.5M6 7.5h12M6 12h12m-9 4.5h6" />
          </svg>
        </div>
        <div class="body-wrapper">
          <div class="label-with-hint">
            <span class="card-label">Collection (This Month)</span>
            <span class="hint-badge">Click to Filter</span>
          </div>
          <strong class="card-val text-brand">{{ formatMoney(summary.totalCollection) }}</strong>
        </div>
      </a>

      <!-- Commission (This Month) -->
      <article class="dashboard-metric-card">
        <div class="icon-wrapper commissions-theme">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
        </div>
        <div class="body-wrapper">
          <span class="card-label">Commission (This Month)</span>
          <strong class="card-val text-success">{{ formatMoney(commissionThisMonth) }}</strong>
        </div>
      </article>
    </section>

    <!-- Detail Progress Charts Section -->
    <section class="two-column">
      <article class="panel">
        <h2>Funnel Conversion</h2>
        <p class="panel-desc">Visualizing conversion of manual and automated leads into closed customers.</p>
        
        <div class="pipeline-progress">
          <div class="progress-info">
            <span>Leads converted to Customers</span>
            <strong>{{ conversionRate }}%</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" [style.width.%]="conversionRate"></div>
          </div>
        </div>

        <div class="pipeline">
          <div><span>Total Leads</span><strong>{{ summary.leads || 0 }}</strong></div>
          <div><span>Positive Customers (Booked)</span><strong>{{ summary.customers || 0 }}</strong></div>
        </div>
      </article>

      <article class="panel">
        <h2>Collections Control</h2>
        <p class="panel-desc">Distribution of submitted and verified collections.</p>

        <div class="pipeline-progress">
          <div class="progress-info">
            <span>Collection Approval Rate</span>
            <strong>{{ paymentApprovalRate }}%</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill success" [style.width.%]="paymentApprovalRate"></div>
          </div>
        </div>

        <div class="pipeline">
          <div><span>Pending Approvals</span><strong>{{ summary.pendingPayments || 0 }}</strong></div>
          <div><span>Approved Count</span><strong>{{ summary.approvedPayments || 0 }}</strong></div>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .refresh-btn {
      height: 38px;
      min-height: 38px;
      padding: 0 14px;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .refresh-icon {
      width: 16px;
      height: 16px;
      transition: transform 0.4s ease;
    }

    .refresh-btn:hover .refresh-icon {
      transform: rotate(180deg);
    }

    /* Welcoming Banner */
    .dashboard-banner {
      position: relative;
      background: linear-gradient(135deg, #090d16 0%, #1e293b 100%);
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      overflow: hidden;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #fff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .banner-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 80% 20%, rgba(15, 118, 110, 0.15) 0%, transparent 50%);
      pointer-events: none;
    }

    .banner-content {
      position: relative;
      z-index: 1;
      max-width: 60%;
    }

    .banner-eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      color: var(--brand);
      display: block;
      margin-bottom: 8px;
    }

    .banner-content h2 {
      color: #fff;
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .banner-content p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    .banner-content p strong {
      color: #fff;
      font-weight: 700;
    }

    .banner-metrics {
      position: relative;
      z-index: 1;
    }

    .banner-metric-pill {
      background: rgba(15, 118, 110, 0.15);
      border: 1px solid rgba(15, 118, 110, 0.3);
      padding: 8px 16px;
      border-radius: 99px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #06b6d4;
    }

    .pulse-indicator {
      width: 8px;
      height: 8px;
      background: #06b6d4;
      border-radius: 50%;
      position: relative;
    }

    .pulse-indicator::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid #06b6d4;
      animation: pulse 1.8s infinite ease-in-out;
      opacity: 0;
    }

    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 0; }
      50% { opacity: 0.5; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* Quick Action Shortcuts */
    .quick-shortcuts-panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow);
    }

    .section-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--muted);
      display: block;
      margin-bottom: 14px;
    }

    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
    }

    .shortcut-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--panel);
      border: 1px solid var(--line);
      padding: 14px 18px;
      border-radius: 12px;
      text-decoration: none;
      color: var(--text-dark);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .shortcut-card:hover {
      transform: translateY(-2px);
      border-color: var(--brand);
      box-shadow: 0 10px 15px -3px rgba(15, 118, 110, 0.05), 0 0 0 1px rgba(15, 118, 110, 0.1);
    }

    .shortcut-icon-bg {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .shortcut-icon-bg svg {
      width: 20px;
      height: 20px;
    }

    .leads-bg { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
    .projects-bg { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .collections-bg { background: rgba(15, 118, 110, 0.1); color: var(--brand); }
    .transport-bg { background: rgba(249, 115, 22, 0.1); color: #f97316; }

    .shortcut-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .shortcut-info strong {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-dark);
    }

    .shortcut-info span {
      font-size: 11px;
      color: var(--muted);
      font-weight: 500;
    }

    /* Metric Cards Grid */
    .metric-grid-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .dashboard-metric-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .dashboard-metric-card::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .dashboard-metric-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-hover);
    }

    .dashboard-metric-card:hover::after {
      opacity: 1;
    }

    .clickable-card {
      cursor: pointer;
      text-decoration: none;
    }

    .clickable-card::after {
      background: linear-gradient(90deg, var(--brand), #0ea5e9);
    }

    .clickable-card:hover {
      border-color: rgba(15, 118, 110, 0.3);
    }

    .icon-wrapper {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-wrapper svg {
      width: 24px;
      height: 24px;
    }

    .leads-theme { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
    .dashboard-metric-card:nth-of-type(1)::after { background: #6366f1; }

    .customers-theme { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
    .dashboard-metric-card:nth-of-type(2)::after { background: #ec4899; }

    .projects-theme { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .dashboard-metric-card:nth-of-type(3)::after { background: #8b5cf6; }

    .pending-collections-theme { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .dashboard-metric-card:nth-of-type(4)::after { background: #f59e0b; }

    .collections-theme { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .dashboard-metric-card:nth-of-type(5)::after { background: #10b981; }

    .commissions-theme { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .dashboard-metric-card:nth-of-type(6)::after { background: #3b82f6; }

    .body-wrapper {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .card-label {
      font-size: 11px;
      color: var(--muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-val {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-dark);
      margin-top: 4px;
      letter-spacing: -0.5px;
    }

    .text-brand {
      color: var(--brand-dark);
    }

    .label-with-hint {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .hint-badge {
      font-size: 9px;
      font-weight: 700;
      color: var(--brand);
      background: var(--brand-light);
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      transition: all 0.2s ease;
    }

    .clickable-card:hover .hint-badge {
      background: var(--brand);
      color: white;
    }

    /* Split value commissions styling */
    .double-value-card {
      align-items: flex-start;
    }

    .commissions-split-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 6px;
    }

    .split-col {
      display: flex;
      flex-direction: column;
    }

    .split-label {
      font-size: 10px;
      color: var(--muted);
      font-weight: 600;
    }

    .split-val {
      font-size: 15px;
      font-weight: 800;
      margin-top: 1px;
    }

    .split-divider {
      align-self: stretch;
      width: 1px;
      background: var(--line);
    }

    .text-success { color: var(--success-dark); }
    .text-warning { color: var(--warning-dark); }

    /* Funnel & Conversion progress items */
    .pipeline-progress {
      margin: 18px 0;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-info span {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }

    .progress-info strong {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-dark);
    }

    .progress-bar-bg {
      height: 8px;
      background: #f1f5f9;
      border-radius: 99px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--brand), #0ea5e9);
      border-radius: 99px;
      transition: width 0.8s ease-in-out;
    }

    .progress-bar-fill.success {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .panel-desc {
      color: var(--muted);
      font-size: 12px;
      margin-top: -12px;
      margin-bottom: 16px;
    }

    /* Small pipeline modifications */
    .pipeline {
      margin-top: 16px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  summary: DashboardSummary = {};
  commissionsList: Commission[] = [];
  paymentsList: Payment[] = [];
  formatMoney = money;

  get conversionRate() {
    const leads = this.summary.leads || 0;
    const customers = this.summary.customers || 0;
    return leads ? Math.round((customers / leads) * 100) : 0;
  }

  get paymentApprovalRate() {
    const approved = this.summary.approvedPayments || 0;
    const pending = this.summary.pendingPayments || 0;
    const total = approved + pending;
    return total ? Math.round((approved / total) * 100) : 0;
  }

  get commissionThisMonth(): number {
    const now = new Date();
    return this.commissionsList
      .filter(c => {
        const date = new Date(c.createdAt);
        return c.status !== 2 &&
               date.getFullYear() === now.getFullYear() &&
               date.getMonth() === now.getMonth();
      })
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  get pendingCollectionsSum(): number {
    return this.paymentsList
      .filter(p => p.status === 0)
      .reduce((sum, p) => sum + Math.abs(p.amount || 0), 0);
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.dashboard().subscribe((data: any) => {
      this.summary = data;
    });
    this.api.commissions().subscribe((data: Commission[]) => {
      this.commissionsList = data;
    });
    this.api.payments().subscribe((data: Payment[]) => {
      this.paymentsList = data;
    });
  }
}
