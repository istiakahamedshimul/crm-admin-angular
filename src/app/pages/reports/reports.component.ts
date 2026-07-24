import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { ReportGroup, ReportSummary } from '../../models/crm.models';
import { label, leadSource, leadStatus, money, paymentStatus } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Analytics</p><h1>Basic Reports</h1></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <section class="report-grid">
      <!-- Lead Status Chart -->
      <article class="panel">
        <h2>Lead Status Distribution</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: -12px; margin-bottom: 20px;">Counts of active prospects by operational priority status.</p>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div *ngFor="let row of report?.leadStatus">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-dark);">
              <span>{{ label(leadStatus, row.status) }}</span>
              <strong>{{ row.count }} leads</strong>
            </div>
            <div style="height: 8px; background: var(--panel-soft); border-radius: 99px; overflow: hidden; border: 1px solid var(--line);">
              <div style="height: 100%; background: linear-gradient(90deg, #6366f1, #4f46e5); border-radius: 99px; transition: width 0.5s ease-out;" [style.width.%]="(row.count / getMaxCount(report?.leadStatus)) * 100"></div>
            </div>
          </div>
        </div>
      </article>

      <!-- Lead Source Chart -->
      <article class="panel">
        <h2>Lead Source Channels</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: -12px; margin-bottom: 20px;">Performance of marketing campaigns and referral listings.</p>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div *ngFor="let row of report?.leadSource">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-dark);">
              <span>{{ label(leadSource, row.source) }}</span>
              <strong>{{ row.count }} leads</strong>
            </div>
            <div style="height: 8px; background: var(--panel-soft); border-radius: 99px; overflow: hidden; border: 1px solid var(--line);">
              <div style="height: 100%; background: linear-gradient(90deg, #ec4899, #db2777); border-radius: 99px; transition: width 0.5s ease-out;" [style.width.%]="(row.count / getMaxCount(report?.leadSource)) * 100"></div>
            </div>
          </div>
        </div>
      </article>

      <!-- Payment Collections Chart -->
      <article class="panel">
        <h2>Payment Verification Totals</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: -12px; margin-bottom: 20px;">Financial values of verified vs pending manual collections.</p>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div *ngFor="let row of report?.paymentStatus">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-dark);">
              <span>{{ label(paymentStatus, row.status) }}</span>
              <strong>{{ money(row.amount || 0) }}</strong>
            </div>
            <div style="height: 8px; background: var(--panel-soft); border-radius: 99px; overflow: hidden; border: 1px solid var(--line);">
              <div style="height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 99px; transition: width 0.5s ease-out;" [style.width.%]="((row.amount || 0) / getMaxAmount(report?.paymentStatus)) * 100"></div>
            </div>
          </div>
        </div>
      </article>

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

  getMaxCount(groups?: ReportGroup[]): number {
    if (!groups || groups.length === 0) return 1;
    const count = Math.max(...groups.map(g => g.count));
    return count > 0 ? count : 1;
  }

  getMaxAmount(groups?: ReportGroup[]): number {
    if (!groups || groups.length === 0) return 1;
    const amount = Math.max(...groups.map(g => g.amount || 0));
    return amount > 0 ? amount : 1;
  }

  ngOnInit() { this.load(); }
  load() { this.api.reports().subscribe(data => this.report = data); }
}
