import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { FollowUp, FollowUpProof } from '../../models/crm.models';

const followUpTypes = ['WhatsApp', 'Call', 'Facebook', 'Meeting', 'Office', 'Site Visit', 'SMS', 'Email', 'Other'];
const proofTypes = ['WhatsApp Screenshot', 'Call Recording', 'Facebook Screenshot', 'Payment Proof', 'Other'];
type CustomerGroup = { key: string; name: string; latest: FollowUp; history: FollowUp[] };

@Component({
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .followup-toolbar{display:flex;align-items:center;gap:12px;margin-bottom:18px}.followup-toolbar h2{margin:0}.back-btn{background:#eef4f4;color:#115e59}
    .table-wrap{overflow-x:auto}.executive-link{padding:0;background:none;color:#0f766e;min-height:auto;text-align:left;text-decoration:underline;text-underline-offset:3px}
    .proof-list{display:flex;flex-wrap:wrap;gap:7px;min-width:150px}.proof-chip{min-height:32px;padding:0 10px;background:#edf4ff;color:#1d4ed8;font-size:12px}
    .audio-proof{width:220px;height:36px}.muted{color:#64717d}.summary-cell{min-width:190px}.customer-cell{min-width:145px}.view-all{white-space:nowrap}
    .proof-modal{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.84);backdrop-filter:blur(5px)}
    .proof-viewer{position:relative;width:min(1000px,96vw);max-height:92vh;padding:18px;border-radius:14px;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.35)}
    .proof-viewer img{display:block;max-width:100%;max-height:78vh;margin:auto;border-radius:8px;object-fit:contain}.proof-caption{margin:12px 48px 0 0;font-weight:800}
    .close-proof{position:absolute;right:14px;top:12px;width:38px;padding:0;border-radius:50%;background:#eef2f6;color:#17202a;font-size:24px}
  `],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Sales Activity</p><h1>Follow-up Updates</h1><p class="page-copy">All activity is ordered by the latest submission.</p></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <article class="panel">
      <div class="followup-toolbar" *ngIf="selectedExecutive">
        <button class="back-btn" type="button" (click)="back()">Back</button>
        <div><h2>{{ selectedCustomer ? selectedCustomer.name + ' — All follow-ups' : selectedExecutive + ' — Customers' }}</h2>
          <small class="muted">{{ selectedCustomer ? 'Complete customer history' : 'Latest follow-up for every customer handled' }}</small></div>
      </div>
      <div class="followup-toolbar" *ngIf="!selectedExecutive"><h2>All Follow-ups</h2></div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Lead / Customer</th><th>Sales Executive</th><th>Type</th><th>Summary</th><th>Response</th><th>Next</th><th>Proofs</th><th *ngIf="selectedExecutive && !selectedCustomer"></th></tr></thead>
          <tbody>
            <tr *ngFor="let item of displayedFollowUps">
              <td class="customer-cell"><strong>{{ item.customer || item.lead }}</strong><small>{{ item.createdAt | date:'medium' }}</small></td>
              <td><button *ngIf="!selectedExecutive; else executiveText" class="executive-link" type="button" (click)="openExecutive(item.salesExecutive)">{{ item.salesExecutive }}</button><ng-template #executiveText>{{ item.salesExecutive }}</ng-template></td>
              <td><span class="badge">{{ typeLabel(item.type) }}</span></td><td class="summary-cell">{{ item.summary }}</td><td>{{ item.customerResponse || '-' }}</td><td>{{ item.nextFollowUpAt ? (item.nextFollowUpAt | date:'medium') : '-' }}</td>
              <td><div class="proof-list" *ngIf="item.proofs?.length; else noProof"><ng-container *ngFor="let proof of item.proofs">
                <audio *ngIf="isAudio(proof); else proofButton" class="audio-proof" controls preload="metadata" [src]="proofUrl(proof)"></audio>
                <ng-template #proofButton><button class="proof-chip" type="button" (click)="openProof(proof)">{{ proofLabel(proof.proofType) }}</button></ng-template>
              </ng-container></div><ng-template #noProof>-</ng-template></td>
              <td *ngIf="selectedExecutive && !selectedCustomer"><button class="view-all" type="button" (click)="openCustomer(item)">View all follow-ups</button></td>
            </tr>
            <tr *ngIf="!displayedFollowUps.length"><td [attr.colspan]="selectedExecutive && !selectedCustomer ? 8 : 7" class="empty-table">No follow-up updates found.</td></tr>
          </tbody>
        </table>
      </div>
    </article>

    <div class="proof-modal" *ngIf="selectedProof" (click)="selectedProof=undefined">
      <div class="proof-viewer" (click)="$event.stopPropagation()"><button class="close-proof" type="button" (click)="selectedProof=undefined">×</button>
        <img [src]="proofUrl(selectedProof)" [alt]="proofLabel(selectedProof.proofType)" (error)="proofError=true">
        <p class="error" *ngIf="proofError">The image could not be loaded. Confirm that the API uploads folder contains this file.</p>
        <p class="proof-caption">{{ proofLabel(selectedProof.proofType) }}</p>
      </div>
    </div>
  `
})
export class FollowupsComponent implements OnInit {
  private api = inject(ApiService);
  followUps: FollowUp[] = [];
  selectedExecutive?: string;
  selectedCustomer?: CustomerGroup;
  selectedProof?: FollowUpProof;
  proofError = false;

  ngOnInit() { this.load(); }
  get executiveCustomers(): CustomerGroup[] {
    if (!this.selectedExecutive) return [];
    const groups = new Map<string, FollowUp[]>();
    for (const item of this.followUps.filter(x => x.salesExecutive === this.selectedExecutive)) {
      const key = item.customerId ? `customer-${item.customerId}` : `lead-${item.leadId}`;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups].map(([key, history]) => ({ key, name: history[0].customer || history[0].lead, latest: history[0], history }));
  }
  get displayedFollowUps() {
    if (this.selectedCustomer) return this.selectedCustomer.history;
    if (this.selectedExecutive) return this.executiveCustomers.map(x => x.latest);
    return this.followUps;
  }
  load() { this.api.followUps().subscribe(data => { this.followUps = data.sort((a,b) => b.createdAt.localeCompare(a.createdAt)); this.selectedExecutive=undefined; this.selectedCustomer=undefined; }); }
  openExecutive(name: string) { this.selectedExecutive = name; this.selectedCustomer = undefined; }
  openCustomer(item: FollowUp) { this.selectedCustomer = this.executiveCustomers.find(x => x.key === (item.customerId ? `customer-${item.customerId}` : `lead-${item.leadId}`)); }
  back() { if (this.selectedCustomer) this.selectedCustomer=undefined; else this.selectedExecutive=undefined; }
  openProof(proof: FollowUpProof) { if (this.isImage(proof)) { this.proofError=false; this.selectedProof=proof; } else window.open(this.proofUrl(proof), '_blank', 'noopener'); }
  proofUrl(proof: FollowUpProof) { return this.api.proofUrl(proof.fileUrl); }
  extension(proof: FollowUpProof) { return this.proofUrl(proof).split('?')[0].split('.').pop()?.toLowerCase() ?? ''; }
  isAudio(proof: FollowUpProof) { return proof.proofType === 1 || ['mp3','m4a','wav','ogg','aac'].includes(this.extension(proof)); }
  isImage(proof: FollowUpProof) { return ['jpg','jpeg','png','gif','webp','bmp'].includes(this.extension(proof)); }
  typeLabel(value: number) { return followUpTypes[value] ?? String(value); }
  proofLabel(value: number) { return proofTypes[value] ?? 'Proof'; }
}
