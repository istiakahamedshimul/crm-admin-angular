import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Vehicle } from '../../models/crm.models';
import { TransportNavComponent } from './transport-nav.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TransportNavComponent],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Transport Management</p>
        <h1>Vehicles</h1>
        <p class="page-copy">Add, edit, and control which vehicles can be assigned to visits.</p>
      </div>
      <button (click)="openNew()">+ Add vehicle</button>
    </section>
    
    <app-transport-nav/>

    <p class="success" *ngIf="message">{{message}}</p>

    <!-- Register Form Drawer -->
    <article class="panel form-card" *ngIf="showForm" style="margin-bottom: 24px;">
      <div class="section-title">
        <span>{{editingId ? 'E' : '+'}}</span>
        <div>
          <h2>{{editingId ? 'Edit vehicle' : 'Register new vehicle'}}</h2>
          <p>Enter the vehicle identity and capacity details.</p>
        </div>
      </div>
      <div class="form-grid">
        <label class="field">
          <span>Registration number *</span>
          <input [(ngModel)]="draft.registrationNumber" placeholder="DHAKA METRO-GA-12-3456">
        </label>
        <label class="field">
          <span>Vehicle type *</span>
          <select [(ngModel)]="draft.vehicleType">
            <option value="">Select vehicle type</option>
            <option *ngFor="let t of types">{{t}}</option>
          </select>
        </label>
        <label class="field">
          <span>Brand *</span>
          <input [(ngModel)]="draft.brand" placeholder="e.g. Toyota">
        </label>
        <label class="field">
          <span>Model *</span>
          <input [(ngModel)]="draft.model" placeholder="e.g. Noah / Hiace">
        </label>
        <label class="field">
          <span>Color</span>
          <select [(ngModel)]="draft.color">
            <option value="">Select color</option>
            <option *ngFor="let c of colors">{{c}}</option>
          </select>
        </label>
        <label class="field">
          <span>Seating capacity *</span>
          <input type="number" min="1" max="100" [(ngModel)]="draft.seatingCapacity">
        </label>
      </div>
      
      <p class="error" *ngIf="error" style="margin-top: 16px;">{{error}}</p>
      
      <div class="form-actions">
        <button class="ghost-button" (click)="closeForm()" [disabled]="saving">Cancel</button>
        <button (click)="save()" [disabled]="saving">{{saving ? 'Saving...' : (editingId ? 'Update vehicle' : 'Save vehicle')}}</button>
      </div>
    </article>

    <!-- Vehicle Grid Display -->
    <div class="vehicle-grid">
      <article class="vehicle-card" *ngFor="let v of vehicles">
        <div class="vehicle-card-head">
          <div class="vehicle-icon">{{icon(v.vehicleType)}}</div>
          <span class="status-pill" [class.approved]="v.isActive" [class.inactive]="!v.isActive">
            {{v.isActive ? 'Active' : 'Inactive'}}
          </span>
        </div>
        
        <h2>{{v.brand}} {{v.model}}</h2>
        <strong class="registration">{{v.registrationNumber}}</strong>
        
        <div class="vehicle-meta">
          <span>{{v.vehicleType}}</span>
          <span>🎨 {{v.color||'Color not set'}}</span>
          <span>👥 {{v.seatingCapacity}} seats</span>
        </div>
        
        <div class="drawer-actions" style="margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line); width: 100%; display: flex; gap: 8px;">
          <button class="ghost-button" (click)="edit(v)" style="flex: 1; min-height: 36px; font-size: 13px; border-radius: 6px;">Edit</button>
          <button [class.danger]="v.isActive" [class.ghost-button]="!v.isActive" (click)="toggle(v)" style="flex: 1; min-height: 36px; font-size: 13px; border-radius: 6px;">
            {{v.isActive ? 'Deactivate' : 'Activate'}}
          </button>
        </div>
      </article>
      
      <div class="empty-card" *ngIf="!vehicles.length" style="grid-column: 1 / -1;">
        No vehicles registered yet.
      </div>
    </div>
  `
})
export class VehiclesComponent implements OnInit {
  private api = inject(ApiService);
  vehicles: Vehicle[] = [];
  showForm = false;
  editingId?: number;
  error = '';
  message = '';
  saving = false;
  types = ['Sedan', 'SUV', 'Microbus', 'Minivan', 'Pickup', 'Bus', 'Other'];
  colors = ['Black', 'White', 'Silver', 'Gray', 'Blue', 'Red', 'Green', 'Brown', 'Other'];
  draft: any = {};

  ngOnInit() {
    this.load();
    this.resetDraft();
  }

  load() {
    this.api.vehicles().subscribe({
      next: v => this.vehicles = v,
      error: e => this.error = e.error?.message || 'Unable to load vehicles.'
    });
  }

  openNew() {
    this.editingId = undefined;
    this.resetDraft();
    this.showForm = true;
    this.error = '';
    this.message = '';
  }

  edit(v: Vehicle) {
    this.editingId = v.id;
    this.draft = {
      registrationNumber: v.registrationNumber,
      vehicleType: v.vehicleType,
      brand: v.brand,
      model: v.model,
      color: v.color || '',
      seatingCapacity: v.seatingCapacity,
      isActive: v.isActive
    };
    this.showForm = true;
    this.error = '';
    this.message = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm() {
    this.showForm = false;
    this.editingId = undefined;
    this.error = '';
    this.resetDraft();
  }

  resetDraft() {
    this.draft = {
      registrationNumber: '',
      vehicleType: '',
      brand: '',
      model: '',
      color: '',
      seatingCapacity: 4,
      isActive: true
    };
  }

  save() {
    if (!this.draft.registrationNumber.trim() || !this.draft.vehicleType || !this.draft.brand.trim() || !this.draft.model.trim()) {
      this.error = 'Complete all required fields.';
      return;
    }
    this.error = '';
    this.saving = true;
    const request = this.editingId ? this.api.updateVehicle(this.editingId, this.draft) : this.api.createVehicle(this.draft);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.message = this.editingId ? 'Vehicle updated successfully.' : 'Vehicle added successfully.';
        this.closeForm();
        this.load();
      },
      error: e => {
        this.saving = false;
        this.error = e.error?.message || 'Unable to save vehicle.';
      }
    });
  }

  toggle(v: Vehicle) {
    this.error = '';
    this.api.setVehicleStatus(v.id, !v.isActive).subscribe({
      next: () => {
        this.message = `Vehicle ${v.isActive ? 'deactivated' : 'activated'} successfully.`;
        this.load();
      },
      error: e => this.error = e.error?.message || 'Unable to update vehicle status.'
    });
  }

  icon(t: string) {
    return t === 'Sedan' ? '🚗' : t === 'SUV' ? '🚙' : t === 'Microbus' ? '🚐' : t === 'Bus' ? '🚌' : '🚚';
  }
}
