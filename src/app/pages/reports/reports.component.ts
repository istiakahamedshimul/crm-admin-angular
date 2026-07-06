import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { ReportGroup, ReportSummary } from '../../models/crm.models';
import { invoiceStatus, label, leadSource, leadStatus, money, paymentStatus } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Analytics</p><h1>Basic Reports</h1></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <section class="report-grid">
      <article class="panel"><h2>Lead Status</h2><div class="report-row" *ngFor="let row of report?.leadStatus"><span>{{ label(leadStatus, row.status) }}</span><strong>{{ row.count }}</strong></div></article>
      <article class="panel"><h2>Lead Source</h2><div class="report-row" *ngFor="let row of report?.leadSource"><span>{{ label(leadSource, row.source) }}</span><strong>{{ row.count }}</strong></div></article>
      <article class="panel"><h2>Payments</h2><div class="report-row" *ngFor="let row of report?.paymentStatus"><span>{{ label(paymentStatus, row.status) }}</span><strong>{{ money(row.amount || 0) }}</strong></div></article>
      <article class="panel"><h2>Invoices</h2><div class="report-row" *ngFor="let row of report?.invoiceStatus"><span>{{ label(invoiceStatus, row.status) }}</span><strong>{{ money(row.amount || 0) }}</strong></div></article>
    </section>
  `
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  report?: ReportSummary;
  label = label;
  money = money;
  leadStatus = leadStatus;
  leadSource = leadSource;
  paymentStatus = paymentStatus;
  invoiceStatus = invoiceStatus;
  ngOnInit() { this.load(); }
  load() { this.api.reports().subscribe(data => this.report = data); }
}
