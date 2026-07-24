import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { DashboardSummary } from '../../models/crm.models';
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
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <!-- Visual Dashboard Banner -->
    <div class="dashboard-banner">
      <div class="banner-content">
        <h2>Welcome Back, Administrator</h2>
        <p>Your real estate operations are performing smoothly. The current lead-to-customer conversion rate is at <strong>{{ conversionRate }}%</strong>.</p>
      </div>
      <div class="banner-badge">
        <span>Active Console</span>
      </div>
    </div>

    <!-- Quick Action Shortcuts -->
    <section class="panel" style="margin-bottom: 24px; padding: 18px 24px;">
      <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); margin-bottom: 12px;">Quick Action Shortcuts</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
        <a routerLink="/leads" style="display: flex; align-items: center; gap: 10px; background: var(--bg); border: 1px solid var(--line); padding: 12px 16px; border-radius: 8px; font-weight: 600; text-decoration: none; color: var(--text-dark); transition: all 0.2s ease;">
          <span style="font-size: 18px;">➕</span> Create Lead
        </a>
        <a routerLink="/properties/projects" style="display: flex; align-items: center; gap: 10px; background: var(--bg); border: 1px solid var(--line); padding: 12px 16px; border-radius: 8px; font-weight: 600; text-decoration: none; color: var(--text-dark); transition: all 0.2s ease;">
          <span style="font-size: 18px;">🏗️</span> New Project
        </a>
        <a routerLink="/payments" style="display: flex; align-items: center; gap: 10px; background: var(--bg); border: 1px solid var(--line); padding: 12px 16px; border-radius: 8px; font-weight: 600; text-decoration: none; color: var(--text-dark); transition: all 0.2s ease;">
          <span style="font-size: 18px;">💳</span> Verify Collections
        </a>
        <a routerLink="/transport/schedule" style="display: flex; align-items: center; gap: 10px; background: var(--bg); border: 1px solid var(--line); padding: 12px 16px; border-radius: 8px; font-weight: 600; text-decoration: none; color: var(--text-dark); transition: all 0.2s ease;">
          <span style="font-size: 18px;">🚐</span> Schedule Visit
        </a>
      </div>
    </section>

    <section class="metric-grid">
      <article *ngFor="let card of cards" class="metric-card">
        <div class="metric-icon-wrap" [style.background]="card.bg">
          <span class="metric-icon-letter">{{ card.icon }}</span>
        </div>
        <div class="metric-body">
          <span>{{ card.label }}</span>
          <strong>{{ card.money ? formatMoney(card.value) : card.value }}</strong>
        </div>
      </article>
    </section>

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
          <div><span>Pending Commission</span><strong>{{ formatMoney(summary.pendingCommission || 0) }}</strong></div>
          <div><span>Reversed Commission</span><strong style="color:#b42318">{{ formatMoney(summary.reversedCommission || 0) }}</strong></div>
        </div>
      </article>
    </section>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  summary: DashboardSummary = {};
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

  get cards() {
    return [
      { label: 'Total Leads', value: this.summary.leads || 0, icon: 'L', bg: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
      { label: 'Positive Customers (Booked)', value: this.summary.customers || 0, icon: 'C', bg: 'linear-gradient(135deg, #ec4899, #db2777)' },
      { label: 'Projects', value: this.summary.projects || 0, icon: 'P', bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
      { label: 'Pending Collections', value: this.summary.pendingPayments || 0, icon: 'P', bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
      { label: 'Total Collection', value: this.summary.totalCollection || 0, money: true, icon: 'T', bg: 'linear-gradient(135deg, #10b981, #059669)' },
      { label: 'Reversed Collections', value: this.summary.rejectedCollectionAmount || 0, money: true, icon: 'R', bg: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
      { label: 'Paid Commission', value: this.summary.paidCommission || 0, money: true, icon: 'C', bg: 'linear-gradient(135deg, #3b82f6, #2563eb)' }
    ];
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.dashboard().subscribe((data: any) => {
      this.summary = data;
    });
  }
}
