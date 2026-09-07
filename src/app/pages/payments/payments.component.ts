import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';

type Period = 'week' | 'month' | 'year' | 'overall';
type DueStatusFilter = 'all' | 'unpaid' | 'paid';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-head"><div><p class="eyebrow">CA department</p><h1>Collections and Dues</h1><p class="page-copy">Monitor employee collections and customer liabilities with independent reporting periods.</p></div><a routerLink="/payments/record" class="add-action">＋ Add Collection or Due</a></section>

    <section class="overview-grid"><article><span>Filtered collection</span><strong>{{ collectionTotal | number:'1.2-2' }}</strong><small>{{ collectionPeriodLabel }}</small></article><article><span>Collection records</span><strong>{{ filteredCollections.length }}</strong><small>Employee monthly entries</small></article><article><span>Unpaid customer due</span><strong class="danger">{{ unpaidDueTotal | number:'1.2-2' }}</strong><small>{{ unpaidDueCount }} outstanding records</small></article><article><span>Filtered due records</span><strong>{{ filteredDues.length }}</strong><small>{{ duePeriodLabel }}</small></article></section>

    <section class="data-card">
      <header class="section-head"><div><p class="eyebrow">Employee collections</p><h2>Collection Register</h2><span>Monthly collection amounts grouped by sales employee.</span></div><div class="period-tabs"><button type="button" [class.active]="collectionPeriod==='week'" (click)="collectionPeriod='week'">Weekly</button><button type="button" [class.active]="collectionPeriod==='month'" (click)="collectionPeriod='month'">Monthly</button><button type="button" [class.active]="collectionPeriod==='year'" (click)="collectionPeriod='year'">Yearly</button><button type="button" [class.active]="collectionPeriod==='overall'" (click)="collectionPeriod='overall'">Overall</button></div></header>
      <div class="filter-row"><label *ngIf="collectionPeriod==='month'">Month<input type="month" [(ngModel)]="collectionMonth"></label><label *ngIf="collectionPeriod==='year'">Year<select [(ngModel)]="collectionYear"><option *ngFor="let year of years" [ngValue]="year">{{year}}</option></select></label><label>Employee<input type="search" [(ngModel)]="collectionSearch" placeholder="Search employee, team or group"></label><button type="button" class="refresh" (click)="load()">Refresh</button><span class="result-count">{{ filteredCollections.length }} results</span></div>
      <div class="table-scroll"><table><thead><tr><th>Collection month</th><th>Sales employee</th><th>Team / group</th><th>Entered by</th><th>Remarks</th><th class="right">Amount</th></tr></thead><tbody><tr *ngFor="let row of filteredCollections"><td><strong>{{row.month|date:'MMMM yyyy'}}</strong><small *ngIf="row.createdAt">Recorded {{row.createdAt|date:'MMM d, y'}}</small></td><td><strong>{{row.salesExecutive}}</strong></td><td>{{row.team||'No team'}}<small>{{row.group||'No group'}}</small></td><td>{{row.recordedBy||'—'}}</td><td>{{row.remarks||'—'}}</td><td class="right amount">{{row.amount|number:'1.2-2'}}</td></tr><tr *ngIf="!filteredCollections.length"><td colspan="6" class="empty">No collection records match this period.</td></tr></tbody></table></div>
    </section>

    <section class="data-card dues-card">
      <header class="section-head"><div><p class="eyebrow">Customer liabilities</p><h2>Customer Dues</h2><span>Track outstanding and settled customer dues separately.</span></div><div class="period-tabs"><button type="button" [class.active]="duePeriod==='week'" (click)="duePeriod='week'">Weekly</button><button type="button" [class.active]="duePeriod==='month'" (click)="duePeriod='month'">Monthly</button><button type="button" [class.active]="duePeriod==='year'" (click)="duePeriod='year'">Yearly</button><button type="button" [class.active]="duePeriod==='overall'" (click)="duePeriod='overall'">Overall</button></div></header>
      <div class="filter-row"><label *ngIf="duePeriod==='month'">Month<input type="month" [(ngModel)]="dueMonth"></label><label *ngIf="duePeriod==='year'">Year<select [(ngModel)]="dueYear"><option *ngFor="let year of years" [ngValue]="year">{{year}}</option></select></label><div class="status-tabs"><button type="button" [class.active]="dueStatus==='all'" (click)="dueStatus='all'">All</button><button type="button" [class.active]="dueStatus==='unpaid'" (click)="dueStatus='unpaid'">Unpaid</button><button type="button" [class.active]="dueStatus==='paid'" (click)="dueStatus='paid'">Paid</button></div><label>Customer search<input type="search" [(ngModel)]="dueSearch" placeholder="File, customer or employee"></label><span class="result-count">{{filteredDues.length}} results</span></div>
      <div class="table-scroll"><table><thead><tr><th>Due date</th><th>Customer file</th><th>Project</th><th>Assigned employee</th><th>Status</th><th>Remarks</th><th class="right">Due amount</th><th>CA action</th></tr></thead><tbody><tr *ngFor="let row of filteredDues"><td><strong>{{row.dueDate|date:'MMM d, y'}}</strong></td><td><strong>{{row.fileId}}</strong><small>{{row.customer}}</small></td><td>{{row.project||'—'}}</td><td>{{row.salesExecutive||'Unassigned'}}</td><td><span class="due-status" [class.paid]="row.status===1" [class.cancelled]="row.status===2"><i></i>{{dueStatuses[row.status]}}</span><small *ngIf="row.paidAt">{{row.paidAt|date:'MMM d, y, h:mm a'}}</small></td><td>{{row.remarks||row.paidRemarks||'—'}}</td><td class="right amount">{{row.amount|number:'1.2-2'}}</td><td><button *ngIf="row.status===0" class="small-action" (click)="markPaid(row)">Mark Paid</button><button class="small-action reopen" *ngIf="row.status!==0" (click)="reopen(row)">Reopen</button></td></tr><tr *ngIf="!filteredDues.length"><td colspan="8" class="empty">No customer dues match the selected filters.</td></tr></tbody></table></div>
    </section>
    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  private api=inject(ApiService);
  private collections:any[]=[]; private dues:any[]=[];
  error=''; dueStatuses=['Unpaid','Paid','Cancelled'];
  collectionPeriod:Period='month'; duePeriod:Period='month'; dueStatus:DueStatusFilter='all';
  collectionMonth=this.currentMonth(); dueMonth=this.currentMonth(); collectionYear=new Date().getFullYear(); dueYear=new Date().getFullYear();
  collectionSearch=''; dueSearch=''; readonly years=Array.from({length:8},(_,index)=>new Date().getFullYear()-index);

  get filteredCollections(){const term=this.collectionSearch.trim().toLowerCase();return this.collections.filter(row=>this.inPeriod(this.collectionPeriod,row.month,row.createdAt,this.collectionMonth,this.collectionYear)).filter(row=>!term||[row.salesExecutive,row.team,row.group,row.recordedBy].some(value=>value?.toLowerCase().includes(term)));}
  get filteredDues(){const term=this.dueSearch.trim().toLowerCase();return this.dues.filter(row=>this.inPeriod(this.duePeriod,row.dueDate,row.createdAt,this.dueMonth,this.dueYear)).filter(row=>this.dueStatus==='all'||(this.dueStatus==='unpaid'?row.status===0:row.status===1)).filter(row=>!term||[row.fileId,row.customer,row.salesExecutive,row.project].some(value=>value?.toString().toLowerCase().includes(term)));}
  get collectionTotal(){return this.filteredCollections.reduce((sum,row)=>sum+Number(row.amount),0);}
  get unpaidDueTotal(){return this.filteredDues.filter(row=>row.status===0).reduce((sum,row)=>sum+Number(row.amount),0);}
  get unpaidDueCount(){return this.filteredDues.filter(row=>row.status===0).length;}
  get collectionPeriodLabel(){return this.periodLabel(this.collectionPeriod,this.collectionMonth,this.collectionYear);}
  get duePeriodLabel(){return this.periodLabel(this.duePeriod,this.dueMonth,this.dueYear);}
  ngOnInit(){this.load();}
  load(){forkJoin({collections:this.api.monthlyCollections(),dues:this.api.customerDues()}).subscribe({next:data=>{this.collections=data.collections;this.dues=data.dues;},error:error=>this.error=error.error?.message||'Could not load collections and dues.'});}
  markPaid(row:any){const remarks=prompt(`Mark file ${row.fileId} due as paid. Optional CA remarks:`)||'';this.api.markCustomerDuePaid(row.id,remarks).subscribe({next:()=>this.load(),error:error=>this.error=error.error?.message||'Could not mark the due paid.'});}
  reopen(row:any){const remarks=prompt(`Reason for reopening file ${row.fileId} due:`);if(!remarks?.trim())return;this.api.reopenCustomerDue(row.id,remarks.trim()).subscribe({next:()=>this.load(),error:error=>this.error=error.error?.message||'Could not reopen the due.'});}
  private currentMonth(){return new Date().toISOString().slice(0,7);}
  private inPeriod(period:Period,primaryDate:string,createdAt:string|undefined,monthValue:string,yearValue:number){if(period==='overall')return true;const date=new Date(period==='week'&&createdAt?createdAt:primaryDate);const now=new Date();if(period==='week'){const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7));start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+7);return date>=start&&date<end;}if(period==='year')return date.getFullYear()===yearValue;const [year,month]=monthValue.split('-').map(Number);return date.getFullYear()===year&&date.getMonth()===month-1;}
  private periodLabel(period:Period,monthValue:string,yearValue:number){if(period==='overall')return 'All time';if(period==='week')return 'This week';if(period==='year')return String(yearValue);const [year,month]=monthValue.split('-').map(Number);return new Date(year,month-1,1).toLocaleDateString(undefined,{month:'long',year:'numeric'});}
}
