import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import {
  CreateSalesExecutiveRequest,
  SalesExecutiveDetail,
  UpdateSalesExecutiveRequest,
  UserSummary
} from '../../models/crm.models';
import { label, leadStatus, money } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Team</p><h1>Sales Accounts</h1></div>
    </section>

    <section class="form-grid">
      <form class="panel form-panel" (ngSubmit)="create()">
        <h2>Create Sales Executive</h2>
        <p style="color:var(--muted);font-size:13px;margin-top:-12px">Create a seller account for lead assignment.</p>
        <label>Full name<input name="fullName" [(ngModel)]="form.fullName" required></label>
        <label>Email<input name="email" type="email" [(ngModel)]="form.email" required></label>
        <label>Phone<input name="phone" [(ngModel)]="form.phone" required></label>
        <label>Password<input name="password" [(ngModel)]="form.password" type="password" required></label>
        <button type="submit">Create Account</button>
        <p class="success" *ngIf="message">{{ message }}</p>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>

      <article class="panel">
        <h2>Sales Team</h2>
        <p style="color:var(--muted);font-size:13px;margin-top:-12px;margin-bottom:20px">
          Select a sales executive to edit their account and inspect performance.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px">
          <button *ngFor="let user of salesUsers" type="button" (click)="openDetail(user)"
            style="text-align:left;background:var(--bg);color:inherit;border:1px solid var(--line);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:12px;min-height:0">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:white;background:linear-gradient(135deg,var(--brand),#06b6d4);font-weight:800">
                {{ getInitials(user.fullName) }}
              </div>
              <div style="min-width:0">
                <strong style="display:block">{{ user.fullName }}</strong>
                <span style="font-size:12px;color:var(--muted)">{{ user.email }}</span>
              </div>
            </div>
            <div style="border-top:1px solid var(--line);padding-top:10px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px">{{ user.phone }}</span>
              <span class="status-pill" [class.approved]="user.isActive" [class.rejected]="!user.isActive">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </button>
        </div>
      </article>
    </section>

    <div *ngIf="detail" (click)="closeDetail()"
      style="position:fixed;inset:0;background:rgba(15,23,42,.62);z-index:1000;overflow:auto;padding:24px">
      <section (click)="$event.stopPropagation()"
        style="width:min(1050px,100%);margin:auto;background:white;border-radius:20px;padding:24px;box-shadow:0 30px 70px rgba(15,23,42,.3)">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">
          <div><p class="eyebrow">Sales executive profile</p><h2 style="margin:0">{{ detail.fullName }}</h2></div>
          <button type="button" class="ghost-button" (click)="closeDetail()">Close</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:20px 0">
          <div *ngFor="let metric of detailMetrics" style="background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:14px">
            <span style="display:block;color:var(--muted);font-size:12px">{{ metric.label }}</span>
            <strong style="display:block;margin-top:5px;font-size:20px">{{ metric.money ? formatMoney(metric.value) : metric.value }}</strong>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:minmax(280px,.8fr) minmax(360px,1.2fr);gap:18px">
          <form class="panel form-panel" (ngSubmit)="saveDetail()" style="margin:0">
            <h3>Edit account</h3>
            <label>Full name<input name="editFullName" [(ngModel)]="editForm.fullName" required></label>
            <label>Email<input name="editEmail" type="email" [(ngModel)]="editForm.email" required></label>
            <label>Phone<input name="editPhone" [(ngModel)]="editForm.phone" required></label>
            <label>New password (optional)<input name="editPassword" type="password" [(ngModel)]="editForm.password"></label>
            <label style="display:flex;align-items:center;gap:8px">
              <input name="editActive" type="checkbox" [(ngModel)]="editForm.isActive"> Active account
            </label>
            <button type="submit" [disabled]="saving">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
            <p class="success" *ngIf="detailMessage">{{ detailMessage }}</p>
            <p class="error" *ngIf="detailError">{{ detailError }}</p>
          </form>

          <article class="panel" style="margin:0;max-height:520px;overflow:auto">
            <h3>Recent assigned leads</h3>
            <div *ngFor="let lead of detail.recentLeads"
              style="display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)">
              <div>
                <strong style="display:block">{{ lead.customerName }}</strong>
                <span style="font-size:12px;color:var(--muted)">{{ lead.phone }} · {{ lead.project || 'No project' }}</span>
                <span *ngIf="lead.nextFollowUpAt" style="display:block;font-size:11px;color:#b54708">
                  Follow-up: {{ lead.nextFollowUpAt | date:'medium' }}
                </span>
              </div>
              <span class="status-pill">{{ statusLabel(lead.status) }}</span>
            </div>
            <div *ngIf="!detail.recentLeads.length" class="empty-card">No assigned leads.</div>
          </article>
        </div>
      </section>
    </div>
  `
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  users: UserSummary[] = [];
  detail: SalesExecutiveDetail | null = null;
  editForm: UpdateSalesExecutiveRequest = { fullName: '', email: '', phone: '', isActive: true, password: '' };
  message = '';
  error = '';
  detailMessage = '';
  detailError = '';
  saving = false;
  formatMoney = money;
  form: CreateSalesExecutiveRequest = { fullName: '', email: '', phone: '', password: 'Sales@12345' };

  get salesUsers() {
    return this.users.filter(user => user.role === 'SalesExecutive');
  }

  get detailMetrics() {
    if (!this.detail) return [];
    const metrics = this.detail.metrics;
    return [
      { label: 'Total assigned leads', value: metrics.totalAssignedLeads },
      { label: 'Assigned stage', value: metrics.assignedStage },
      { label: 'Following up', value: metrics.followingUp },
      { label: 'Positive customers', value: metrics.positiveCustomers },
      { label: 'Lost', value: metrics.lost },
      { label: 'Not interested', value: metrics.notInterested },
      { label: 'Accepted collections', value: metrics.approvedCollectionAmount, money: true },
      { label: 'Collection count', value: metrics.approvedCollectionCount },
      { label: 'Commission', value: metrics.commission, money: true }
    ];
  }

  ngOnInit() { this.load(); }

  load() {
    this.api.users().subscribe(data => this.users = data);
  }

  openDetail(user: UserSummary) {
    this.detailError = '';
    this.detailMessage = '';
    this.api.salesExecutiveDetail(user.id).subscribe({
      next: detail => {
        this.detail = detail;
        this.editForm = {
          fullName: detail.fullName,
          email: detail.email,
          phone: detail.phone,
          isActive: detail.isActive,
          password: ''
        };
      },
      error: err => this.error = err.error?.message || 'Could not load salesperson details.'
    });
  }

  closeDetail() {
    if (!this.saving) this.detail = null;
  }

  saveDetail() {
    if (!this.detail) return;
    this.saving = true;
    this.detailError = '';
    this.detailMessage = '';
    this.api.updateSalesExecutive(this.detail.id, this.editForm).subscribe({
      next: () => {
        this.saving = false;
        this.detailMessage = 'Sales executive updated.';
        this.load();
        this.openDetail({ ...this.detail!, role: 'SalesExecutive' });
      },
      error: err => {
        this.saving = false;
        this.detailError = err.error?.message || 'Could not update salesperson.';
      }
    });
  }

  statusLabel(status: number) {
    return label(leadStatus, status);
  }

  getInitials(name: string) {
    return name.split(' ').filter(Boolean).map(part => part[0]).join('').substring(0, 2).toUpperCase() || 'SE';
  }

  create() {
    this.message = '';
    this.error = '';
    this.api.createSalesExecutive(this.form).subscribe({
      next: () => {
        this.message = 'Sales executive created.';
        this.form = { fullName: '', email: '', phone: '', password: 'Sales@12345' };
        this.load();
      },
      error: err => this.error = err.error?.message || 'Could not create sales executive.'
    });
  }
}
