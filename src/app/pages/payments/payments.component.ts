import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Payment } from '../../models/crm.models';
import { label, money, paymentStatus } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Verification</p><h1>Collections</h1></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <!-- Payments Summary stats -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="mini-stat" style="background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; box-shadow: var(--shadow);">
        <span>Total Verified Collections</span>
        <strong style="display: block; margin-top: 6px; font-size: 26px; font-weight: 800; color: var(--success-dark);">
          {{ money(approvedSum) }}
        </strong>
      </div>
      <div class="mini-stat" style="background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; box-shadow: var(--shadow);">
        <span>Pending Verifications Count</span>
        <strong style="display: block; margin-top: 6px; font-size: 26px; font-weight: 800; color: var(--warning-dark);">
          {{ pendingCount }}
        </strong>
      </div>
    </div>

    <article class="panel">
      <h2>Transaction Ledgers</h2>
      <p style="color: var(--muted); font-size: 13px; margin-top: -12px; margin-bottom: 20px;">Review payment screenshots/receipts and verify executive collections.</p>
      
      <div class="responsive-table">
        <table>
          <thead><tr><th>Customer</th><th>Collection No.</th><th>Sales Executive</th><th>Amount</th><th>Status</th><th>Receipt</th><th style="text-align: right;">Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let payment of payments">
              <td><strong>{{ payment.customer }}</strong></td>
              <td><code>{{ payment.collectionNumber }}</code></td>
              <td>{{ payment.salesExecutive }}</td>
              <td><strong>{{ money(payment.amount) }}</strong></td>
              <td>
                <span class="status-pill" [class.approved]="payment.status === 1" [class.pending]="payment.status === 0" [class.rejected]="payment.status === 2">
                  {{ label(paymentStatus, payment.status) }}
                </span>
              </td>
              <td>
                <a *ngIf="payment.proofUrl" [href]="payment.proofUrl" target="_blank" style="color: var(--brand); font-weight: 700; text-decoration: underline; text-underline-offset: 3px;">
                  View Receipt 📄
                </a>
                <span *ngIf="!payment.proofUrl" style="color: var(--muted); font-style: italic;">No attachment</span>
              </td>
              <td style="text-align: right;" class="actions">
                <button type="button" (click)="approve(payment.id)" [disabled]="payment.status === 1" style="min-height: 32px; font-size: 13px; padding: 0 12px; border-radius: 6px;">
                  Verify & Approve
                </button>
                <button type="button" class="danger" (click)="reject(payment.id)" [disabled]="payment.status === 2" style="min-height: 32px; font-size: 13px; padding: 0 12px; border-radius: 6px;">
                  Reject
                </button>
              </td>
            </tr>
            <tr *ngIf="!payments.length">
              <td colspan="7" class="empty-table">No payment logs found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  `
})
export class PaymentsComponent implements OnInit {
  private api = inject(ApiService);
  payments: Payment[] = [];
  label = label;
  money = money;
  paymentStatus = paymentStatus;

  get approvedSum(): number {
    return this.payments.filter(p => p.status === 1).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }

  get pendingCount(): number {
    return this.payments.filter(p => p.status === 0).length;
  }

  ngOnInit() { this.load(); }
  load() { this.api.payments().subscribe(data => this.payments = data); }
  approve(id: number) { this.api.approvePayment(id).subscribe(() => this.load()); }
  reject(id: number) {
    const reason = prompt('Reject reason') || 'Rejected by admin';
    this.api.rejectPayment(id, reason).subscribe(() => this.load());
  }
}
