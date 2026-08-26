import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-head"><div><p class="eyebrow">CA Department</p><h1>Add collection or due</h1><p class="subtitle">Collections belong to a sales employee. Customer dues are recorded using only the file number.</p></div><a routerLink="/payments" class="ghost-button">Back to Collections</a></section>
    <div class="tabs"><button type="button" [class.active]="mode==='collection'" (click)="mode='collection'">Monthly employee collection</button><button type="button" [class.active]="mode==='due'" (click)="mode='due'">Customer due</button></div>
    <form *ngIf="mode==='collection'" class="panel form" (ngSubmit)="saveCollection()" #collectionForm="ngForm">
      <h2>Monthly collection</h2>
      <label>Sales employee<select name="salesExecutiveId" [(ngModel)]="collection.salesExecutiveId" required><option [ngValue]="null">Select sales employee</option><option *ngFor="let employee of employees" [ngValue]="employee.id">{{employee.fullName}}</option></select></label>
      <label>Collection month<input type="month" name="collectionMonth" [(ngModel)]="collection.month" required></label>
      <label>Monthly collection amount<input type="number" min="0" step="0.01" name="collectionAmount" [(ngModel)]="collection.amount" required></label>
      <label>Remarks (optional)<textarea name="collectionRemarks" rows="3" [(ngModel)]="collection.remarks"></textarea></label>
      <p class="hint">Saving the same employee and month updates that month's amount, preventing duplicate monthly totals.</p>
      <button [disabled]="saving || collectionForm.invalid">{{saving ? 'Saving…' : 'Save monthly collection'}}</button>
    </form>
    <form *ngIf="mode==='due'" class="panel form" (ngSubmit)="saveDue()" #dueForm="ngForm">
      <h2>Customer monthly due</h2>
      <label>Customer file number<input name="fileId" [(ngModel)]="due.fileId" list="customer-files" placeholder="Enter file number" required><datalist id="customer-files"><option *ngFor="let customer of customers" [value]="customer.fileId"></option></datalist></label>
      <label>Due month<input type="month" name="dueMonth" [(ngModel)]="due.month" required></label>
      <label>Due amount<input type="number" min="0.01" step="0.01" name="dueAmount" [(ngModel)]="due.amount" required></label>
      <label>Remarks (optional)<textarea name="dueRemarks" rows="3" [(ngModel)]="due.remarks"></textarea></label>
      <p class="hint">No customer name, phone, or other details are required. The assigned sales employee is notified automatically, and the due appears on the customer profile.</p>
      <button [disabled]="saving || dueForm.invalid">{{saving ? 'Saving…' : 'Save customer due'}}</button>
    </form>
    <div class="notice" [class.error]="isError" *ngIf="message">{{message}}</div>
  `,
  styles: [`.subtitle,.hint{color:var(--muted)}.tabs{display:flex;gap:8px;margin-bottom:16px}.tabs button{background:#e2e8f0;color:var(--text);box-shadow:none}.tabs button.active{background:var(--brand);color:#fff}.form{max-width:680px;display:grid;gap:16px}.form h2{margin:0}.form label{display:grid;gap:7px}.notice{position:fixed;right:24px;bottom:24px;padding:12px 18px;border-radius:10px;background:#ecfdf5;color:#047857;box-shadow:var(--shadow)}.notice.error{background:#fef2f2;color:#b91c1c}`]
})
export class RecordPaymentComponent {
  private api = inject(ApiService); private router = inject(Router);
  mode: 'collection'|'due' = 'collection'; employees:any[]=[]; customers:any[]=[]; saving=false; message=''; isError=false;
  private currentMonth = new Date().toISOString().slice(0,7);
  collection:any={salesExecutiveId:null,month:this.currentMonth,amount:null,remarks:''};
  due:any={fileId:'',month:this.currentMonth,amount:null,remarks:''};
  constructor(){forkJoin({employees:this.api.salesExecutives(),customers:this.api.customers()}).subscribe({next:x=>{this.employees=x.employees;this.customers=x.customers.filter((c:any)=>!!c.fileId)},error:e=>this.error(e.error?.message||'Could not load the form data.')})}
  saveCollection(){this.saving=true;this.api.saveMonthlyCollection({...this.collection,month:`${this.collection.month}-01`}).subscribe({next:()=>this.router.navigate(['/payments'],{queryParams:{saved:'collection'}}),error:e=>{this.saving=false;this.error(e.error?.message||'Could not save the monthly collection.')}})}
  saveDue(){this.saving=true;this.api.saveCustomerDue({...this.due,fileId:this.due.fileId.trim(),month:`${this.due.month}-01`}).subscribe({next:()=>this.router.navigate(['/payments'],{queryParams:{saved:'due'}}),error:e=>{this.saving=false;this.error(e.error?.message||'Could not save the customer due.')}})}
  private error(message:string){this.message=message;this.isError=true}
}
