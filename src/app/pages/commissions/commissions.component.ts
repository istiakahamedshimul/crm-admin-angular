import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Commission } from '../../models/crm.models';
import { commissionStatus, label, money } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Sales Earnings</p><h1>Commissions</h1></div>
    </section>
    <article class="panel">
      <table>
        <thead><tr><th>Sales Executive</th><th>Payment</th><th>Rate</th><th>Commission</th><th>Status</th><th>Date</th></tr></thead>
        <tbody><tr *ngFor="let row of commissions"><td>{{ row.salesExecutive }}</td><td>{{ money(row.paymentAmount) }}</td><td>{{ row.percentage }}%</td><td>{{ money(row.amount) }}</td><td><span class="badge">{{ label(commissionStatus, row.status) }}</span></td><td>{{ row.createdAt | date }}</td></tr></tbody>
      </table>
    </article>
  `
})
export class CommissionsComponent implements OnInit {
  private api = inject(ApiService);
  commissions: Commission[] = [];
  label = label;
  money = money;
  commissionStatus = commissionStatus;
  ngOnInit() { this.api.commissions().subscribe(data => this.commissions = data); }
}
