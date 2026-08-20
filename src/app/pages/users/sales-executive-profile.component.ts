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

    <div class="profile-grid" *ngIf="detail">
      <!-- Left Column -->
      <div class="sidebar-col">
        <!-- Profile Header Panel -->
        <section class="profile-header-panel">
          <div class="avatar-wrapper">
            <div class="profile-avatar">
              {{ initials(detail.fullName) }}
            </div>
          </div>
          <div class="profile-name-section">
            <h2 class="profile-name">{{ detail.fullName }}</h2>
            <p class="profile-designation">{{ detail.designation }}</p>
            <span class="status-pill" [class.approved]="detail.isActive" [class.rejected]="!detail.isActive">
              {{ detail.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="contact-info-list">
            <div class="contact-info-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>{{ detail.email }}</span>
            </div>
            <div class="contact-info-item">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>{{ detail.phone }}</span>
            </div>
          </div>
        </section>

        <!-- Current Month Target Progress -->
        <section class="progress-card">
          <div class="progress-header">
            <h3>Target Progress</h3>
            <span class="progress-month-badge">{{ getMonthLabel(detail.currentTarget.month) }}</span>
          </div>
          <div class="tracker-group">
            <!-- Units Target -->
            <div class="tracker-item">
              <div class="tracker-info">
                <span class="tracker-label">Sales Units</span>
                <span class="tracker-values">
                  {{ detail.currentTarget.salesUnitsAchieved }} <span>/ {{ detail.currentTarget.salesUnitTarget }} units</span>
                </span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" [style.width.%]="unitsProgress" [class.success]="unitsProgress >= 100" [class.warning]="unitsProgress < 50" [class.brand]="unitsProgress >= 50 && unitsProgress < 100"></div>
              </div>
              <span class="variance-pill" [class.over]="detail.currentTarget.salesUnitVariance >= 0" [class.short]="detail.currentTarget.salesUnitVariance < 0">
                {{ variance(detail.currentTarget.salesUnitVariance, 'units') }}
              </span>
            </div>

            <!-- Collection Target -->
            <div class="tracker-item" style="border-top: 1px solid var(--line); padding-top: 16px; margin-top: 4px;">
              <div class="tracker-info">
                <span class="tracker-label">Collection Target</span>
                <span class="tracker-values">
                  {{ formatMoney(detail.currentTarget.collectionAchieved) }} <span>/ {{ formatMoney(detail.currentTarget.collectionTarget) }}</span>
                </span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" [style.width.%]="collectionProgress" [class.success]="collectionProgress >= 100" [class.warning]="collectionProgress < 50" [class.brand]="collectionProgress >= 50 && collectionProgress < 100"></div>
              </div>
              <span class="variance-pill" [class.over]="detail.currentTarget.collectionVariance >= 0" [class.short]="detail.currentTarget.collectionVariance < 0">
                {{ moneyVariance(detail.currentTarget.collectionVariance) }}
              </span>
            </div>
          </div>
        </section>

        <!-- Edit Profile Form -->
        <form class="edit-account-panel" (ngSubmit)="save()">
          <h3>Edit Account</h3>
          <div class="modern-form">
            <label>Full name<input name="editFullName" [(ngModel)]="editForm.fullName" required></label>
            <label>Email<input name="editEmail" type="email" [(ngModel)]="editForm.email" required></label>
            <label>Phone<input name="editPhone" [(ngModel)]="editForm.phone" required></label>
            <label>Designation<input name="editDesignation" [(ngModel)]="editForm.designation" required></label>
            <label>New password (optional)<input name="editPassword" type="password" [(ngModel)]="editForm.password" placeholder="••••••••"></label>
            <label>Target month<input name="targetMonth" type="month" [(ngModel)]="editForm.targetMonth" required></label>
            <label>Minimum sales units<input name="minimumSalesUnits" type="number" min="0" step="1" [(ngModel)]="editForm.minimumSalesUnits" required></label>
            <label>Minimum collection target<input name="minimumCollectionAmount" type="number" min="0" step="0.01" [(ngModel)]="editForm.minimumCollectionAmount" required></label>
            
            <label class="active-toggle-label">
              <input name="editActive" type="checkbox" [(ngModel)]="editForm.isActive"> Active account
            </label>
            
            <button type="submit" [disabled]="saving" style="margin-top: 8px;">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <p class="success" *ngIf="message">{{ message }}</p>
            <p class="error" *ngIf="saveError">{{ saveError }}</p>
          </div>
        </form>
      </div>

      <!-- Right Column -->
      <div class="main-col">
        <!-- Performance period -->
        <section class="filter-panel">
          <div class="filter-grid">
            <div style="flex: 1; min-width: 200px;">
              <h3 style="margin: 0 0 4px; color: var(--text-dark); font-size: 15px; font-weight: 700;">Performance period</h3>
              <p style="margin: 0; color: var(--muted); font-size: 12.5px;">Filter performance metrics or print report.</p>
            </div>
            
            <label>Period
              <select [(ngModel)]="reportPeriod" (ngModelChange)="applyPeriod()">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="overall">Overall</option>
                <option value="custom">Custom range</option>
              </select>
            </label>
            
            <label>From
              <input type="date" [(ngModel)]="reportFrom" [disabled]="reportPeriod !== 'custom'">
            </label>
            
            <label>To
              <input type="date" [(ngModel)]="reportTo" [disabled]="reportPeriod !== 'custom'">
            </label>
            
            <div class="filter-btn-group">
              <button type="button" class="ghost-button" (click)="loadReport()">Filter</button>
              <button type="button" (click)="printReport()" [disabled]="!report">Print A4 PDF</button>
            </div>
          </div>
          <p class="error" *ngIf="reportError" style="margin-top: 10px; margin-bottom: 0;">{{ reportError }}</p>
        </section>

        <!-- Performance metrics -->
        <section class="metrics-panel">
          <div class="metrics-title-row">
            <h3>Performance Metrics</h3>
            <span style="font-size: 12px; color: var(--muted);" *ngIf="report">Filtered view</span>
            <span style="font-size: 12px; color: var(--muted);" *ngIf="!report">Overall history</span>
          </div>
          
          <div class="metrics-grid-layout">
            <article *ngFor="let metric of detailMetrics" class="metric-card" [class]="metric.color">
              <div class="metric-icon-wrapper" [innerHTML]="getMetricIcon(metric.icon)"></div>
              <div>
                <span class="metric-label">{{ metric.label }}</span>
                <strong class="metric-value">
                  {{ metric.money ? formatMoney(metric.value) : metric.value }}
                </strong>
              </div>
            </article>
          </div>
        </section>

        <!-- Recent assigned leads -->
        <section class="leads-panel">
          <div class="leads-header">
            <h3>Recent Assigned Leads</h3>
            <span style="font-size: 12px; font-weight: 600; color: var(--brand-dark); background: var(--brand-light); padding: 2px 8px; border-radius: 99px;">
              {{ detail.recentLeads.length }} leads
            </span>
          </div>
          
          <div class="leads-list-wrapper">
            <div *ngFor="let lead of detail.recentLeads" class="lead-item-card">
              <div class="lead-details">
                <span class="lead-name">{{ lead.customerName }}</span>
                <span class="lead-meta">
                  {{ lead.phone }} <span style="opacity: 0.5;">·</span> {{ lead.project || 'No project' }}
                </span>
                <span *ngIf="lead.nextFollowUpAt" class="lead-followup">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Follow-up: {{ lead.nextFollowUpAt | date:'medium' }}
                </span>
              </div>
              <span class="status-pill" [class]="getLeadStatusClass(lead.status)">
                {{ statusLabel(lead.status) }}
              </span>
            </div>
            <div *ngIf="!detail.recentLeads.length" class="empty-card" style="padding: 40px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 12px; background: var(--bg);">
              No assigned leads.
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .profile-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 24px;
      align-items: start;
      margin-top: 18px;
    }
    @media (max-width: 1024px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
    .sidebar-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .main-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .profile-header-panel {
      background: var(--panel);
      border-radius: 16px;
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      padding: 24px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .profile-header-panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 80px;
      background: linear-gradient(135deg, var(--brand), #0d9488);
      opacity: 0.85;
      z-index: 1;
    }
    .avatar-wrapper {
      position: relative;
      z-index: 2;
      margin-top: 20px;
      margin-bottom: 16px;
      display: inline-block;
    }
    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: white;
      background: linear-gradient(135deg, var(--brand), #06b6d4);
      font-weight: 800;
      font-size: 26px;
      border: 4px solid var(--panel);
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      margin: 0 auto;
    }
    .profile-name-section {
      position: relative;
      z-index: 2;
    }
    .profile-name {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-dark);
      margin: 0 0 4px;
    }
    .profile-designation {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--brand);
      margin: 0 0 16px;
    }
    .contact-info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: left;
      border-top: 1px solid var(--line);
      padding-top: 16px;
      margin-top: 16px;
    }
    .contact-info-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13.5px;
      color: var(--text);
    }
    .contact-info-item svg {
      color: var(--muted);
      flex-shrink: 0;
    }
    .progress-card {
      background: var(--panel);
      border-radius: 16px;
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      padding: 24px;
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .progress-header h3 {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
      color: var(--text-dark);
    }
    .progress-month-badge {
      font-size: 11px;
      font-weight: 600;
      background: var(--brand-light);
      color: var(--brand-dark);
      padding: 4px 10px;
      border-radius: 99px;
    }
    .tracker-group {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .tracker-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .tracker-info {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 13px;
    }
    .tracker-label {
      color: var(--muted);
      font-weight: 500;
    }
    .tracker-values {
      font-weight: 700;
      color: var(--text-dark);
    }
    .tracker-values span {
      font-size: 11px;
      color: var(--muted);
      font-weight: 400;
    }
    .progress-bar-container {
      height: 8px;
      background: var(--panel-soft);
      border-radius: 99px;
      overflow: hidden;
      position: relative;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 0.6s ease;
    }
    .progress-bar-fill.success {
      background: linear-gradient(90deg, #10b981, #059669);
    }
    .progress-bar-fill.warning {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }
    .progress-bar-fill.brand {
      background: linear-gradient(90deg, var(--brand), #0d9488);
    }
    .variance-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      margin-top: 4px;
    }
    .variance-pill.over {
      background: var(--success-bg);
      color: var(--success-dark);
    }
    .variance-pill.short {
      background: var(--danger-bg);
      color: var(--danger-dark);
    }
    .metrics-panel {
      background: var(--panel);
      border-radius: 16px;
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      padding: 24px;
    }
    .metrics-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .metrics-title-row h3 {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
      color: var(--text-dark);
    }
    .metrics-grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }
    .metric-card {
      background: var(--bg);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15,23,42,0.06);
      border-color: var(--brand);
    }
    .metric-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: white;
      border: 1px solid var(--line);
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .metric-card.blue .metric-icon-wrapper { color: #3b82f6; background: rgba(59,130,246,0.08); }
    .metric-card.orange .metric-icon-wrapper { color: #f97316; background: rgba(249,115,22,0.08); }
    .metric-card.indigo .metric-icon-wrapper { color: #6366f1; background: rgba(99,102,241,0.08); }
    .metric-card.purple .metric-icon-wrapper { color: #a855f7; background: rgba(168,85,247,0.08); }
    .metric-card.green .metric-icon-wrapper { color: #10b981; background: rgba(16,185,129,0.08); }
    .metric-card.red .metric-icon-wrapper { color: #ef4444; background: rgba(239,68,68,0.08); }
    .metric-card.gray .metric-icon-wrapper { color: #64748b; background: rgba(100,116,139,0.08); }
    .metric-card.teal .metric-icon-wrapper { color: #0d9488; background: rgba(13,148,136,0.08); }
    .metric-card.cyan .metric-icon-wrapper { color: #06b6d4; background: rgba(6,182,212,0.08); }
    .metric-card.emerald .metric-icon-wrapper { color: #059669; background: rgba(5,150,105,0.08); }
    .metric-label {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
      line-height: 1.3;
    }
    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-dark);
    }
    .filter-panel {
      background: var(--panel);
      border-radius: 16px;
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      padding: 20px 24px;
    }
    .filter-grid {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      flex-wrap: wrap;
    }
    .filter-grid label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
    }
    .filter-grid select, .filter-grid input {
      height: 38px;
      border-radius: 8px;
      border: 1px solid var(--line);
      padding: 0 12px;
      background: var(--bg);
      min-width: 130px;
      transition: all 0.2s ease;
    }
    .filter-grid select:focus, .filter-grid input:focus {
      outline: none;
      border-color: var(--brand);
      background: var(--panel);
    }
    .filter-btn-group {
      display: flex;
      gap: 8px;
    }
    .leads-panel {
      background: var(--panel);
      border-radius: 16px;
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      padding: 24px;
    }
    .leads-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .leads-header h3 {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
      color: var(--text-dark);
    }
    .leads-list-wrapper {
      max-height: 520px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .lead-item-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 12px;
      margin-bottom: 10px;
      transition: all 0.2s ease;
      background: var(--panel);
    }
    .lead-item-card:hover {
      border-color: var(--brand);
      transform: translateX(2px);
      background: var(--panel-soft);
    }
    .lead-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .lead-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-dark);
    }
    .lead-meta {
      font-size: 12.5px;
      color: var(--muted);
    }
    .lead-followup {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--warning-dark);
      background: var(--warning-bg);
      padding: 3px 8px;
      border-radius: 4px;
      align-self: flex-start;
      margin-top: 4px;
    }
    .status-new {
      background: var(--brand-light);
      color: var(--brand-dark);
    }
    .status-active {
      background: #eff6ff;
      color: #1e40af;
    }
    .status-pending {
      background: var(--warning-bg);
      color: var(--warning-dark);
    }
    .edit-account-panel {
      background: var(--panel);
      border-radius: 16px;
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      padding: 24px;
    }
    .edit-account-panel h3 {
      font-size: 15px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 18px;
      color: var(--text-dark);
    }
    .modern-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .modern-form label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text);
    }
    .modern-form input {
      height: 40px;
      border-radius: 8px;
      border: 1px solid var(--line);
      padding: 0 14px;
      background: var(--bg);
      transition: all 0.2s ease;
    }
    .modern-form input:focus {
      outline: none;
      border-color: var(--brand);
      background: var(--panel);
      box-shadow: 0 0 0 3px var(--brand-glow);
    }
    .active-toggle-label {
      flex-direction: row !important;
      align-items: center;
      gap: 10px !important;
      cursor: pointer;
      margin-top: 6px;
    }
    .active-toggle-label input {
      width: 18px;
      height: 18px;
      accent-color: var(--brand);
      cursor: pointer;
    }
  `]
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

  get unitsProgress(): number {
    if (!this.detail || !this.detail.currentTarget.salesUnitTarget) return 0;
    return Math.min(100, Math.max(0, (this.detail.currentTarget.salesUnitsAchieved / this.detail.currentTarget.salesUnitTarget) * 100));
  }

  get collectionProgress(): number {
    if (!this.detail || !this.detail.currentTarget.collectionTarget) return 0;
    return Math.min(100, Math.max(0, (this.detail.currentTarget.collectionAchieved / this.detail.currentTarget.collectionTarget) * 100));
  }

  getMonthLabel(monthStr: string | undefined | null): string {
    if (!monthStr) return 'Current Month';
    try {
      const parts = monthStr.split('-');
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  }

  getLeadStatusClass(status: number): string {
    const labelStr = this.statusLabel(status);
    if (!labelStr) return '';
    switch (labelStr) {
      case 'New':
      case 'Assigned':
        return 'status-new';
      case 'Contacted':
      case 'Interested':
      case 'Follow-up':
      case 'Site Visit':
      case 'Visited':
        return 'status-active';
      case 'Negotiation':
      case 'Proposal':
        return 'status-pending';
      case 'Booked':
        return 'approved';
      case 'Lost':
      case 'Not Interested':
        return 'rejected';
      default:
        return '';
    }
  }

  getMetricIcon(icon: string): string {
    switch (icon) {
      case 'leads':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
      case 'returned':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>`;
      case 'stage':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`;
      case 'followup':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
      case 'win':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a6 6 0 0 1 6 6v3.5c0 1.63-1.03 3.03-2.5 3.5h-7C7.03 14.53 6 13.13 6 11.5V8a6 6 0 0 1 6-6z"></path></svg>`;
      case 'lost':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      case 'not-interested':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;
      case 'collection':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>`;
      case 'count':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>`;
      case 'commission':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"></circle><circle cx="16" cy="16" r="3"></circle><line x1="16" y1="8" x2="8" y2="16"></line></svg>`;
      default:
        return '';
    }
  }

  get detailMetrics() {
    if (!this.detail) return [];
    if (this.report) return [
      { label: 'Total assigned leads', value: this.report.assignedLeads, icon: 'leads', color: 'blue' },
      { label: 'Returned leads', value: this.report.returnedLeads, icon: 'returned', color: 'orange' },
      { label: 'Assigned stage', value: this.report.assignedStage, icon: 'stage', color: 'indigo' },
      { label: 'Following up', value: this.report.followingUp, icon: 'followup', color: 'purple' },
      { label: 'Win', value: this.report.bookedClients, icon: 'win', color: 'green' },
      { label: 'Lost', value: this.report.lost, icon: 'lost', color: 'red' },
      { label: 'Not interested', value: this.report.notInterested, icon: 'not-interested', color: 'gray' },
      { label: 'Accepted collections', value: this.report.totalCollection, money: true, icon: 'collection', color: 'teal' },
      { label: 'Collection count', value: this.report.collectionCount, icon: 'count', color: 'cyan' },
      { label: 'Commission', value: this.report.totalCommission, money: true, icon: 'commission', color: 'emerald' }
    ];
    const metrics = this.detail.metrics;
    return [
      { label: 'Total assigned leads', value: metrics.totalAssignedLeads, icon: 'leads', color: 'blue' },
      { label: 'Returned leads', value: metrics.returnedLeads, icon: 'returned', color: 'orange' },
      { label: 'Assigned stage', value: metrics.assignedStage, icon: 'stage', color: 'indigo' },
      { label: 'Following up', value: metrics.followingUp, icon: 'followup', color: 'purple' },
      { label: 'Win', value: metrics.positiveCustomers, icon: 'win', color: 'green' },
      { label: 'Lost', value: metrics.lost, icon: 'lost', color: 'red' },
      { label: 'Not interested', value: metrics.notInterested, icon: 'not-interested', color: 'gray' },
      { label: 'Accepted collections', value: metrics.approvedCollectionAmount, money: true, icon: 'collection', color: 'teal' },
      { label: 'Collection count', value: metrics.approvedCollectionCount, icon: 'count', color: 'cyan' },
      { label: 'Commission', value: metrics.commission, money: true, icon: 'commission', color: 'emerald' }
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
