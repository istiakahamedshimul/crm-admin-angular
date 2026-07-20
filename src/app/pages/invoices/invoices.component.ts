import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Invoice } from '../../models/crm.models';
import { invoiceStatus, label, money } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Billing</p><h1>Invoices</h1></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <!-- Computed Invoice Financial Summary Panels -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="mini-stat" style="background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; box-shadow: var(--shadow);">
        <span>Total Invoiced</span>
        <strong style="display: block; margin-top: 6px; font-size: 26px; font-weight: 800; color: var(--text-dark);">
          {{ money(totalAmount) }}
        </strong>
      </div>
      <div class="mini-stat" style="background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; box-shadow: var(--shadow);">
        <span>Total Invoices Issued</span>
        <strong style="display: block; margin-top: 6px; font-size: 26px; font-weight: 800; color: var(--text-dark);">
          {{ invoices.length }}
        </strong>
      </div>
      <div class="mini-stat" style="background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; box-shadow: var(--shadow);">
        <span>Paid Invoices</span>
        <strong style="display: block; margin-top: 6px; font-size: 26px; font-weight: 800; color: var(--success-dark);">
          {{ paidCount }}
        </strong>
      </div>
      <div class="mini-stat" style="background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; box-shadow: var(--shadow);">
        <span>Unpaid / Overdue</span>
        <strong style="display: block; margin-top: 6px; font-size: 26px; font-weight: 800; color: var(--danger-dark);">
          {{ invoices.length - paidCount }}
        </strong>
      </div>
    </div>

    <article class="panel">
      <div class="responsive-table">
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Sales Executive</th><th>Amount</th><th>Status</th><th>Due Date</th><th style="text-align: right;">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let invoice of invoices">
              <td><strong>{{ invoice.invoiceNumber }}</strong></td>
              <td>{{ invoice.customer }}</td>
              <td>{{ invoice.salesExecutive }}</td>
              <td><strong>{{ money(invoice.finalAmount) }}</strong></td>
              <td>
                <span class="status-pill" [class.approved]="invoice.status === 1" [class.pending]="invoice.status === 0" [class.rejected]="invoice.status === 2">
                  {{ label(invoiceStatus, invoice.status) }}
                </span>
              </td>
              <td>{{ invoice.dueDate | date }}</td>
              <td style="text-align: right;" class="actions">
                <button type="button" class="ghost-button" (click)="simulatePrint(invoice.invoiceNumber)" style="min-height: 30px; font-size: 12px; padding: 0 10px; border-radius: 6px; display: inline-flex;">
                  Print
                </button>
                <button type="button" class="ghost-button" (click)="simulateSend(invoice.invoiceNumber)" style="min-height: 30px; font-size: 12px; padding: 0 10px; border-radius: 6px; display: inline-flex;">
                  Send
                </button>
              </td>
            </tr>
            <tr *ngIf="!invoices.length">
              <td colspan="7" class="empty-table">No invoices found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  `
})
export class InvoicesComponent implements OnInit {
  private api = inject(ApiService);
  invoices: Invoice[] = [];
  label = label;
  money = money;
  invoiceStatus = invoiceStatus;

  get totalAmount(): number {
    return this.invoices.reduce((acc, curr) => acc + (curr.finalAmount || 0), 0);
  }

  get paidCount(): number {
    return this.invoices.filter(i => i.status === 1).length;
  }

  ngOnInit() { this.load(); }
  load() { this.api.invoices().subscribe(data => this.invoices = data); }

  simulatePrint(invoiceNum: string) {
    alert(`Printing invoice ${invoiceNum}...`);
  }

  simulateSend(invoiceNum: string) {
    alert(`Sending invoice ${invoiceNum} notification to customer...`);
  }
}
