import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,RouterLink],
  template:`
    <section class="page-head">
      <div><p class="eyebrow">CA Department</p><h1>Add Payment</h1><p class="subtitle">Record a payment against a configured customer account.</p></div>
      <a routerLink="/payments" class="ghost-button">Back to Collections</a>
    </section>
    <div class="layout">
      <form class="panel payment-form" (ngSubmit)="record()" #paymentForm="ngForm">
        <h2>Payment information</h2>
        <label>Find customer account<input name="customerSearch" [(ngModel)]="customerSearch" placeholder="Search file ID, customer name or phone" autocomplete="off"></label>
        <div class="account-results">
          <button type="button" *ngFor="let customer of filteredCustomers" [class.selected]="customer.id === form.customerId" (click)="selectCustomer(customer)">
            <span><strong>{{ customer.name }}</strong><small>{{ customer.phone }}</small></span><b>{{ customer.fileId }}</b>
          </button>
          <p *ngIf="!filteredCustomers.length">No matching customer with a file ID.</p>
        </div>
        <article class="selected-account" *ngIf="selectedCustomer"><span>Selected account</span><strong>{{ selectedCustomer.name }} · {{ selectedCustomer.fileId }}</strong><small>{{ summary?.paymentStatus }} · Outstanding {{ summary?.outstandingBalance | number:'1.2-2' }}</small></article>
        <div class="fields">
          <label>Payment type<select name="purpose" [(ngModel)]="form.purpose" (ngModelChange)="purposeChanged()" required><option [ngValue]="null">Select payment type</option><option *ngFor="let purpose of purposes" [ngValue]="purpose.value">{{ purpose.label }}</option></select></label>
          <label *ngIf="form.purpose === 2">EMI month<select name="installmentId" [(ngModel)]="form.installmentId" (ngModelChange)="installmentChanged()" required><option [ngValue]="null">Select installment month</option><option *ngFor="let installment of availableInstallments" [ngValue]="installment.id">EMI #{{ installment.installmentNumber }} · {{ installment.dueDate | date:'MMMM yyyy' }} · Remaining {{ installment.expectedAmount - installment.paidAmount | number:'1.2-2' }}</option></select></label>
          <label>Amount<input type="number" min="0.01" step="0.01" name="amount" [(ngModel)]="form.amount" required></label>
          <label>Payment date<input type="date" name="date" [(ngModel)]="form.paymentDate" required></label>
          <label>Method<select name="method" [(ngModel)]="form.method" required><option *ngFor="let method of methods;index as i" [ngValue]="i">{{ method }}</option></select></label>
          <label>Transaction/reference number<input name="reference" [(ngModel)]="form.transactionReference" maxlength="150"></label>
          <label class="wide">Payment proof URL<input name="proof" [(ngModel)]="form.proofUrl" placeholder="Uploaded receipt or supporting document URL"></label>
          <label class="wide">Remarks<textarea rows="3" name="remarks" [(ngModel)]="form.remarks"></textarea></label>
        </div>
        <button type="submit" [disabled]="saving || paymentForm.invalid || !form.customerId">{{ saving ? 'Recording payment…' : 'Record Payment' }}</button>
      </form>
      <aside class="panel guidance"><h2>Account checks</h2><ul><li>Choose Booking Amount, Down Payment, EMI, Full Payment, or Other.</li><li>Choosing an EMI month automatically fills its remaining amount; you may enter a smaller partial amount.</li><li>A completed EMI is removed from due and overdue totals immediately.</li><li>The amount cannot exceed the outstanding balance.</li></ul><div *ngIf="summary" class="summary"><span>Total agreed <b>{{ summary.totalAgreedAmount | number:'1.2-2' }}</b></span><span>Total paid <b>{{ summary.totalPaid | number:'1.2-2' }}</b></span><span>Current due <b>{{ summary.currentDue | number:'1.2-2' }}</b></span><span>Outstanding <b>{{ summary.outstandingBalance | number:'1.2-2' }}</b></span></div></aside>
    </div>
    <div class="notice" [class.error]="isError" *ngIf="message">{{ message }}</div>
  `,
  styles:[`
    .subtitle{color:var(--muted);margin:4px 0}.layout{display:grid;grid-template-columns:minmax(0,2fr) minmax(260px,1fr);gap:18px;align-items:start}.payment-form h2,.guidance h2{margin-top:0}.account-results{border:1px solid var(--line);border-radius:10px;max-height:230px;overflow:auto;margin-bottom:14px}.account-results button{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;border:0;border-bottom:1px solid var(--line);border-radius:0;background:#fff;color:var(--text);box-shadow:none;padding:12px}.account-results button:hover,.account-results button.selected{background:#f0fdfa}.account-results span{display:flex;flex-direction:column}.account-results small{color:var(--muted)}.account-results b{color:var(--brand);font-size:12px}.account-results p{padding:16px;color:var(--muted)}.selected-account{display:flex;flex-direction:column;background:var(--brand-light);border:1px solid #99f6e4;border-radius:10px;padding:14px;margin-bottom:16px}.selected-account span,.selected-account small{color:var(--muted)}.fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}.wide{grid-column:1/-1}.guidance{position:sticky;top:16px}.guidance li{margin-bottom:12px;color:var(--muted)}.summary{border-top:1px solid var(--line);padding-top:12px;display:grid;gap:10px}.summary span{display:flex;justify-content:space-between}.notice{position:fixed;right:24px;bottom:24px;padding:12px 18px;border-radius:10px;background:#ecfdf5;color:#047857;box-shadow:var(--shadow)}.notice.error{background:#fef2f2;color:#b91c1c}@media(max-width:850px){.layout{grid-template-columns:1fr}.fields{grid-template-columns:1fr}.wide{grid-column:auto}.guidance{position:static}}
  `]
})
export class RecordPaymentComponent {
  private api=inject(ApiService);
  customers:any[]=[];selectedCustomer:any;summary:any;history:any;customerSearch='';message='';isError=false;saving=false;
  methods=['Cash','Bank transfer','Cheque','Mobile banking','Card machine','Online gateway','Other'];
  purposes=[{value:0,label:'Booking Amount'},{value:1,label:'Down Payment'},{value:2,label:'EMI Installment'},{value:3,label:'Full Payment'},{value:4,label:'Other'}];
  form:any={customerId:null,purpose:null,installmentId:null,amount:null,paymentDate:new Date().toISOString().slice(0,10),method:0,transactionReference:'',proofUrl:'',remarks:''};
  constructor(){this.api.customers().subscribe({next:rows=>this.customers=rows.filter((x:any)=>!!x.fileId),error:e=>this.showError(e.error?.message||'Could not load customer accounts.')})}
  get filteredCustomers(){const q=this.customerSearch.trim().toLowerCase();const rows=!q?this.customers:this.customers.filter(x=>`${x.fileId} ${x.name} ${x.phone}`.toLowerCase().includes(q));return rows.slice(0,30)}
  get availableInstallments(){return (this.history?.installments??[]).filter((x:any)=>x.expectedAmount>x.paidAmount)}
  selectCustomer(customer:any){this.selectedCustomer=customer;this.form={...this.form,customerId:customer.id,purpose:null,installmentId:null,amount:null};this.customerSearch=`${customer.fileId} — ${customer.name}`;this.api.financialSummary(customer.id).subscribe({next:x=>this.summary=x,error:e=>this.showError(e.error?.message||'Could not load the financial summary.')});this.api.financialHistory(customer.id).subscribe({next:x=>this.history=x,error:e=>this.showError(e.error?.message||'Could not load installments.')})}
  purposeChanged(){this.form.installmentId=null;if(this.form.purpose===3)this.form.amount=this.summary?.outstandingBalance??null;else if(this.form.purpose===0){const booking=this.history?.agreement?.bookingAmount??0;const paid=(this.history?.payments??[]).filter((x:any)=>x.purpose===0&&!x.isReversed&&x.status===1).reduce((sum:number,x:any)=>sum+x.amount,0);this.form.amount=Math.max(0,booking-paid)||null}else this.form.amount=null}
  installmentChanged(){const installment=this.availableInstallments.find((x:any)=>x.id===this.form.installmentId);if(installment)this.form.amount=installment.expectedAmount-installment.paidAmount}
  record(){if(!this.form.customerId){this.showError('Select a customer account first.');return}if(this.form.purpose===null){this.showError('Select the payment type.');return}if(this.form.purpose===2&&!this.form.installmentId){this.showError('Select the EMI installment month.');return}if(this.summary&&this.form.amount>this.summary.outstandingBalance){this.showError('Payment cannot exceed the outstanding balance.');return}this.saving=true;this.message='';this.api.recordPayment({...this.form,paymentDate:new Date(`${this.form.paymentDate}T12:00:00`).toISOString()},crypto.randomUUID()).subscribe({next:()=>{this.saving=false;this.showSuccess('Payment recorded successfully.');const customer=this.selectedCustomer;this.selectCustomer(customer)},error:e=>{this.saving=false;this.showError(e.error?.message||'Could not record payment.')}})}
  showSuccess(message:string){this.message=message;this.isError=false}
  showError(message:string){this.message=message;this.isError=true}
}
