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
      <div><p class="eyebrow">Verification</p><h1>Manual Payments</h1></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <article class="panel">
      <table>
        <thead><tr><th>Customer</th><th>Invoice</th><th>Sales Executive</th><th>Amount</th><th>Status</th><th>Proof</th><th>Action</th></tr></thead>
        <tbody>
          <tr *ngFor="let payment of payments">
            <td>{{ payment.customer }}</td>
            <td>{{ payment.invoiceNumber }}</td>
            <td>{{ payment.salesExecutive }}</td>
            <td>{{ money(payment.amount) }}</td>
            <td><span class="badge">{{ label(paymentStatus, payment.status) }}</span></td>
            <td><a *ngIf="payment.proofUrl" [href]="payment.proofUrl" target="_blank">View</a><span *ngIf="!payment.proofUrl">-</span></td>
            <td class="actions">
              <button type="button" (click)="approve(payment.id)" [disabled]="payment.status === 1">Approve</button>
              <button type="button" class="danger" (click)="reject(payment.id)" [disabled]="payment.status === 2">Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  `
})
export class PaymentsComponent implements OnInit {
  private api = inject(ApiService);
  payments: Payment[] = [];
  label = label;
  money = money;
  paymentStatus = paymentStatus;

  ngOnInit() { this.load(); }
  load() { this.api.payments().subscribe(data => this.payments = data); }
  approve(id: number) { this.api.approvePayment(id).subscribe(() => this.load()); }
  reject(id: number) {
    const reason = prompt('Reject reason') || 'Rejected by admin';
    this.api.rejectPayment(id, reason).subscribe(() => this.load());
  }
}
