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
      <div><p class="eyebrow">Verification</p><h1>Collections</h1></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px">
      <div class="mini-stat" style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px 20px;box-shadow:var(--shadow)">
        <span>Total verified collections</span>
        <strong style="display:block;margin-top:6px;font-size:26px;color:var(--success-dark)">{{ money(approvedSum) }}</strong>
      </div>
      <div class="mini-stat" style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px 20px;box-shadow:var(--shadow)">
        <span>Pending verification</span>
        <strong style="display:block;margin-top:6px;font-size:26px;color:var(--warning-dark)">{{ pendingCount }}</strong>
      </div>
      <div class="mini-stat" style="background:#fff7f7;border:1px solid #fecaca;border-radius:12px;padding:18px 20px;box-shadow:var(--shadow)">
        <span>Rejected / reversed</span>
        <strong style="display:block;margin-top:6px;font-size:26px;color:#b42318">{{ money(-rejectedSum) }}</strong>
      </div>
    </div>

    <article class="panel">
      <h2>Collection review</h2>
      <p style="color:var(--muted);font-size:13px;margin-top:-12px;margin-bottom:20px">
        Approved collections can be rejected later and reversed. A rejected collection is final.
      </p>
      <p class="error" *ngIf="actionError">{{ actionError }}</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
        <article *ngFor="let payment of payments"
          style="border:1px solid var(--line);border-radius:14px;padding:18px;background:var(--bg);display:flex;flex-direction:column;gap:13px"
          [style.border-color]="payment.status === 2 ? '#fecaca' : payment.status === 1 ? '#bbf7d0' : 'var(--line)'">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
            <div>
              <strong style="display:block;font-size:16px">{{ payment.customer }}</strong>
              <code style="font-size:11px;color:var(--muted)">{{ payment.collectionNumber }}</code>
            </div>
            <span class="status-pill" [class.approved]="payment.status === 1" [class.pending]="payment.status === 0" [class.rejected]="payment.status === 2">
              {{ label(paymentStatus, payment.status) }}
            </span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:end;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:12px 0">
            <div><span style="display:block;color:var(--muted);font-size:12px">Sales executive</span><strong>{{ payment.salesExecutive }}</strong></div>
            <strong style="font-size:21px" [style.color]="payment.status === 2 ? '#b42318' : 'var(--text-dark)'">{{ money(payment.amount) }}</strong>
          </div>

          <div *ngIf="payment.status === 2" style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:11px;color:#9f1239;font-size:13px">
            <strong style="display:block;margin-bottom:3px">Rejection reason</strong>
            {{ payment.rejectReason || 'No reason recorded' }}
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a *ngIf="payment.proofUrl" [href]="payment.proofUrl" target="_blank" class="ghost-button"
              style="text-decoration:none;display:inline-flex;align-items:center">View receipt</a>
            <button *ngIf="payment.status === 0" type="button" (click)="approve(payment.id)">Approve</button>
            <button *ngIf="payment.status !== 2" type="button" class="danger" (click)="openReject(payment)">
              {{ payment.status === 1 ? 'Reject & reverse' : 'Reject' }}
            </button>
            <span *ngIf="payment.status === 2" style="font-size:12px;color:var(--muted);align-self:center">Final — no further action</span>
          </div>
        </article>
      </div>
      <div *ngIf="!payments.length" class="empty-card">No collection records found.</div>
    </article>

    <div *ngIf="rejectingPayment" (click)="closeReject()"
      style="position:fixed;inset:0;background:rgba(15,23,42,.58);z-index:1000;display:grid;place-items:center;padding:20px">
      <form (click)="$event.stopPropagation()" (ngSubmit)="confirmReject()"
        style="width:min(480px,100%);background:white;border-radius:18px;padding:24px;box-shadow:0 24px 60px rgba(15,23,42,.25)">
        <div style="display:flex;justify-content:space-between;gap:16px">
          <div><p class="eyebrow">Collection decision</p><h2 style="margin:0">Reject collection</h2></div>
          <button type="button" class="ghost-button" (click)="closeReject()">Close</button>
        </div>
        <div *ngIf="rejectingPayment.status === 1"
          style="margin:16px 0;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;color:#9a3412;font-size:13px">
          This was approved. Rejection subtracts {{ money(abs(rejectingPayment.amount)) }} from verified collections and reverses its commission.
        </div>
        <label style="display:block;margin-top:16px;font-weight:700">Reason for rejection
          <textarea name="rejectReason" [(ngModel)]="rejectReason" rows="4" maxlength="500" required
            placeholder="Explain why this collection is being rejected..."
            style="width:100%;margin-top:8px;resize:vertical"></textarea>
        </label>
        <p class="error" *ngIf="rejectError">{{ rejectError }}</p>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px">
          <button type="button" class="ghost-button" (click)="closeReject()">Cancel</button>
          <button type="submit" class="danger" [disabled]="rejecting || !rejectReason.trim()">
            {{ rejecting ? 'Rejecting...' : 'Confirm final rejection' }}
          </button>
        </div>
      </form>
    </div>
  `
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

  get approvedSum(): number {
    return this.payments.filter(p => p.status === 1).reduce((sum, payment) => sum + Math.abs(payment.amount || 0), 0);
  }

  get pendingCount(): number {
    return this.payments.filter(p => p.status === 0).length;
  }

  get rejectedSum(): number {
    return this.payments.filter(p => p.status === 2).reduce((sum, payment) => sum + Math.abs(payment.amount || 0), 0);
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
