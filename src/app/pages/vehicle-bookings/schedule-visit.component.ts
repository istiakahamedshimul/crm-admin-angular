import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Customer, Project, Vehicle } from '../../models/crm.models';
import { TransportNavComponent } from './transport-nav.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TransportNavComponent],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Transport Management</p>
        <h1>Schedule Customer Visit</h1>
        <p class="page-copy">Admin-created visits are approved automatically.</p>
      </div>
    </section>
    
    <app-transport-nav/>

    <article class="panel form-card">
      <!-- Step 1 Title -->
      <div class="section-title">
        <span>1</span>
        <div>
          <h2>Visit information</h2>
          <p>Choose the customer, project, and schedule.</p>
        </div>
      </div>
      
      <div class="form-grid">
        <label class="field">
          <span>Customer *</span>
          <select [(ngModel)]="visit.customerId">
            <option [ngValue]="0">Select customer</option>
            <option *ngFor="let c of customers" [ngValue]="c.id">{{c.name}} · {{c.phone}}</option>
          </select>
        </label>
        <label class="field">
          <span>Project *</span>
          <select [(ngModel)]="visit.projectId">
            <option [ngValue]="0">Select project</option>
            <option *ngFor="let p of projects" [ngValue]="p.id">{{p.name}}</option>
          </select>
        </label>
        <label class="field">
          <span>Visit date *</span>
          <input type="date" [(ngModel)]="visit.visitDate">
        </label>
        <label class="field">
          <span>Visit time *</span>
          <input type="time" [(ngModel)]="visit.visitTime">
        </label>
        <label class="field full-width">
          <span>Pickup location *</span>
          <input [(ngModel)]="visit.pickupPlace" placeholder="Enter complete pickup address (e.g. House 12, Road 4, Dhanmondi)">
        </label>
        <label class="field">
          <span>Number of visitors *</span>
          <input type="number" min="1" [(ngModel)]="visit.personCount">
        </label>
        <label class="field">
          <span>Purpose *</span>
          <select [(ngModel)]="visit.purpose">
            <option>Site Visit</option>
            <option>Booking</option>
            <option>Customer Meeting</option>
            <option>Inspection</option>
          </select>
        </label>
      </div>

      <!-- Step 2 Title -->
      <div class="section-title spaced">
        <span>2</span>
        <div>
          <h2>Transport assignment</h2>
          <p>Only active vehicles are available.</p>
        </div>
      </div>
      
      <div class="form-grid">
        <label class="field">
          <span>Vehicle *</span>
          <select [(ngModel)]="visit.vehicleId">
            <option [ngValue]="0">Select vehicle</option>
            <option *ngFor="let v of active" [ngValue]="v.id">{{v.registrationNumber}} · {{v.brand}} {{v.model}} ({{v.seatingCapacity}} seats)</option>
          </select>
        </label>
        <label class="field">
          <span>Driver</span>
          <input [(ngModel)]="visit.driver" placeholder="Driver name">
        </label>
        <label class="field full-width">
          <span>Additional information</span>
          <textarea [(ngModel)]="visit.additionalInformation" placeholder="Special instructions, contact details, or notes..."></textarea>
        </label>
      </div>
      
      <p class="error" *ngIf="error" style="margin-top: 16px;">{{error}}</p>
      
      <div class="form-actions">
        <button class="ghost-button" (click)="reset()">Clear form</button>
        <button (click)="schedule()">Schedule & auto-approve</button>
      </div>
    </article>
  `
})
export class ScheduleVisitComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  customers: Customer[] = [];
  projects: Project[] = [];
  vehicles: Vehicle[] = [];
  error = '';
  visit: any = {};

  get active() {
    return this.vehicles.filter(v => v.isActive);
  }

  ngOnInit() {
    forkJoin([
      this.api.customers(),
      this.api.projects(),
      this.api.vehicles()
    ]).subscribe(([c, p, v]) => {
      this.customers = c;
      this.projects = p;
      this.vehicles = v;
    });
    this.reset();
  }

  reset() {
    this.visit = {
      customerId: 0,
      projectId: 0,
      visitDate: '',
      visitTime: '',
      personCount: 1,
      pickupPlace: '',
      purpose: 'Site Visit',
      additionalInformation: '',
      vehicleId: 0,
      driver: '',
      remarks: ''
    };
    this.error = '';
  }

  schedule() {
    if (!this.visit.customerId || !this.visit.projectId || !this.visit.visitDate || !this.visit.visitTime || !this.visit.pickupPlace.trim() || !this.visit.vehicleId) {
      this.error = 'Please complete all required fields.';
      return;
    }
    this.api.createAdminVisit(this.visit).subscribe({
      next: () => this.router.navigateByUrl('/transport/requests'),
      error: e => this.error = e.error?.message || 'Unable to schedule visit.'
    });
  }
}
