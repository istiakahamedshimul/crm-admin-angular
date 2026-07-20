import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Vehicle, VehicleBooking } from '../../models/crm.models';
import { TransportNavComponent } from './transport-nav.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TransportNavComponent],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Transport Management</p>
        <h1>Visit Requests</h1>
        <p class="page-copy">Review sales requests, assign vehicles, and confirm customer visits.</p>
      </div>
      <button class="ghost-button" (click)="load()">Refresh</button>
    </section>
    
    <app-transport-nav/>

    <p class="success" *ngIf="message">{{message}}</p>
    <p class="error" *ngIf="error&&!selected">{{error}}</p>

    <div class="stat-grid">
      <div class="mini-stat"><span>Pending Approval</span><strong>{{count(0)}}</strong></div>
      <div class="mini-stat"><span>Approved Bookings</span><strong>{{count(1)}}</strong></div>
      <div class="mini-stat"><span>Total requests</span><strong>{{bookings.length}}</strong></div>
    </div>

    <article class="panel table-panel">
      <div class="table-header">
        <div>
          <h2>Customer Site Visits</h2>
          <p>Newest requests appear first</p>
        </div>
      </div>
      <div class="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Project Destination</th>
              <th>Pickup Address</th>
              <th>Visitors Count</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of bookings">
              <td>
                <strong style="color: var(--text-dark);">{{b.visitDate|date:'dd MMM yyyy'}}</strong>
                <small>{{b.visitTime}}</small>
              </td>
              <td>
                <strong style="color: var(--text-dark);">{{b.customer}}</strong>
                <small>📞 {{b.customerPhone}}</small>
              </td>
              <td><span style="font-weight: 700; color: var(--brand);">{{b.project}}</span></td>
              <td>{{b.pickupPlace}}</td>
              <td>
                <span style="padding: 3px 8px; background: var(--panel-soft); border: 1px solid var(--line); border-radius: 6px; font-weight: 700; font-size: 13px;">
                  👥 {{b.personCount}}
                </span>
              </td>
              <td>
                <span class="status-pill" [class.pending]="b.status===0" [class.approved]="b.status===1" [class.rejected]="b.status===2">
                  {{statuses[b.status]}}
                </span>
              </td>
              <td style="text-align: right;">
                <button class="view-btn" (click)="open(b)" style="min-height: 32px; font-size: 13px; padding: 0 12px; border-radius: 6px;">
                  Verify & Assign
                </button>
              </td>
            </tr>
            <tr *ngIf="!bookings.length">
              <td colspan="7" class="empty-table">No visit requests found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <!-- Details Overlay Modal -->
    <div class="modal-backdrop" *ngIf="selected" (click)="selected=undefined">
      <article class="request-drawer" (click)="$event.stopPropagation()">
        <div class="drawer-head">
          <div>
            <p class="eyebrow">Request ID #{{selected.id}}</p>
            <h2>{{selected.customer}}</h2>
          </div>
          <button class="icon-button" (click)="selected=undefined">×</button>
        </div>
        
        <p class="error" *ngIf="error">{{error}}</p>
        
        <div class="detail-grid">
          <div><span>Visit Schedule</span><strong>{{selected.visitDate|date:'dd MMM yyyy'}} at {{selected.visitTime}}</strong></div>
          <div><span>Project Target</span><strong>{{selected.project}}</strong></div>
          <div><span>Pickup Location</span><strong>{{selected.pickupPlace}}</strong></div>
          <div><span>Visitors count</span><strong>👥 {{selected.personCount}} people</strong></div>
          <div><span>Purpose of Visit</span><strong>{{selected.purpose}}</strong></div>
          <div><span>Sales Agent</span><strong>👤 {{selected.salesExecutive}}</strong></div>
        </div>

        <div class="note-box" style="margin-bottom: 20px;">
          <span>Additional information</span>
          <p>{{selected.additionalInformation||'No additional information provided.'}}</p>
        </div>

        <!-- Approval / Assignment Form -->
        <div *ngIf="selected.status===0" class="approval-form">
          <label class="field">
            <span>Assign active vehicle *</span>
            <select [(ngModel)]="vehicleId" [disabled]="submitting">
              <option [ngValue]="0">Select an active vehicle</option>
              <option *ngFor="let v of active" [ngValue]="v.id">{{v.registrationNumber}} · {{v.brand}} {{v.model}} · ({{v.seatingCapacity}} seats)</option>
            </select>
          </label>
          <label class="field">
            <span>Driver name</span>
            <input [(ngModel)]="driver" [disabled]="submitting" placeholder="e.g. Michael Cooper">
          </label>
          <label class="field">
            <span>Admin internal remarks</span>
            <textarea [(ngModel)]="remarks" [disabled]="submitting" placeholder="Optional notes visible internally..."></textarea>
          </label>
          <div class="drawer-actions">
            <button type="button" class="danger" (click)="reject()" [disabled]="submitting" style="min-height: 40px;">Reject Request</button>
            <button type="button" (click)="approve()" [disabled]="!vehicleId||submitting" style="min-height: 40px;">Assign & Approve</button>
          </div>
        </div>
        
        <!-- Info when already processed -->
        <div *ngIf="selected.status!==0" class="note-box" style="border-color: var(--success); background: var(--success-bg); color: var(--success-dark);">
          <span>Assigned Transport Details</span>
          <p style="font-weight: 700;">{{selected.vehicle||'Not assigned'}} <ng-container *ngIf="selected.driver">· Driver: {{selected.driver}}</ng-container></p>
        </div>
      </article>
    </div>
  `
})
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
