import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { SalesExecutiveDetail, SalesPerformanceReport, UpdateSalesExecutiveRequest } from '../../models/crm.models';
import { label, leadStatus, money } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Sales executive profile</p>
        <h1>{{ detail?.fullName || 'Loading profile...' }}</h1>
        <p class="page-copy">Account details, performance, collections, commission, and recent leads.</p>
      </div>
      <button type="button" class="ghost-button" (click)="backToTeam()">Back to Sales Team</button>
    </section>

    <p class="error" *ngIf="error">{{ error }}</p>

    <ng-container *ngIf="detail">
      <section class="panel" style="margin-bottom:18px">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;color:white;background:linear-gradient(135deg,var(--brand),#06b6d4);font-weight:800;font-size:18px">
            {{ initials(detail.fullName) }}
          </div>
          <div style="flex:1">
            <h2 style="margin:0">{{ detail.fullName }}</h2>
            <p style="margin:3px 0;color:var(--brand);font-weight:700">{{ detail.designation }}</p>
            <p style="margin:4px 0 0;color:var(--muted)">{{ detail.email }} · {{ detail.phone }}</p>
          </div>
          <span class="status-pill" [class.approved]="detail.isActive" [class.rejected]="!detail.isActive">
            {{ detail.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </section>

      <section class="panel" style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;flex-wrap:wrap">
          <div><h2 style="margin:0">Performance period</h2><p style="margin:4px 0 0;color:var(--muted)">Filter the profile metrics or print the complete A4 report.</p></div>
          <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
            <label style="margin:0">Period<select [(ngModel)]="reportPeriod" (ngModelChange)="applyPeriod()"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option><option value="overall">Overall</option><option value="custom">Custom range</option></select></label>
            <label style="margin:0">From<input type="date" [(ngModel)]="reportFrom" [disabled]="reportPeriod !== 'custom'"></label>
            <label style="margin:0">To<input type="date" [(ngModel)]="reportTo" [disabled]="reportPeriod !== 'custom'"></label>
            <button type="button" class="ghost-button" (click)="loadReport()">Filter</button>
            <button type="button" (click)="printReport()" [disabled]="!report">Print A4 PDF</button>
          </div>
        </div>
        <p class="error" *ngIf="reportError">{{ reportError }}</p>
      </section>

      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px">
        <article *ngFor="let metric of detailMetrics" class="panel" style="margin:0;padding:16px">
          <span style="display:block;color:var(--muted);font-size:12px">{{ metric.label }}</span>
          <strong style="display:block;margin-top:5px;font-size:20px">
            {{ metric.money ? formatMoney(metric.value) : metric.value }}
          </strong>
        </article>
      </section>

      <section style="display:grid;grid-template-columns:minmax(280px,.8fr) minmax(360px,1.2fr);gap:18px">
        <form class="panel form-panel" (ngSubmit)="save()" style="margin:0">
          <h2>Edit account</h2>
          <label>Full name<input name="editFullName" [(ngModel)]="editForm.fullName" required></label>
          <label>Email<input name="editEmail" type="email" [(ngModel)]="editForm.email" required></label>
          <label>Phone<input name="editPhone" [(ngModel)]="editForm.phone" required></label>
          <label>Designation<input name="editDesignation" [(ngModel)]="editForm.designation" required></label>
          <label>New password (optional)<input name="editPassword" type="password" [(ngModel)]="editForm.password"></label>
          <label>Target month<input name="targetMonth" type="month" [(ngModel)]="editForm.targetMonth" required></label>
          <label>Minimum sales units<input name="minimumSalesUnits" type="number" min="0" step="1" [(ngModel)]="editForm.minimumSalesUnits" required></label>
          <label>Minimum collection target<input name="minimumCollectionAmount" type="number" min="0" step="0.01" [(ngModel)]="editForm.minimumCollectionAmount" required></label>
          <label style="display:flex;align-items:center;gap:8px">
            <input name="editActive" type="checkbox" [(ngModel)]="editForm.isActive"> Active account
          </label>
          <button type="submit" [disabled]="saving">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
          <p class="success" *ngIf="message">{{ message }}</p>
          <p class="error" *ngIf="saveError">{{ saveError }}</p>
        </form>

        <article class="panel" style="margin:0;max-height:620px;overflow:auto">
          <h2>Recent assigned leads</h2>
          <div *ngFor="let lead of detail.recentLeads"
            style="display:flex;justify-content:space-between;gap:12px;padding:13px 0;border-bottom:1px solid var(--line)">
            <div>
              <strong style="display:block">{{ lead.customerName }}</strong>
              <span style="font-size:12px;color:var(--muted)">
                {{ lead.phone }} · {{ lead.project || 'No project' }}
              </span>
              <span *ngIf="lead.nextFollowUpAt" style="display:block;font-size:11px;color:#b54708">
                Follow-up: {{ lead.nextFollowUpAt | date:'medium' }}
              </span>
            </div>
            <span class="status-pill">{{ statusLabel(lead.status) }}</span>
          </div>
          <div *ngIf="!detail.recentLeads.length" class="empty-card">No assigned leads.</div>
        </article>
      </section>
    </ng-container>
  `
})
export class SalesExecutiveProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  detail: SalesExecutiveDetail | null = null;
  editForm: UpdateSalesExecutiveRequest = {
    fullName: '',
    email: '',
    phone: '',
    designation: '',
    isActive: true,
    password: ''
    ,minimumSalesUnits: 0, minimumCollectionAmount: 0, targetMonth: ''
  };
  error = '';
  message = '';
  saveError = '';
  saving = false;
  report: SalesPerformanceReport | null = null;
  reportPeriod: 'monthly' | 'quarterly' | 'yearly' | 'overall' | 'custom' = 'monthly';
  reportFrom = '';
  reportTo = '';
  reportError = '';
  formatMoney = money;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.error = 'Invalid sales executive profile.';
        return;
      }
      this.load(id);
      this.applyPeriod();
    });
  }

  get detailMetrics() {
    if (!this.detail) return [];
    if (this.report) return [
      { label: 'Total assigned leads', value: this.report.assignedLeads },
      { label: 'Returned leads', value: this.report.returnedLeads },
      { label: 'Assigned stage', value: this.report.assignedStage },
      { label: 'Following up', value: this.report.followingUp },
      { label: 'Win', value: this.report.bookedClients },
      { label: 'Lost', value: this.report.lost },
      { label: 'Not interested', value: this.report.notInterested },
      { label: 'Accepted collections', value: this.report.totalCollection, money: true },
      { label: 'Collection count', value: this.report.collectionCount },
      { label: 'Commission', value: this.report.totalCommission, money: true }
    ];
    const metrics = this.detail.metrics;
    return [
      { label: 'Total assigned leads', value: metrics.totalAssignedLeads },
      { label: 'Returned leads', value: metrics.returnedLeads },
      { label: 'Assigned stage', value: metrics.assignedStage },
      { label: 'Following up', value: metrics.followingUp },
      { label: 'Win', value: metrics.positiveCustomers },
      { label: 'Lost', value: metrics.lost },
      { label: 'Not interested', value: metrics.notInterested },
      { label: 'Accepted collections', value: metrics.approvedCollectionAmount, money: true },
      { label: 'Collection count', value: metrics.approvedCollectionCount },
      { label: 'Commission', value: metrics.commission, money: true }
    ];
  }

  load(id: number): void {
    this.error = '';
    this.api.salesExecutiveDetail(id).subscribe({
      next: detail => {
        this.detail = detail;
        this.editForm = {
          fullName: detail.fullName,
          email: detail.email,
          phone: detail.phone,
          designation: detail.designation,
          isActive: detail.isActive,
          password: ''
          ,minimumSalesUnits: detail.currentTarget.salesUnitTarget,
          minimumCollectionAmount: detail.currentTarget.collectionTarget,
          targetMonth: detail.currentTarget.month.substring(0, 7)
        };
      },
      error: err => {
        this.detail = null;
        this.error = err.error?.message || 'Could not load salesperson details.';
      }
    });
  }

  save(): void {
    if (!this.detail) return;
    this.saving = true;
    this.message = '';
    this.saveError = '';
    const request = { ...this.editForm, targetMonth: this.editForm.targetMonth?.length === 7 ? `${this.editForm.targetMonth}-01` : this.editForm.targetMonth };
    this.api.updateSalesExecutive(this.detail.id, request).subscribe({
      next: () => {
        this.saving = false;
        this.message = 'Sales executive updated.';
        this.load(this.detail!.id);
      },
      error: err => {
        this.saving = false;
        this.saveError = err.error?.message || 'Could not update salesperson.';
      }
    });
  }

  backToTeam(): void {
    void this.router.navigateByUrl('/users');
  }

  statusLabel(status: number): string {
    return label(leadStatus, status);
  }

  initials(name: string): string {
    return name.split(' ').filter(Boolean).map(part => part[0]).join('').substring(0, 2).toUpperCase() || 'SE';
  }

  variance(value: number, unit: string): string { return `${value >= 0 ? 'Over by' : 'Short by'} ${Math.abs(value)} ${unit}`; }
  moneyVariance(value: number): string { return `${value >= 0 ? 'Over by' : 'Short by'} ${this.formatMoney(Math.abs(value))}`; }

  applyPeriod(): void {
    if (this.reportPeriod === 'custom') return;
    const now = new Date(); let from: Date; let to: Date;
    if (this.reportPeriod === 'overall') { from = new Date(2020, 0, 1); to = now; }
    else if (this.reportPeriod === 'yearly') { from = new Date(now.getFullYear(), 0, 1); to = new Date(now.getFullYear(), 11, 31); }
    else if (this.reportPeriod === 'quarterly') { const m = Math.floor(now.getMonth() / 3) * 3; from = new Date(now.getFullYear(), m, 1); to = new Date(now.getFullYear(), m + 3, 0); }
    else { from = new Date(now.getFullYear(), now.getMonth(), 1); to = new Date(now.getFullYear(), now.getMonth() + 1, 0); }
    this.reportFrom = this.dateValue(from); this.reportTo = this.dateValue(to); this.loadReport();
  }

  loadReport(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || !this.reportFrom || !this.reportTo) return;
    this.reportError = '';
    this.api.salesPerformanceReport(id, this.reportFrom, this.reportTo).subscribe({
      next: value => this.report = value,
      error: err => { this.report = null; this.reportError = err.error?.message || 'Could not load the performance report.'; }
    });
  }

  printReport(): void {
    if (!this.report) return;
    const rows = this.report.months;
    const statuses = Array.from(new Set(rows.flatMap(row => Object.keys(row.statusCounts))));
    const sum = (key: 'wins'|'lost'|'unitTarget'|'unitsAchieved'|'unitVariance'|'collectionTarget'|'collectionAchieved'|'collectionVariance') => rows.reduce((total, row) => total + row[key], 0);
    const statusTotal = (status: string) => rows.reduce((total, row) => total + (row.statusCounts[status] || 0), 0);
    const month = (value: string) => new Date(value).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    const detailRows = rows.map(row => `<tr><td>${month(row.month)}</td><td>${row.wins}</td><td>${row.lost}</td><td>${row.unitsAchieved}</td><td>${row.unitTarget}</td><td>${this.signed(row.unitVariance)}</td><td>${this.formatMoney(row.collectionAchieved)}</td><td>${this.formatMoney(row.collectionTarget)}</td><td>${this.signedMoney(row.collectionVariance)}</td></tr>`).join('');
    const statusRows = rows.map(row => `<tr><td>${month(row.month)}</td>${statuses.map(s => `<td>${row.statusCounts[s] || 0}</td>`).join('')}<td>${Object.values(row.statusCounts).reduce((a,b)=>a+b,0)}</td></tr>`).join('');
    const html = `<!doctype html><html><head><title>Sales Performance</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:10px Arial;color:#172033;margin:0}header{border-bottom:3px solid #0f766e;padding-bottom:12px;margin-bottom:18px}h1{font-size:24px;margin:0}h2{font-size:14px;margin:20px 0 8px}.sub,footer{color:#64748b}.cards{display:flex;gap:8px}.card{flex:1;background:#f1f5f9;border:1px solid #cbd5e1;padding:10px}.card b{display:block;font-size:17px;margin-top:4px}table{width:100%;border-collapse:collapse}tr{page-break-inside:avoid}th{background:#0f766e;color:#fff}th,td{border:1px solid #cbd5e1;padding:5px;text-align:right}th:first-child,td:first-child{text-align:left}.total{font-weight:bold;background:#e2e8f0}footer{margin-top:18px;font-size:9px}</style></head><body><header><h1>Sales Executive Performance Report</h1><div class="sub">${this.safe(this.report.employee.fullName)} · ${this.safe(this.report.employee.email)}<br>${this.reportFrom} to ${this.reportTo}</div></header><div class="cards"><div class="card">TOTAL WINS<b>${sum('wins')}</b></div><div class="card">TOTAL LOST<b>${sum('lost')}</b></div><div class="card">TOTAL COLLECTION<b>${this.formatMoney(sum('collectionAchieved'))}</b></div></div><h2>Monthly Performance</h2><table><thead><tr><th>Month</th><th>Win</th><th>Lost</th><th>Units</th><th>Target</th><th>Unit +/-</th><th>Collection</th><th>Target</th><th>Collection +/-</th></tr></thead><tbody>${detailRows}<tr class="total"><td>TOTAL</td><td>${sum('wins')}</td><td>${sum('lost')}</td><td>${sum('unitsAchieved')}</td><td>${sum('unitTarget')}</td><td>${this.signed(sum('unitVariance'))}</td><td>${this.formatMoney(sum('collectionAchieved'))}</td><td>${this.formatMoney(sum('collectionTarget'))}</td><td>${this.signedMoney(sum('collectionVariance'))}</td></tr></tbody></table><h2>Lead Status Detail</h2><table><thead><tr><th>Month</th>${statuses.map(s=>`<th>${this.safe(s)}</th>`).join('')}<th>Total</th></tr></thead><tbody>${statusRows}<tr class="total"><td>TOTAL</td>${statuses.map(s=>`<td>${statusTotal(s)}</td>`).join('')}<td>${statuses.reduce((a,s)=>a+statusTotal(s),0)}</td></tr></tbody></table><footer>Positive variance means above target; negative means shortage. Generated ${new Date().toLocaleString()}.</footer><script>window.onload=()=>window.print()<\/script></body></html>`;
    const popup = window.open('', '_blank');
    if (!popup) { this.reportError = 'Allow pop-ups to print the report.'; return; }
    popup.document.write(html); popup.document.close();
  }

  private dateValue(value: Date): string { return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`; }
  private signed(value: number): string { return `${value >= 0 ? '+' : ''}${value}`; }
  private signedMoney(value: number): string { return `${value >= 0 ? '+' : '-'}${this.formatMoney(Math.abs(value))}`; }
  private safe(value: string): string { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!)); }
}
