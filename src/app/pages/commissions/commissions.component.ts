import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Commission } from '../../models/crm.models';
import { money } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Sales Earnings</p><h1>Commissions</h1></div>
    </section>

    <!-- Computed Commissions Earnings Summaries -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="mini-stat" style="background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; box-shadow: var(--shadow);">
        <span>Total Commission</span>
        <strong style="display: block; margin-top: 6px; font-size: 26px; font-weight: 800; color: var(--success-dark);">
          {{ money(totalCommission) }}
        </strong>
      </div>
    </div>

    <article class="panel">
      <h2>Disbursement Records</h2>
      <p style="color: var(--muted); font-size: 13px; margin-top: -12px; margin-bottom: 20px;">Detailed log of commission payouts and calculations per verified collection.</p>
      
      <div class="responsive-table">
        <table>
          <thead><tr><th>Sales Executive</th><th>Accepted Collection</th><th>Rate</th><th>Commission Amount</th><th>Result</th><th>Date</th></tr></thead>
          <tbody>
            <tr *ngFor="let row of commissions">
              <td><strong>{{ row.salesExecutive }}</strong></td>
              <td>{{ money(row.paymentAmount) }}</td>
              <td><span style="font-weight: 700; color: var(--brand);">{{ row.percentage }}%</span></td>
              <td><strong>{{ money(row.amount) }}</strong></td>
              <td>
                <span class="status-pill" [class.approved]="row.status !== 2" [class.rejected]="row.status === 2">
                  {{ row.status === 2 ? 'Reversed' : 'Commission' }}
                </span>
              </td>
              <td>{{ row.createdAt | date }}</td>
            </tr>
            <tr *ngIf="!commissions.length">
              <td colspan="6" class="empty-table">No commission records found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  `
})
export class CommissionsComponent implements OnInit {
  private api = inject(ApiService);
  commissions: Commission[] = [];
  money = money;

  get totalCommission(): number {
    return this.commissions.filter(c => c.status !== 2).reduce((sum, row) => sum + (row.amount || 0), 0);
  }

  ngOnInit() { this.api.commissions().subscribe(data => this.commissions = data); }
}
