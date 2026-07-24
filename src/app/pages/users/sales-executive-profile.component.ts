import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { SalesExecutiveDetail, UpdateSalesExecutiveRequest } from '../../models/crm.models';
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
            <p style="margin:4px 0 0;color:var(--muted)">{{ detail.email }} · {{ detail.phone }}</p>
          </div>
          <span class="status-pill" [class.approved]="detail.isActive" [class.rejected]="!detail.isActive">
            {{ detail.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
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
          <label>New password (optional)<input name="editPassword" type="password" [(ngModel)]="editForm.password"></label>
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
    isActive: true,
    password: ''
  };
  error = '';
  message = '';
  saveError = '';
  saving = false;
  formatMoney = money;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.error = 'Invalid sales executive profile.';
        return;
      }
      this.load(id);
    });
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

  load(id: number): void {
    this.error = '';
    this.api.salesExecutiveDetail(id).subscribe({
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
    this.api.updateSalesExecutive(this.detail.id, this.editForm).subscribe({
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
}
