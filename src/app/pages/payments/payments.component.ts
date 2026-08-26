import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';

@Component({
  standalone:true, imports:[CommonModule,RouterLink],
  template:`
    <section class="page-head"><div><p class="eyebrow">CA Department</p><h1>Collections and dues</h1><p class="subtitle">Monthly employee collections and file-based customer dues are kept separately.</p></div><a routerLink="/payments/record">Add collection or due</a></section>
    <div class="metrics"><article class="panel"><span>Total monthly collection</span><strong>{{collectionTotal|number:'1.2-2'}}</strong></article><article class="panel due"><span>Total customer due</span><strong>{{dueTotal|number:'1.2-2'}}</strong></article></div>
    <article class="panel"><h2>Monthly collections by sales employee</h2><div class="responsive-table"><table><thead><tr><th>Month</th><th>Sales employee</th><th>Remarks</th><th class="right">Amount</th></tr></thead><tbody><tr *ngFor="let row of collections"><td>{{row.month|date:'MMMM yyyy'}}</td><td><strong>{{row.salesExecutive}}</strong></td><td>{{row.remarks||'—'}}</td><td class="right"><strong>{{row.amount|number:'1.2-2'}}</strong></td></tr><tr *ngIf="!collections.length"><td colspan="4">No monthly collections recorded.</td></tr></tbody></table></div></article>
    <article class="panel"><h2>Customer dues</h2><div class="responsive-table"><table><thead><tr><th>Month</th><th>Customer file</th><th>Assigned sales employee</th><th>Remarks</th><th class="right">Due</th></tr></thead><tbody><tr *ngFor="let row of dues"><td>{{row.month|date:'MMMM yyyy'}}</td><td><strong>{{row.fileId}}</strong></td><td>{{row.salesExecutive||'Unassigned'}}</td><td>{{row.remarks||'—'}}</td><td class="right"><strong>{{row.amount|number:'1.2-2'}}</strong></td></tr><tr *ngIf="!dues.length"><td colspan="5">No customer dues recorded.</td></tr></tbody></table></div></article>
    <p class="error" *ngIf="error">{{error}}</p>
  `,
  styles:[`.subtitle{color:var(--muted)}.metrics{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:16px;margin-bottom:18px}.metrics article{display:grid;gap:7px}.metrics span{color:var(--muted)}.metrics strong{font-size:24px}.due strong{color:#b91c1c}.panel+ .panel{margin-top:18px}.responsive-table{overflow:auto}.right{text-align:right}@media(max-width:700px){.metrics{grid-template-columns:1fr}}`]
})
export class PaymentsComponent implements OnInit {
  private api=inject(ApiService);collections:any[]=[];dues:any[]=[];error='';
  get collectionTotal(){return this.collections.reduce((sum,row)=>sum+Number(row.amount),0)}
  get dueTotal(){return this.dues.reduce((sum,row)=>sum+Number(row.amount),0)}
  ngOnInit(){forkJoin({collections:this.api.monthlyCollections(),dues:this.api.customerDues()}).subscribe({next:x=>{this.collections=x.collections;this.dues=x.dues},error:e=>this.error=e.error?.message||'Could not load collections and dues.'})}
}
