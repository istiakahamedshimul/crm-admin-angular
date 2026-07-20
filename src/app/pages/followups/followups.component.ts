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
    .followup-toolbar{display:flex;align-items:center;gap:12px;margin-bottom:18px}.followup-toolbar h2{margin:0}.back-btn{background:var(--brand-light);color:var(--brand-dark)}
    .table-wrap{overflow-x:auto}.executive-link{padding:0;background:none;color:var(--brand);min-height:auto;text-align:left;text-decoration:underline;text-underline-offset:3px}
    .proof-list{display:flex;flex-wrap:wrap;gap:7px;min-width:150px}.proof-chip{min-height:30px;padding:0 10px;background:#eff6ff;color:#1d4ed8;border:1px solid #dbeafe;border-radius:6px;font-size:12px;display:inline-flex;align-items:center}
    .audio-proof{width:220px;height:36px}.muted{color:var(--muted)}.summary-cell{min-width:190px}.customer-cell{min-width:145px}.view-all{white-space:nowrap}
    .proof-modal{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:24px;background:rgba(9,13,22,.8);backdrop-filter:blur(8px)}
    .proof-viewer{position:relative;width:min(1000px,96vw);max-height:92vh;padding:24px;border-radius:16px;background:#fff;box-shadow:0 30px 60px rgba(0,0,0,0.3)}
    .proof-viewer img{display:block;max-width:100%;max-height:74vh;margin:auto;border-radius:8px;object-fit:contain}.proof-caption{margin:16px 48px 0 0;font-weight:700;color:var(--text-dark)}
    .close-proof{position:absolute;right:18px;top:18px;width:38px;padding:0;border-radius:50%;background:#f1f5f9;color:#475569;font-size:24px;border:1px solid #e2e8f0}
  `],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Sales Activity</p><h1>Follow-up Updates</h1><p class="page-copy">All activity is ordered by the latest submission.</p></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <article class="panel">
      <!-- Toolbar when executive/customer selected -->
      <div class="followup-toolbar" *ngIf="selectedExecutive" style="margin-bottom: 24px; display: flex; align-items: center; gap: 16px;">
        <button class="back-btn" type="button" (click)="back()" style="min-height: 36px; padding: 0 14px; border-radius: 6px;">Back</button>
        <div>
          <h2 style="font-size: 18px; font-weight: 700; color: var(--text-dark); margin: 0 0 2px;">{{ selectedCustomer ? selectedCustomer.name + ' — History' : selectedExecutive + ' — Customer List' }}</h2>
          <small class="muted" style="font-size: 12px; display: block; margin-top: 1px;">{{ selectedCustomer ? 'Complete customer touchpoint history' : 'Latest follow-up contact for each customer handled' }}</small>
        </div>
      </div>
      <div class="followup-toolbar" *ngIf="!selectedExecutive" style="margin-bottom: 24px;">
        <h2 style="font-size: 18px; font-weight: 700; color: var(--text-dark); margin: 0;">Chronological Activity Timeline</h2>
      </div>

      <!-- Modern Timeline Feed instead of Table -->
      <div class="timeline-feed" style="position: relative; padding: 10px 0 10px 24px; border-left: 2px solid var(--line); margin-left: 12px; display: flex; flex-direction: column; gap: 24px;">
        
        <div class="timeline-item" *ngFor="let item of displayedFollowUps" style="position: relative;">
          <!-- Node Indicator -->
          <div style="position: absolute; left: -31px; top: 12px; width: 12px; height: 12px; border-radius: 50%; background: white; border: 3px solid var(--brand); box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.15);"></div>
          
          <div style="background: var(--bg); border: 1px solid var(--line); border-radius: 12px; padding: 20px; transition: all 0.2s ease;">
            <!-- Header section of timeline card -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0;">{{ item.customer || item.lead }}</h3>
                <small class="muted" style="font-size: 11px;">🕒 {{ item.createdAt | date:'medium' }}</small>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span class="badge">{{ typeLabel(item.type) }}</span>
                <!-- Executive Link or Text -->
                <button *ngIf="!selectedExecutive; else executiveText" class="executive-link" type="button" (click)="openExecutive(item.salesExecutive)" style="font-size: 12px; font-weight: 700; border: 0; background: none; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; color: var(--brand);">
                  👤 {{ item.salesExecutive }}
                </button>
                <ng-template #executiveText><span style="font-size: 12px; color: var(--muted); font-weight: 600;">👤 {{ item.salesExecutive }}</span></ng-template>
              </div>
            </div>
            
            <!-- Summary Note & Response speech bubble -->
            <div style="background: white; border: 1px solid var(--line); border-radius: 8px; padding: 14px; margin-bottom: 12px;">
              <span class="muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; display: block; margin-bottom: 4px;">Update Summary</span>
              <p style="font-size: 14px; color: var(--text-dark); margin: 0; line-height: 1.5;">{{ item.summary }}</p>
              
              <div *ngIf="item.customerResponse" style="margin-top: 10px; border-top: 1px dashed var(--line); padding-top: 10px;">
                <span class="muted" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; display: block; margin-bottom: 2px;">Customer Response</span>
                <p style="font-size: 13px; color: #475569; margin: 0; font-style: italic;">"{{ item.customerResponse }}"</p>
              </div>
            </div>

            <!-- Meta details (Next Follow-up & Proofs) -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--line); padding-top: 12px;">
              <!-- Next Date -->
              <div style="font-size: 12px;">
                <span class="muted" style="font-weight: 600;">📅 Next follow-up:</span>
                <span style="font-weight: 700; color: var(--text-dark); margin-left: 4px;">{{ item.nextFollowUpAt ? (item.nextFollowUpAt | date:'medium') : 'None scheduled' }}</span>
              </div>
              
              <!-- Proofs section -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="proof-list" *ngIf="item.proofs?.length">
                  <ng-container *ngFor="let proof of item.proofs">
                    <audio *ngIf="isAudio(proof); else proofButton" class="audio-proof" controls preload="metadata" [src]="proofUrl(proof)"></audio>
                    <ng-template #proofButton>
                      <button class="proof-chip" type="button" (click)="openProof(proof)">
                        📁 {{ proofLabel(proof.proofType) }}
                      </button>
                    </ng-template>
                  </ng-container>
                </div>
                
                <!-- "View all followups" when in executive customers overview -->
                <button *ngIf="selectedExecutive && !selectedCustomer" class="view-btn" type="button" (click)="openCustomer(item)" style="min-height: 30px; font-size: 12px; font-weight: 700; padding: 0 12px; border-radius: 6px;">
                  View History →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!displayedFollowUps.length" class="empty-table" style="margin-top: 10px;">
          No follow-up updates found.
        </div>
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
