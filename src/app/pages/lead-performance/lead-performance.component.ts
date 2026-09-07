import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { FollowUp, Lead } from '../../models/crm.models';

type Period = 'month' | 'year' | 'overall';
type LeadRow = Lead & { followUpCount: number; lastFollowUpAt?: string };

const leadStatuses = ['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiating', 'Booked', 'Lost'];

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Lead intelligence</p>
        <h1>Lead Performance</h1>
        <p class="page-copy">Review assignments and follow-up activity across your sales team.</p>
      </div>
      <a routerLink="/" class="back-link">← Dashboard</a>
    </section>

    <section class="filter-panel">
      <div class="period-tabs" role="group" aria-label="Reporting period">
        <button type="button" [class.active]="period === 'month'" (click)="setPeriod('month')">Monthly</button>
        <button type="button" [class.active]="period === 'year'" (click)="setPeriod('year')">Yearly</button>
        <button type="button" [class.active]="period === 'overall'" (click)="setPeriod('overall')">Overall</button>
      </div>
      <div class="filter-grid">
        <label *ngIf="period === 'month'">Month<input type="month" [(ngModel)]="selectedMonth"></label>
        <label *ngIf="period === 'year'">Year<select [(ngModel)]="selectedYear"><option *ngFor="let year of years" [ngValue]="year">{{ year }}</option></select></label>
        <label>Employee<select [(ngModel)]="employee"><option value="">All employees</option><option value="unassigned">Unassigned</option><option *ngFor="let name of employees" [value]="name">{{ name }}</option></select></label>
        <label>Status<select [(ngModel)]="status"><option value="">All statuses</option><option *ngFor="let name of statusOptions; let i = index" [value]="i">{{ name }}</option></select></label>
        <label class="search">Search<input type="search" [(ngModel)]="search" placeholder="Name, phone, project or employee"></label>
        <button type="button" class="refresh" (click)="load()" [disabled]="loading">{{ loading ? 'Loading…' : 'Refresh data' }}</button>
      </div>
    </section>

    <section class="summary-grid">
      <article><span>Leads</span><strong>{{ rows.length }}</strong><small>{{ periodLabel }}</small></article>
      <article><span>Assigned</span><strong>{{ assignedCount }}</strong><small>{{ assignmentRate }}% assignment rate</small></article>
      <article><span>Follow-ups</span><strong>{{ followUpTotal }}</strong><small>For displayed leads</small></article>
      <article><span>Without follow-up</span><strong class="warning">{{ withoutFollowUp }}</strong><small>Need attention</small></article>
    </section>

    <section class="table-card">
      <header><div><h2>Lead assignment details</h2><p>{{ rows.length }} matching records · {{ periodLabel }}</p></div><span class="live-mark">Live CRM data</span></header>
      <div class="table-scroll" *ngIf="!loading; else loadingView">
        <table>
          <thead><tr><th>Lead</th><th>Assigned employee</th><th>Project</th><th>Status</th><th>Created</th><th>Follow-ups</th><th>Latest activity</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let lead of rows">
              <td><a class="lead-name" [routerLink]="['/followups']" [queryParams]="{ leadId: lead.id }">{{ lead.customerName }}</a><small>{{ lead.phone }}</small></td>
              <td><span class="employee-name" [class.unassigned]="!lead.assignedToName">{{ lead.assignedToName || 'Unassigned' }}</span></td>
              <td>{{ lead.projectName || '—' }}</td>
              <td><span class="status" [attr.data-status]="lead.status">{{ statusLabel(lead.status) }}</span></td>
              <td>{{ lead.createdAt | date:'MMM d, y' }}</td>
              <td><span class="count" [class.zero]="!lead.followUpCount">{{ lead.followUpCount }}</span></td>
              <td>{{ lead.lastFollowUpAt ? (lead.lastFollowUpAt | date:'MMM d, y, h:mm a') : 'No activity yet' }}</td>
              <td><a class="view-link" [routerLink]="['/followups']" [queryParams]="{ leadId: lead.id }">View follow-ups →</a></td>
            </tr>
            <tr *ngIf="!rows.length"><td colspan="8" class="empty">No leads match the selected filters.</td></tr>
          </tbody>
        </table>
      </div>
      <ng-template #loadingView><div class="empty">Loading lead performance…</div></ng-template>
    </section>
  `,
  styleUrls: ['./lead-performance.component.css']
})
export class LeadPerformanceComponent implements OnInit {
  private api = inject(ApiService);
  private leads: Lead[] = [];
  private followUps: FollowUp[] = [];
  loading = true;
  period: Period = 'month';
  selectedMonth = new Date().toISOString().slice(0, 7);
  selectedYear = new Date().getFullYear();
  employee = '';
  status = '';
  search = '';
  readonly statusOptions = leadStatuses;
  readonly years = Array.from({ length: 8 }, (_, index) => new Date().getFullYear() - index);

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    forkJoin({ leads: this.api.leads(), followUps: this.api.followUps() }).subscribe({
      next: data => { this.leads = data.leads; this.followUps = data.followUps; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  setPeriod(period: Period) { this.period = period; }

  get rows(): LeadRow[] {
    const term = this.search.trim().toLowerCase();
    const activity = new Map<number, FollowUp[]>();
    for (const item of this.followUps) activity.set(item.leadId, [...(activity.get(item.leadId) ?? []), item]);
    return this.leads
      .filter(lead => this.inPeriod(lead.createdAt))
      .filter(lead => !this.employee || (this.employee === 'unassigned' ? !lead.assignedToName : lead.assignedToName === this.employee))
      .filter(lead => this.status === '' || lead.status === Number(this.status))
      .filter(lead => !term || [lead.customerName, lead.phone, lead.projectName, lead.assignedToName].some(value => value?.toLowerCase().includes(term)))
      .map(lead => {
        const items = activity.get(lead.id) ?? [];
        return { ...lead, followUpCount: items.length, lastFollowUpAt: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get employees() { return [...new Set(this.leads.map(lead => lead.assignedToName).filter((name): name is string => !!name))].sort(); }
  get assignedCount() { return this.rows.filter(lead => !!lead.assignedToName).length; }
  get assignmentRate() { return this.rows.length ? Math.round(this.assignedCount / this.rows.length * 100) : 0; }
  get followUpTotal() { return this.rows.reduce((total, lead) => total + lead.followUpCount, 0); }
  get withoutFollowUp() { return this.rows.filter(lead => lead.followUpCount === 0).length; }
  get periodLabel() {
    if (this.period === 'overall') return 'All time';
    if (this.period === 'year') return String(this.selectedYear);
    const [year, month] = this.selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  statusLabel(value: number) { return leadStatuses[value] ?? `Status ${value}`; }

  private inPeriod(value: string) {
    if (this.period === 'overall') return true;
    const date = new Date(value);
    if (this.period === 'year') return date.getFullYear() === this.selectedYear;
    const [year, month] = this.selectedMonth.split('-').map(Number);
    return date.getFullYear() === year && date.getMonth() === month - 1;
  }
}
