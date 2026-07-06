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

    <article class="panel">
      <table>
        <thead><tr><th>Invoice</th><th>Customer</th><th>Sales Executive</th><th>Amount</th><th>Status</th><th>Due Date</th></tr></thead>
        <tbody>
          <tr *ngFor="let invoice of invoices">
            <td>{{ invoice.invoiceNumber }}</td><td>{{ invoice.customer }}</td><td>{{ invoice.salesExecutive }}</td><td>{{ money(invoice.finalAmount) }}</td><td><span class="badge">{{ label(invoiceStatus, invoice.status) }}</span></td><td>{{ invoice.dueDate | date }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  `
})
export class InvoicesComponent implements OnInit {
  private api = inject(ApiService);
  invoices: Invoice[] = [];
  label = label;
  money = money;
  invoiceStatus = invoiceStatus;
  ngOnInit() { this.load(); }
  load() { this.api.invoices().subscribe(data => this.invoices = data); }
}
