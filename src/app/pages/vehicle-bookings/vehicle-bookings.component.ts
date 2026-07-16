import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Vehicle, VehicleBooking } from '../../models/crm.models';
import { TransportNavComponent } from './transport-nav.component';
@Component({standalone:true,imports:[CommonModule,FormsModule,TransportNavComponent],template:`
<section class="page-head"><div><p class="eyebrow">Transport Management</p><h1>Visit Requests</h1><p class="page-copy">Review sales requests, assign vehicles, and confirm customer visits.</p></div><button class="ghost-button" (click)="load()">Refresh</button></section><app-transport-nav/>
<p class="success" *ngIf="message">{{message}}</p><p class="error" *ngIf="error">{{error}}</p>
<div class="stat-grid"><div class="mini-stat"><span>Pending</span><strong>{{count(0)}}</strong></div><div class="mini-stat"><span>Approved</span><strong>{{count(1)}}</strong></div><div class="mini-stat"><span>Total requests</span><strong>{{bookings.length}}</strong></div></div>
<article class="panel table-panel"><div class="table-header"><div><h2>Customer visits</h2><p>Newest requests appear first</p></div></div><div class="responsive-table"><table><thead><tr><th>Date & Time</th><th>Customer</th><th>Project</th><th>Pickup</th><th>Visitors</th><th>Status</th><th></th></tr></thead><tbody>
<tr *ngFor="let b of bookings"><td><strong>{{b.visitDate|date:'dd MMM yyyy'}}</strong><small>{{b.visitTime}}</small></td><td><strong>{{b.customer}}</strong><small>{{b.customerPhone}}</small></td><td>{{b.project}}</td><td>{{b.pickupPlace}}</td><td>{{b.personCount}}</td><td><span class="status-pill" [class.pending]="b.status===0" [class.approved]="b.status===1" [class.rejected]="b.status===2">{{statuses[b.status]}}</span></td><td><button class="view-btn" (click)="open(b)">View details</button></td></tr><tr *ngIf="!bookings.length"><td colspan="7" class="empty-table">No visit requests found.</td></tr></tbody></table></div></article>
<div class="modal-backdrop" *ngIf="selected" (click)="selected=undefined"><article class="request-drawer" (click)="$event.stopPropagation()"><div class="drawer-head"><div><p class="eyebrow">Request #{{selected.id}}</p><h2>{{selected.customer}}</h2></div><button class="icon-button" (click)="selected=undefined">×</button></div>
<div class="detail-grid"><div><span>Visit</span><strong>{{selected.visitDate|date:'dd MMM yyyy'}} at {{selected.visitTime}}</strong></div><div><span>Project</span><strong>{{selected.project}}</strong></div><div><span>Pickup</span><strong>{{selected.pickupPlace}}</strong></div><div><span>Visitors</span><strong>{{selected.personCount}}</strong></div><div><span>Purpose</span><strong>{{selected.purpose}}</strong></div><div><span>Sales employee</span><strong>{{selected.salesExecutive}}</strong></div></div><div class="note-box"><span>Additional information</span><p>{{selected.additionalInformation||'No additional information provided.'}}</p></div>
<div *ngIf="selected.status===0" class="approval-form"><label class="field"><span>Assign vehicle *</span><select [(ngModel)]="vehicleId" [disabled]="submitting"><option [ngValue]="0">Select an active vehicle</option><option *ngFor="let v of active" [ngValue]="v.id">{{v.registrationNumber}} · {{v.brand}} {{v.model}} · {{v.seatingCapacity}} seats</option></select></label><label class="field"><span>Driver name</span><input [(ngModel)]="driver" [disabled]="submitting" placeholder="Enter driver name"></label><label class="field"><span>Admin remarks</span><textarea [(ngModel)]="remarks" [disabled]="submitting" placeholder="Optional internal note"></textarea></label><div class="drawer-actions"><button type="button" class="danger" (click)="reject()" [disabled]="submitting">Reject request</button><button type="button" (click)="approve()" [disabled]="!vehicleId||submitting">{{submitting?'Saving...':'Assign & approve'}}</button></div></div>
<div *ngIf="selected.status!==0" class="note-box"><span>Assigned vehicle</span><p>{{selected.vehicle||'Not assigned'}} <ng-container *ngIf="selected.driver">· Driver: {{selected.driver}}</ng-container></p></div></article></div>`})
export class VehicleBookingsComponent implements OnInit {
  private api=inject(ApiService);
  bookings:VehicleBooking[]=[];vehicles:Vehicle[]=[];selected?:VehicleBooking;
  vehicleId=0;driver='';remarks='';message='';error='';submitting=false;
  statuses=['Pending','Approved','Rejected','Cancelled'];
  get active(){return this.vehicles.filter(v=>v.isActive)}
  ngOnInit(){this.load()}
  load(){
    forkJoin([this.api.vehicleBookings(),this.api.vehicles()]).subscribe({
      next:([b,v])=>{this.bookings=b;this.vehicles=v},
      error:e=>this.error=this.errorMessage(e,'Unable to load visit requests.')
    })
  }
  count(s:number){return this.bookings.filter(x=>x.status===s).length}
  open(b:VehicleBooking){this.selected=b;this.vehicleId=b.vehicleId||0;this.driver=b.driver||'';this.remarks=b.adminRemarks||'';this.error='';this.message=''}
  approve(){
    if(!this.selected)return;
    const vehicle=this.active.find(v=>v.id===this.vehicleId);
    if(!vehicle){this.error='Select an active vehicle before approving this request.';return}
    if(this.selected.personCount>vehicle.seatingCapacity){this.error=`${vehicle.registrationNumber} has only ${vehicle.seatingCapacity} seats for ${this.selected.personCount} visitors.`;return}
    this.error='';this.message='';this.submitting=true;
    this.api.approveVehicleBooking(this.selected.id,this.vehicleId,this.driver.trim(),this.remarks.trim()).pipe(finalize(()=>this.submitting=false)).subscribe({
      next:()=>{this.selected=undefined;this.message='Vehicle request approved successfully.';this.load()},
      error:e=>this.error=this.errorMessage(e,'Unable to approve the vehicle request.')
    })
  }
  reject(){
    if(!this.selected)return;
    const reason=prompt('Reason for rejection');
    if(reason===null)return;
    if(!reason.trim()){this.error='Enter a reason before rejecting this request.';return}
    this.error='';this.message='';this.submitting=true;
    this.api.rejectVehicleBooking(this.selected.id,reason.trim()).pipe(finalize(()=>this.submitting=false)).subscribe({
      next:()=>{this.selected=undefined;this.message='Vehicle request rejected successfully.';this.load()},
      error:e=>this.error=this.errorMessage(e,'Unable to reject the vehicle request.')
    })
  }
  private errorMessage(error:any,fallback:string){
    if(error?.status===0)return 'Cannot connect to the server. Check the backend and try again.';
    return error?.error?.message||error?.error?.title||(typeof error?.error==='string'?error.error:fallback);
  }
}
