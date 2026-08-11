import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Component({standalone:true,imports:[CommonModule,FormsModule],template:`
<section class="page-head"><div><p class="eyebrow">CA Department</p><h1>Payments</h1></div></section>
<div class="form-grid"><form class="panel" (ngSubmit)="record()"><h2>Record collected payment</h2>
<label>Customer<select name="customer" [(ngModel)]="form.customerId"><option *ngFor="let c of customers" [ngValue]="c.id">{{c.name}} / {{c.fileId||'No file ID'}}</option></select></label>
<label>Amount<input type="number" min="0.01" step="0.01" name="amount" [(ngModel)]="form.amount" required></label>
<label>Payment date<input type="date" name="date" [(ngModel)]="form.paymentDate" required></label>
<label>Method<select name="method" [(ngModel)]="form.method"><option *ngFor="let m of methods;index as i" [ngValue]="i">{{m}}</option></select></label>
<label>Transaction/reference<input name="reference" [(ngModel)]="form.transactionReference"></label><label>Proof URL<input name="proof" [(ngModel)]="form.proofUrl"></label><label>Remarks<textarea name="remarks" [(ngModel)]="form.remarks"></textarea></label><button>Record payment</button></form>
<article class="panel"><h2>Payment history</h2><table><thead><tr><th>Date</th><th>Customer</th><th>Reference</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody><tr *ngFor="let p of payments"><td>{{p.paymentDate|date}}</td><td>{{p.customer}}</td><td>{{p.transactionReference||p.collectionNumber}}</td><td>{{p.amount|number:'1.2-2'}}</td><td>{{p.isReversed?'Reversed':'Valid'}}</td><td><button *ngIf="!p.isReversed" type="button" class="danger" (click)="reverse(p.id)">Reverse</button></td></tr></tbody></table></article></div><p class="error">{{message}}</p>`})
export class RecordPaymentComponent {
  private api=inject(ApiService); customers:any[]=[]; payments:any[]=[]; message=''; methods=['Cash','Bank transfer','Cheque','Mobile banking','Card machine','Online gateway','Other'];
  form:any={customerId:null,amount:null,paymentDate:new Date().toISOString().slice(0,10),method:0,transactionReference:'',proofUrl:'',remarks:''};
  constructor(){this.api.customers().subscribe(x=>this.customers=x);this.load()}
  load(){this.api.payments().subscribe(x=>this.payments=x)}
  record(){this.api.recordPayment({...this.form,paymentDate:new Date(this.form.paymentDate).toISOString()},crypto.randomUUID()).subscribe({next:()=>{this.message='Payment recorded.';this.load()},error:e=>this.message=e.error?.message??'Could not record payment'})}
  reverse(id:number){const reason=prompt('Required reversal reason');if(reason)this.api.rejectPayment(id,reason).subscribe({next:()=>this.load(),error:e=>this.message=e.error?.message??'Could not reverse'})}
}

