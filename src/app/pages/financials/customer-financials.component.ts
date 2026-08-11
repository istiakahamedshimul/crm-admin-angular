import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">CS / CA workspace</p><h1>Customer Financials</h1></div>
    </section>

    <div class="workspace-grid">
      <aside class="panel directory">
        <div class="tabs">
          <button type="button" [class.active]="view === 'accounts'" (click)="setView('accounts')">Customer Accounts</button>
          <button *ngIf="canAccessUnfiled" type="button" [class.active]="view === 'assign'" (click)="setView('assign')">Unfiled Customers <span>{{ customersWithoutFile.length }}</span></button>
        </div>

        <label class="search">Search
          <input [(ngModel)]="search" [placeholder]="view === 'assign' ? 'Name, phone or customer ID' : 'File ID, name or phone'">
        </label>

        <div class="customer-list">
          <button type="button" *ngFor="let customer of visibleCustomers" class="customer-row" [class.selected]="customer.id === customerId" (click)="openCustomer(customer)">
            <span class="avatar">{{ customer.name?.charAt(0) || 'C' }}</span>
            <span class="identity"><strong>{{ customer.name }}</strong><small>{{ customer.phone }}</small></span>
            <span class="file">{{ customer.fileId || 'No file ID' }}</span>
          </button>
          <div class="empty" *ngIf="!visibleCustomers.length">{{ view === 'assign' ? 'Every customer already has a file ID.' : 'No matching customer account.' }}</div>
        </div>
      </aside>

      <main class="details">
        <article class="panel empty-details" *ngIf="!selectedCustomer">Select a customer to view financial details.</article>
        <ng-container *ngIf="selectedCustomer">
          <article class="panel customer-head">
            <div><p class="eyebrow">{{ selectedCustomer.fileId || 'File ID pending' }}</p><h2>{{ selectedCustomer.name }}</h2><p>{{ selectedCustomer.phone }} · {{ selectedCustomer.email || 'No email' }}</p></div>
            <span class="status">{{ summary?.paymentStatus || 'Not configured' }}</span>
          </article>

          <form *ngIf="view === 'assign' && canAssignFile" class="panel assign-form" (ngSubmit)="saveFile()">
            <div><h2>Assign customer file ID</h2><p>Once assigned, this customer moves to Customer Accounts.</p></div>
            <label>File ID<input name="fileId" [(ngModel)]="fileId" required maxlength="100" placeholder="Example: RCG-2026-00125"></label>
            <button type="submit" [disabled]="saving || !fileId.trim()">{{ saving ? 'Saving…' : 'Assign File ID' }}</button>
          </form>

          <div class="metric-grid" *ngIf="summary">
            <article *ngFor="let card of cards" class="metric"><small>{{ card[0] }}</small><strong>{{ card[1] | number:'1.2-2' }}</strong></article>
          </div>

          <form *ngIf="canEditAgreement" class="panel agreement" (ngSubmit)="saveAgreement()">
            <div class="section-title"><div><h2>Financial agreement</h2><p>Authoritative collection amount and payment schedule.</p></div></div>
            <div class="fields">
              <label>Total agreed amount<input type="number" min="0.01" step="0.01" name="total" [(ngModel)]="agreement.totalAgreedAmount" required></label>
              <label>Booking amount<input type="number" min="0" step="0.01" name="booking" [(ngModel)]="agreement.bookingAmount"></label>
              <label>Payment plan<select name="plan" [(ngModel)]="agreement.paymentPlan"><option [ngValue]="0">Full payment</option><option [ngValue]="1">EMI</option></select></label>
              <label>Start / due date<input type="date" name="start" [(ngModel)]="agreement.emiStartDate" [required]="agreement.paymentPlan === 1"></label>
              <label *ngIf="agreement.paymentPlan === 1">Monthly EMI<input type="number" min="0.01" step="0.01" name="monthly" [(ngModel)]="agreement.monthlyEmiAmount" required></label>
              <label *ngIf="agreement.paymentPlan === 1">Installments<input type="number" min="1" name="count" [(ngModel)]="agreement.installmentCount" required></label>
              <label class="wide">Remarks<textarea rows="3" name="remarks" [(ngModel)]="agreement.remarks"></textarea></label>
            </div>
            <button type="submit" [disabled]="saving">{{ saving ? 'Saving…' : 'Save agreement & schedule' }}</button>
          </form>

          <article class="panel" *ngIf="history">
            <div class="section-title"><div><h2>Installment schedule</h2><p>Generated and calculated by the backend.</p></div></div>
            <div class="responsive-table"><table><thead><tr><th>#</th><th>Due date</th><th>Expected</th><th>Paid</th><th>Remaining</th><th>Status</th></tr></thead><tbody>
              <tr *ngFor="let installment of history.installments"><td>{{ installment.installmentNumber }}</td><td>{{ installment.dueDate | date }}</td><td>{{ installment.expectedAmount | number:'1.2-2' }}</td><td>{{ installment.paidAmount | number:'1.2-2' }}</td><td>{{ installment.expectedAmount - installment.paidAmount | number:'1.2-2' }}</td><td><span class="badge">{{ statuses[installment.status] }}</span></td></tr>
              <tr *ngIf="!history.installments?.length"><td colspan="6" class="empty">No installment schedule configured.</td></tr>
            </tbody></table></div>
          </article>

          <article class="panel" *ngIf="history?.payments?.length"><h2>Payment history</h2><div class="responsive-table"><table><thead><tr><th>Date</th><th>Amount</th><th>Reference</th><th>Status</th><th>Proof</th></tr></thead><tbody><tr *ngFor="let payment of history.payments"><td>{{ payment.paymentDate | date }}</td><td>{{ payment.amount | number:'1.2-2' }}</td><td>{{ payment.transactionReference || '—' }}</td><td>{{ payment.isReversed ? 'Reversed' : 'Valid' }}</td><td><a *ngIf="payment.proofUrl" [href]="payment.proofUrl" target="_blank">Open</a><span *ngIf="!payment.proofUrl">—</span></td></tr></tbody></table></div></article>
        </ng-container>
      </main>
    </div>
    <div class="notice" [class.error]="isError" *ngIf="message">{{ message }}</div>
  `,
  styles: [`
    .workspace-grid{display:grid;grid-template-columns:minmax(300px,360px) 1fr;gap:18px;align-items:start}.directory{position:sticky;top:16px;padding:0;overflow:hidden}.tabs{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--line)}.tabs button{border:0;border-radius:0;background:#fff;color:var(--muted);box-shadow:none;padding:14px 8px}.tabs button.active{color:var(--brand);background:var(--brand-light);box-shadow:inset 0 -2px var(--brand)}.tabs span{background:#fff;border-radius:10px;padding:1px 6px}.search{padding:16px;margin:0}.customer-list{max-height:62vh;overflow:auto;border-top:1px solid var(--line)}.customer-row{width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:0;border-bottom:1px solid var(--line);border-radius:0;background:#fff;color:var(--text);box-shadow:none;padding:13px 15px}.customer-row:hover,.customer-row.selected{background:#f0fdfa}.avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--brand);color:#fff;font-weight:800}.identity{display:flex;flex-direction:column;min-width:0;flex:1}.identity small{color:var(--muted)}.file{font-size:11px;font-weight:800;color:var(--brand)}.details{display:grid;gap:16px}.customer-head{display:flex;align-items:center;justify-content:space-between}.customer-head h2,.section-title h2{margin:0}.customer-head p,.section-title p,.assign-form p{color:var(--muted);margin:4px 0 0}.status,.badge{padding:6px 10px;border-radius:999px;background:var(--brand-light);color:var(--brand-dark);font-weight:800;font-size:12px}.assign-form{display:grid;grid-template-columns:1fr minmax(220px,300px) auto;gap:16px;align-items:end}.metric-grid{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:12px}.metric{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px}.metric small{display:block;color:var(--muted);margin-bottom:7px}.metric strong{font-size:20px}.fields{display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:14px;margin:18px 0}.wide{grid-column:1/-1}.empty{padding:24px;text-align:center;color:var(--muted)}.empty-details{padding:60px;text-align:center;color:var(--muted)}.notice{position:fixed;right:24px;bottom:24px;padding:12px 18px;border-radius:10px;background:#ecfdf5;color:#047857;box-shadow:var(--shadow)}.notice.error{background:#fef2f2;color:#b91c1c}@media(max-width:1000px){.workspace-grid{grid-template-columns:1fr}.directory{position:static}.metric-grid{grid-template-columns:repeat(2,1fr)}}
  `]
})
export class CustomerFinancialsComponent {
  private api = inject(ApiService); auth = inject(AuthService);
  customers:any[]=[]; customerId=0; selectedCustomer:any; summary:any; history:any; search=''; fileId=''; message=''; isError=false; saving=false; view:'accounts'|'assign'='accounts';
  statuses=['Upcoming','Due','Partially Paid','Paid','Overdue'];
  agreement:any={totalAgreedAmount:0,bookingAmount:0,paymentPlan:0,emiStartDate:'',monthlyEmiAmount:null,installmentCount:null,remarks:''};
  constructor(){this.reloadCustomers()}
  get canAssignFile(){return this.auth.hasRole('SuperAdmin','Admin','CA')}
  get canEditAgreement(){return this.auth.hasRole('SuperAdmin','Admin','CS')}
  get canAccessUnfiled(){return this.canAssignFile||this.canEditAgreement}
  get customersWithoutFile(){return this.customers.filter(x=>!x.fileId)}
  get visibleCustomers(){const source=this.view==='assign'?this.customersWithoutFile:this.customers.filter(x=>!!x.fileId);const q=this.search.trim().toLowerCase();return !q?source:source.filter(x=>`${x.fileId??''} ${x.name} ${x.phone} ${x.id}`.toLowerCase().includes(q))}
  get cards(){return this.summary?[['Total agreed',this.summary.totalAgreedAmount],['Total paid',this.summary.totalPaid],['Current due',this.summary.currentDue],['Overdue',this.summary.overdueAmount],['Outstanding',this.summary.outstandingBalance]]:[]}
  setView(view:'accounts'|'assign'){this.view=view;this.search='';this.clearSelection()}
  reloadCustomers(selectId?:number){this.api.customers().subscribe({next:rows=>{this.customers=rows;if(selectId){const customer=this.customers.find(x=>x.id===selectId);if(customer)this.openCustomer(customer)}},error:e=>this.showError(e.error?.message||'Could not load customers.')})}
  clearSelection(){this.customerId=0;this.selectedCustomer=null;this.summary=null;this.history=null;this.fileId=''}
  openCustomer(customer:any){this.customerId=customer.id;this.selectedCustomer=customer;this.fileId=customer.fileId??'';this.message='';this.api.financialSummary(customer.id).subscribe({next:x=>this.summary=x,error:e=>this.showError(e.error?.message||'Could not load summary.')});this.api.financialHistory(customer.id).subscribe({next:x=>{this.history=x;this.agreement=x.agreement?{...x.agreement,emiStartDate:x.agreement.emiStartDate?.slice(0,10)}:{totalAgreedAmount:0,bookingAmount:0,paymentPlan:0,emiStartDate:'',monthlyEmiAmount:null,installmentCount:null,remarks:''}},error:e=>this.showError(e.error?.message||'Could not load history.')})}
  saveFile(){if(!this.fileId.trim()||!this.customerId)return;this.saving=true;this.api.setFileId(this.customerId,this.fileId.trim()).subscribe({next:()=>{const id=this.customerId;this.saving=false;this.view='accounts';this.showSuccess('File ID assigned successfully.');this.reloadCustomers(id)},error:e=>{this.saving=false;this.showError(e.error?.message||'Could not assign file ID.')}})}
  saveAgreement(){this.saving=true;this.api.saveAgreement(this.customerId,{...this.agreement,emiStartDate:this.agreement.emiStartDate||null}).subscribe({next:()=>{this.saving=false;this.showSuccess('Financial agreement saved.');this.openCustomer(this.selectedCustomer)},error:e=>{this.saving=false;this.showError(e.error?.message||'Could not save agreement.')}})}
  showSuccess(message:string){this.message=message;this.isError=false}
  showError(message:string){this.message=message;this.isError=true}
}
