import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { DashboardSummary } from '../../models/crm.models';
import { money } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Overview</p>
        <h1>Admin Dashboard</h1>
      </div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <section class="metric-grid">
      <article *ngFor="let card of cards" class="metric-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.money ? formatMoney(card.value) : card.value }}</strong>
      </article>
    </section>

    <section class="two-column">
      <article class="panel">
        <h2>Lead Pipeline</h2>
        <div class="pipeline">
          <div><span>Total Leads</span><strong>{{ summary.leads || 0 }}</strong></div>
          <div><span>Customers</span><strong>{{ summary.customers || 0 }}</strong></div>
          <div><span>Available Units</span><strong>{{ summary.availableUnits || 0 }}</strong></div>
        </div>
      </article>
      <article class="panel">
        <h2>Payment Control</h2>
        <div class="pipeline">
          <div><span>Pending Verification</span><strong>{{ summary.pendingPayments || 0 }}</strong></div>
          <div><span>Approved Payments</span><strong>{{ summary.approvedPayments || 0 }}</strong></div>
          <div><span>Pending Commission</span><strong>{{ formatMoney(summary.pendingCommission || 0) }}</strong></div>
        </div>
      </article>
    </section>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  summary: DashboardSummary = {};
  formatMoney = money;

  get cards() {
    return [
      { label: 'Total Leads', value: this.summary.leads || 0 },
      { label: 'Customers', value: this.summary.customers || 0 },
      { label: 'Projects', value: this.summary.projects || 0 },
      { label: 'Available Units', value: this.summary.availableUnits || 0 },
      { label: 'Invoices', value: this.summary.invoices || 0 },
      { label: 'Pending Payments', value: this.summary.pendingPayments || 0 },
      { label: 'Total Collection', value: this.summary.totalCollection || 0, money: true },
      { label: 'Paid Commission', value: this.summary.paidCommission || 0, money: true }
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
