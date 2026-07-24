import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Payment } from '../../models/crm.models';
import { label, money, paymentStatus } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Verification</p>
        <h1>Collections Dashboard</h1>
      </div>
      <button type="button" class="ghost-button refresh-btn" (click)="load()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="refresh-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        <span>Refresh</span>
      </button>
    </section>

    <!-- Metrics Summary Cards -->
    <div class="metrics-row">
      <div class="metric-card-compact success-card">
        <div class="card-icon success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
          </svg>
        </div>
        <div class="card-info">
          <span class="card-title">Verified Collections</span>
          <strong class="card-value text-success">{{ money(approvedSum) }}</strong>
        </div>
      </div>

      <div class="metric-card-compact warning-card">
        <div class="card-icon warning-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div class="card-info">
          <span class="card-title">Pending Verification</span>
          <strong class="card-value text-warning">{{ pendingCount }}</strong>
        </div>
      </div>

      <div class="metric-card-compact danger-card">
        <div class="card-icon danger-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75 14.25 14.25m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <div class="card-info">
          <span class="card-title">Rejected / Reversed</span>
          <strong class="card-value text-danger">{{ money(-rejectedSum) }}</strong>
        </div>
      </div>
    </div>

    <!-- Filter Tab & Search Controls Bar -->
    <div class="toolbar-row">
      <div class="filter-tabs">
        <button type="button" class="tab-button" [class.active]="activeTab === 'all'" (click)="activeTab = 'all'">
          <span>All</span>
          <span class="tab-badge">{{ countAll }}</span>
        </button>
        <button type="button" class="tab-button" [class.active]="activeTab === 'pending'" (click)="activeTab = 'pending'">
          <span>Pending</span>
          <span class="tab-badge warning">{{ countPending }}</span>
        </button>
        <button type="button" class="tab-button" [class.active]="activeTab === 'approved'" (click)="activeTab = 'approved'">
          <span>Approved</span>
          <span class="tab-badge success">{{ countApproved }}</span>
        </button>
        <button type="button" class="tab-button" [class.active]="activeTab === 'rejected'" (click)="activeTab = 'rejected'">
          <span>Rejected</span>
          <span class="tab-badge danger">{{ countRejected }}</span>
        </button>
      </div>

      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select [(ngModel)]="period" aria-label="Collection period" style="min-width:145px">
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
          <option value="overall">Overall</option>
          <option value="custom">Custom range</option>
        </select>
        <ng-container *ngIf="period === 'custom'">
          <input type="date" [(ngModel)]="customFrom" aria-label="From date">
          <input type="date" [(ngModel)]="customTo" aria-label="To date">
        </ng-container>
      </div>

      <div class="search-box">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
        </svg>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search by customer, exec, receipt..." />
      </div>
    </div>

    <!-- Main List Panel -->
    <article class="panel table-panel">
      <div class="panel-header">
        <div>
          <h2>Collection Review</h2>
          <p class="panel-subtitle">Review and verify payment receipts submitted by the sales team.</p>
        </div>
        <p class="error" *ngIf="actionError">{{ actionError }}</p>
      </div>

      <div class="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Receipt / Customer</th>
              <th>Sales Executive</th>
              <th class="text-right">Amount</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let payment of filteredPayments" class="table-row-hover">
              <td>
                <div class="customer-info">
                  <span class="customer-name">{{ payment.customer }}</span>
                  <code class="receipt-number">{{ payment.collectionNumber }}</code>
                  <span style="display:block;color:var(--muted);font-size:11px;margin-top:3px">{{ payment.createdAt | date:'mediumDate' }}</span>
                </div>
                <div *ngIf="payment.status === 2" class="rejection-reason-inline">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:12px; height:12px; flex-shrink:0;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <span><strong>Reason:</strong> {{ payment.rejectReason || 'No reason recorded' }}</span>
                </div>
              </td>
              <td>
                <span class="exec-name">{{ payment.salesExecutive }}</span>
              </td>
              <td class="text-right">
                <strong class="amount-value" [class.text-danger]="payment.status === 2">{{ money(payment.amount) }}</strong>
              </td>
              <td class="text-center">
                <span class="status-pill" [class.approved]="payment.status === 1" [class.pending]="payment.status === 0" [class.rejected]="payment.status === 2">
                  {{ label(paymentStatus, payment.status) }}
                </span>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <a *ngIf="payment.proofUrl" [href]="payment.proofUrl" target="_blank" class="action-btn view-receipt-btn" title="View Receipt">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span>Receipt</span>
                  </a>
                  
                  <button *ngIf="payment.status === 0" type="button" class="action-btn approve-btn" (click)="approve(payment.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>Approve</span>
                  </button>
                  
                  <button *ngIf="payment.status !== 2" type="button" class="action-btn reject-btn" (click)="openReject(payment)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span>{{ payment.status === 1 ? 'Reverse' : 'Reject' }}</span>
                  </button>
                  
                  <span *ngIf="payment.status === 2" class="finalized-label">Finalized</span>
                </div>
              </td>
            </tr>
            <tr *ngIf="!filteredPayments.length">
              <td colspan="5" class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
                <p>No collections match your criteria.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <!-- Reject Confirmation Modal Dialog -->
    <div *ngIf="rejectingPayment" class="modal-overlay" (click)="closeReject()">
      <form class="modal-box" (click)="$event.stopPropagation()" (ngSubmit)="confirmReject()">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Collection Decision</p>
            <h2>Reject Collection</h2>
          </div>
          <button type="button" class="ghost-button modal-close-btn" (click)="closeReject()">Close</button>
        </div>
        
        <div *ngIf="rejectingPayment.status === 1" class="modal-warning-banner">
          This payment was already approved. Rejecting it will subtract <strong>{{ money(abs(rejectingPayment.amount)) }}</strong> from verified collections and reverse its corresponding sales commission.
        </div>
        
        <label class="modal-form-label">
          Reason for rejection
          <textarea name="rejectReason" [(ngModel)]="rejectReason" rows="4" maxlength="500" required
            placeholder="Explain why this collection is being rejected..." class="modal-textarea"></textarea>
        </label>
        
        <p class="error" *ngIf="rejectError">{{ rejectError }}</p>
        
        <div class="modal-footer">
          <button type="button" class="ghost-button" (click)="closeReject()">Cancel</button>
          <button type="submit" class="danger" [disabled]="rejecting || !rejectReason.trim()">
            {{ rejecting ? 'Rejecting...' : 'Confirm final rejection' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .metric-card-compact {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: var(--shadow);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .metric-card-compact:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }

    .card-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-icon svg {
      width: 22px;
      height: 22px;
    }

    .success-card {
      background: linear-gradient(135deg, var(--success-bg) 0%, rgba(16, 185, 129, 0.04) 100%);
      border-color: rgba(16, 185, 129, 0.15);
    }
    
    .success-icon {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success-dark);
    }

    .warning-card {
      background: linear-gradient(135deg, var(--warning-bg) 0%, rgba(245, 158, 11, 0.04) 100%);
      border-color: rgba(245, 158, 11, 0.15);
    }

    .warning-icon {
      background: rgba(245, 158, 11, 0.1);
      color: var(--warning-dark);
    }

    .danger-card {
      background: linear-gradient(135deg, var(--danger-bg) 0%, rgba(239, 68, 68, 0.04) 100%);
      border-color: rgba(239, 68, 68, 0.15);
    }

    .danger-icon {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger-dark);
    }

    .card-info {
      display: flex;
      flex-direction: column;
    }

    .card-title {
      font-size: 11px;
      color: var(--muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-value {
      font-size: 22px;
      font-weight: 800;
      margin-top: 2px;
    }

    .text-success { color: var(--success-dark); }
    .text-warning { color: var(--warning-dark); }
    .text-danger { color: var(--danger-dark); }

    /* Refresh Button */
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

    /* Toolbar Row */
    .toolbar-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-tabs {
      display: flex;
      gap: 4px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--line);
    }

    .tab-button {
      min-height: 32px;
      padding: 0 12px;
      border-radius: 6px;
      background: transparent;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
      box-shadow: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      border: none;
    }

    .tab-button:hover {
      background: rgba(15, 118, 110, 0.05);
      color: var(--brand);
      transform: none;
      box-shadow: none;
    }

    .tab-button.active {
      background: var(--brand);
      color: #fff;
      box-shadow: 0 2px 4px rgba(15, 118, 110, 0.12);
    }

    .tab-button.active:hover {
      background: var(--brand-dark);
      color: #fff;
    }

    .tab-badge {
      font-size: 10px;
      font-weight: 700;
      background: rgba(15, 23, 42, 0.08);
      color: var(--text);
      padding: 1px 6px;
      border-radius: 10px;
      transition: all 0.15s ease;
    }

    .tab-button.active .tab-badge {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }

    /* Search Box */
    .search-box {
      position: relative;
      width: 280px;
    }

    @media (max-width: 640px) {
      .toolbar-row {
        flex-direction: column;
        align-items: stretch;
      }
      .search-box {
        width: 100%;
      }
      .filter-tabs {
        overflow-x: auto;
      }
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: var(--muted);
      pointer-events: none;
    }

    .search-box input {
      padding-left: 36px;
      height: 38px;
      min-height: 38px;
      font-size: 13px;
      border-radius: 8px;
    }

    /* Table Adjustments */
    .table-panel {
      padding: 0;
      overflow: hidden;
      border-radius: 12px;
      background: var(--panel);
    }

    .panel-header {
      padding: 18px 20px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .panel-header h2 {
      margin-bottom: 4px;
    }

    .panel-header h2::before {
      display: none;
    }

    .panel-subtitle {
      color: var(--muted);
      font-size: 12px;
      margin: 0;
    }

    .responsive-table {
      border: 0;
      border-radius: 0;
    }

    table th {
      background: #f8fafc;
      padding: 10px 16px;
      font-size: 11px;
      color: var(--muted);
    }

    table td {
      padding: 10px 16px;
      height: 52px;
    }

    .table-row-hover:hover td {
      background: rgba(248, 250, 252, 0.7);
    }

    .customer-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .customer-name {
      font-weight: 700;
      color: var(--text-dark);
      font-size: 14px;
    }

    .receipt-number {
      font-size: 10px;
      color: var(--muted);
      font-family: monospace;
    }

    .rejection-reason-inline {
      margin-top: 4px;
      font-size: 11px;
      color: var(--danger-dark);
      background: var(--danger-bg);
      border: 1px solid rgba(239, 68, 68, 0.1);
      padding: 3px 8px;
      border-radius: 6px;
      max-width: fit-content;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .exec-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
    }

    .amount-value {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-dark);
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* Action Buttons */
    .row-actions {
      display: inline-flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
    }

    .action-btn {
      min-height: 28px;
      height: 28px;
      padding: 0 10px;
      font-size: 12px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      border: 1px solid transparent;
      box-shadow: none;
      cursor: pointer;
    }

    .action-btn svg {
      width: 14px;
      height: 14px;
    }

    .view-receipt-btn {
      background: #f1f5f9;
      color: var(--text);
      border-color: var(--line);
      text-decoration: none;
    }

    .view-receipt-btn:hover {
      background: #e2e8f0;
      color: var(--text-dark);
      transform: translateY(-1px);
    }

    .approve-btn {
      background: var(--success-bg);
      color: var(--success-dark);
      border-color: rgba(16, 185, 129, 0.2);
    }

    .approve-btn:hover {
      background: var(--success);
      color: white;
      border-color: var(--success);
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.15);
      transform: translateY(-1px);
    }

    .reject-btn {
      background: var(--danger-bg);
      color: var(--danger-dark);
      border-color: rgba(239, 68, 68, 0.2);
    }

    .reject-btn:hover {
      background: var(--danger-dark);
      color: white;
      border-color: var(--danger-dark);
      box-shadow: 0 2px 4px rgba(220, 38, 38, 0.15);
      transform: translateY(-1px);
    }

    .finalized-label {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
    }

    .empty-state {
      text-align: center;
      padding: 36px !important;
      color: var(--muted);
    }

    .empty-state svg {
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
      opacity: 0.5;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .empty-state p {
      font-size: 13px;
      margin: 0;
    }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-box {
      width: min(480px, 100%);
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05);
      border: 1px solid var(--line);
      animation: modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalScaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }

    .modal-header h2 {
      margin: 0;
    }

    .modal-header h2::before {
      display: none;
    }

    .modal-close-btn {
      min-height: 32px;
      height: 32px;
      padding: 0 12px;
      font-size: 13px;
    }

    .modal-warning-banner {
      margin: 16px 0;
      background: var(--warning-bg);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 10px;
      padding: 12px 14px;
      color: var(--warning-dark);
      font-size: 13px;
      line-height: 1.5;
    }

    .modal-form-label {
      display: block;
      margin-top: 16px;
      font-weight: 700;
      color: var(--text-dark);
    }

    .modal-textarea {
      width: 100%;
      margin-top: 8px;
      resize: vertical;
      font-size: 14px;
      border-radius: 8px;
      border-color: var(--line);
    }

    .modal-textarea:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px var(--brand-glow);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .modal-footer button {
      min-height: 38px;
      height: 38px;
      font-size: 13px;
    }
  `]
})
export class PaymentsComponent implements OnInit {
  private api = inject(ApiService);
  payments: Payment[] = [];
  label = label;
  money = money;
  paymentStatus = paymentStatus;
  abs = Math.abs;
  rejectingPayment: Payment | null = null;
  rejectReason = '';
  rejectError = '';
  actionError = '';
  rejecting = false;

  // Search & Filter state
  searchQuery = '';
  activeTab: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  period: 'week' | 'month' | 'year' | 'overall' | 'custom' = 'month';
  customFrom = '';
  customTo = '';

  get approvedSum(): number {
    return this.periodPayments.filter(p => p.status === 1).reduce((sum, payment) => sum + Math.abs(payment.amount || 0), 0);
  }

  get pendingCount(): number {
    return this.periodPayments.filter(p => p.status === 0).length;
  }

  get rejectedSum(): number {
    return this.periodPayments.filter(p => p.status === 2).reduce((sum, payment) => sum + Math.abs(payment.amount || 0), 0);
  }

  // Count Getters for Tabs
  get countAll(): number {
    return this.periodPayments.length;
  }

  get countPending(): number {
    return this.pendingCount;
  }

  get countApproved(): number {
    return this.periodPayments.filter(p => p.status === 1).length;
  }

  get countRejected(): number {
    return this.periodPayments.filter(p => p.status === 2).length;
  }

  get periodPayments(): Payment[] {
    if (this.period === 'overall') return this.payments;
    const now = new Date();
    let start: Date;
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    if (this.period === 'week') {
      const day = now.getDay();
      const daysSinceMonday = day === 0 ? 6 : day - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
    } else if (this.period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (this.period === 'custom') {
      if (!this.customFrom && !this.customTo) return this.payments;
      start = this.customFrom ? new Date(this.customFrom + 'T00:00:00') : new Date(0);
      end = this.customTo ? new Date(this.customTo + 'T23:59:59.999') : end;
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return this.payments.filter(payment => {
      const created = new Date(payment.createdAt);
      return created >= start && created < end;
    });
  }

  // Client-filtered list of payments
  get filteredPayments(): Payment[] {
    return this.periodPayments.filter(p => {
      // 1. Filter by status tab
      if (this.activeTab === 'pending' && p.status !== 0) return false;
      if (this.activeTab === 'approved' && p.status !== 1) return false;
      if (this.activeTab === 'rejected' && p.status !== 2) return false;

      // 2. Filter by search query
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        return (
          p.customer.toLowerCase().includes(query) ||
          p.collectionNumber.toLowerCase().includes(query) ||
          p.salesExecutive.toLowerCase().includes(query) ||
          p.amount.toString().includes(query)
        );
      }
      return true;
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.api.payments().subscribe(data => this.payments = data);
  }

  approve(id: number) {
    this.actionError = '';
    this.api.approvePayment(id).subscribe({
      next: () => this.load(),
      error: err => this.actionError = err.error?.message || 'Could not approve this collection.'
    });
  }

  openReject(payment: Payment) {
    this.rejectingPayment = payment;
    this.rejectReason = '';
    this.rejectError = '';
  }

  closeReject() {
    if (this.rejecting) return;
    this.rejectingPayment = null;
    this.rejectReason = '';
    this.rejectError = '';
  }

  confirmReject() {
    if (!this.rejectingPayment || !this.rejectReason.trim()) return;
    this.rejecting = true;
    this.rejectError = '';
    this.api.rejectPayment(this.rejectingPayment.id, this.rejectReason.trim()).subscribe({
      next: () => {
        this.rejecting = false;
        this.closeReject();
        this.load();
      },
      error: err => {
        this.rejecting = false;
        this.rejectError = err.error?.message || 'Could not reject this collection.';
      }
    });
  }
}
