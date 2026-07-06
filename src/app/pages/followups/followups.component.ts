import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { FollowUp } from '../../models/crm.models';

const followUpTypes = ['WhatsApp', 'Call', 'Facebook', 'Meeting', 'Office', 'Site Visit', 'SMS', 'Email', 'Other'];
const proofTypes = ['WhatsApp Screenshot', 'Call Recording', 'Facebook Screenshot', 'Payment Proof', 'Other'];

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Sales Activity</p><h1>Follow-up Updates</h1></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <article class="panel">
      <table>
        <thead><tr><th>Lead</th><th>Sales Executive</th><th>Type</th><th>Summary</th><th>Response</th><th>Next</th><th>Proofs</th></tr></thead>
        <tbody>
          <tr *ngFor="let item of followUps">
            <td>{{ item.lead }}</td>
            <td>{{ item.salesExecutive }}</td>
            <td><span class="badge">{{ typeLabel(item.type) }}</span></td>
            <td>{{ item.summary }}</td>
            <td>{{ item.customerResponse || '-' }}</td>
            <td>{{ item.nextFollowUpAt | date }}</td>
            <td>
              <ng-container *ngIf="item.proofs?.length; else noProof">
                <a *ngFor="let proof of item.proofs" [href]="proof.fileUrl" target="_blank">{{ proofLabel(proof.proofType) }}</a>
              </ng-container>
              <ng-template #noProof>-</ng-template>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  `
})
export class FollowupsComponent implements OnInit {
  private api = inject(ApiService);
  followUps: FollowUp[] = [];

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.followUps().subscribe(data => this.followUps = data);
  }

  typeLabel(value: number) {
    return followUpTypes[value] ?? String(value);
  }

  proofLabel(value: number) {
    return proofTypes[value] ?? 'Proof';
  }
}
