import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AvailableLeadCustomer, CreateLeadRequest, Lead, Project, SalesExecutive } from '../../models/crm.models';
import { label, leadPriority, leadSource, leadStatus } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Pipeline</p><h1>Lead Management</h1></div>
    </section>

    <section class="form-grid">
      <form class="panel form-panel" (ngSubmit)="create()">
        <h2>Create & Assign Lead</h2>
        <label>Available customer
          <select name="customerId" [(ngModel)]="form.customerId" (ngModelChange)="selectCustomer($event)" required>
            <option [ngValue]="null">Select customer</option>
            <option *ngFor="let customer of availableCustomers" [ngValue]="customer.id">{{ customer.name }} · {{ customer.phone }}</option>
          </select>
        </label>
        <label>Customer name<input name="customerName" [(ngModel)]="form.customerName" readonly required></label>
        <label>Phone<input name="phone" [(ngModel)]="form.phone" readonly required></label>
        <label>Email<input name="email" [(ngModel)]="form.email" readonly></label>
        <label>Preferred location<input name="preferredLocation" [(ngModel)]="form.preferredLocation" placeholder="e.g. Gulshan"></label>
        <label>Project (optional)
          <select name="projectId" [(ngModel)]="form.projectId">
            <option [ngValue]="null">None</option>
            <option *ngFor="let project of projects" [ngValue]="project.id">{{ project.name }}</option>
          </select>
        </label>
        <label>Assign sales executive
          <select name="assignedToId" [(ngModel)]="form.assignedToId" required>
            <option [ngValue]="null">Select executive</option>
            <option *ngFor="let sales of salesExecutives" [ngValue]="sales.id">{{ sales.fullName }}</option>
          </select>
        </label>
        <label>Priority
          <select name="priority" [(ngModel)]="form.priority">
            <option [ngValue]="0">Cold</option><option [ngValue]="1">Warm</option><option [ngValue]="2">Hot</option>
          </select>
        </label>
        <button type="submit">Create Lead</button>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>

      <article class="panel">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2>Assigned Leads</h2>
            <p style="color: var(--muted); font-size: 13px; margin: 2px 0 0;">Review lead assignments and sales activities.</p>
          </div>
          
          <!-- Priority Filter Pills -->
          <div style="display: flex; gap: 6px; background: var(--bg); border: 1px solid var(--line); padding: 4px; border-radius: 8px;">
            <button type="button" (click)="selectedPriority = null" style="min-height: 28px; padding: 0 10px; font-size: 12px; border-radius: 6px;" [class.ghost-button]="selectedPriority !== null">
              All
            </button>
            <button type="button" (click)="selectedPriority = 2" style="min-height: 28px; padding: 0 10px; font-size: 12px; border-radius: 6px;" [class.ghost-button]="selectedPriority !== 2" [style.background]="selectedPriority === 2 ? 'var(--danger)' : ''">
              Hot
            </button>
            <button type="button" (click)="selectedPriority = 1" style="min-height: 28px; padding: 0 10px; font-size: 12px; border-radius: 6px;" [class.ghost-button]="selectedPriority !== 1" [style.background]="selectedPriority === 1 ? 'var(--warning)' : ''" [style.color]="selectedPriority === 1 ? 'var(--warning-dark)' : ''">
              Warm
            </button>
            <button type="button" (click)="selectedPriority = 0" style="min-height: 28px; padding: 0 10px; font-size: 12px; border-radius: 6px;" [class.ghost-button]="selectedPriority !== 0" [style.background]="selectedPriority === 0 ? 'var(--accent)' : ''">
              Cold
            </button>
          </div>
        </div>

        <!-- Modern Leads Card Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          <div *ngFor="let lead of filteredLeads" style="background: var(--bg); border: 1px solid var(--line); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; position: relative; overflow: hidden; transition: all 0.2s ease;">
            <!-- Left Accent Strip for Priority -->
            <div [style.background]="getPriorityColor(lead.priority)" style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px;"></div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-left: 6px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0;">{{ lead.customerName }}</h3>
                <span style="font-size: 12px; color: var(--muted); display: block; margin-top: 2px;">📞 {{ lead.phone }}</span>
              </div>
              <span class="badge" [style.background]="getPriorityBg(lead.priority)" [style.color]="getPriorityTextColor(lead.priority)">
                {{ label(leadPriority, lead.priority) }}
              </span>
            </div>
            
            <div style="border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 10px 0 10px 6px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; color: #475569;">
              <span style="display: flex; align-items: center; gap: 6px;">🏢 Project: <strong>{{ lead.projectName || 'None' }}</strong></span>
              <span style="display: flex; align-items: center; gap: 6px;">👤 Executive: <strong>{{ lead.assignedToName || 'Unassigned' }}</strong></span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding-left: 6px; font-size: 12px; color: var(--muted);">
              <span>Status: <span class="status-pill" [class.pending]="lead.status === 0" [class.approved]="lead.status === 1">{{ label(leadStatus, lead.status) }}</span></span>
            </div>
          </div>
        </div>
        
        <div *ngIf="filteredLeads.length === 0" class="empty-card" style="margin-top: 20px;">
          No leads match the selected priority criteria.
        </div>
      </article>
    </section>
  `
})
export class LeadsComponent implements OnInit {
  private api = inject(ApiService);
  leads: Lead[] = [];
  salesExecutives: SalesExecutive[] = [];
  projects: Project[] = [];
  availableCustomers: AvailableLeadCustomer[] = [];
  error = '';
  label = label;
  leadPriority = leadPriority;
  leadStatus = leadStatus;

  selectedPriority: number | null = null;

  form: CreateLeadRequest = {
    customerId: null,
    customerName: '',
    phone: '',
    alternativePhone: null,
    email: null,
    address: null,
    budgetRange: null,
    preferredLocation: null,
    projectId: null,
    source: leadSource.indexOf('Manual'),
    priority: 1,
    assignedToId: null,
    remarks: null
  };

  get filteredLeads() {
    if (this.selectedPriority === null) return this.leads;
    return this.leads.filter(x => x.priority === this.selectedPriority);
  }

  getPriorityColor(p: number): string {
    return p === 2 ? '#ef4444' : p === 1 ? '#f59e0b' : '#3b82f6';
  }

  getPriorityBg(p: number): string {
    return p === 2 ? 'var(--danger-bg)' : p === 1 ? 'var(--warning-bg)' : '#eff6ff';
  }

  getPriorityTextColor(p: number): string {
    return p === 2 ? 'var(--danger-dark)' : p === 1 ? 'var(--warning-dark)' : '#1d4ed8';
  }

  ngOnInit() {
    this.load();
    this.api.salesExecutives().subscribe(data => this.salesExecutives = data);
    this.api.projects().subscribe(data => this.projects = data);
    this.loadAvailableCustomers();
  }

  loadAvailableCustomers() {
    this.api.customersAvailableForLead().subscribe(data => this.availableCustomers = data);
  }

  selectCustomer(customerId: number | null) {
    const customer = this.availableCustomers.find(x => x.id === customerId);
    this.form.customerName = customer?.name ?? '';
    this.form.phone = customer?.phone ?? '';
    this.form.alternativePhone = customer?.alternativePhone ?? null;
    this.form.email = customer?.email ?? null;
    this.form.address = customer?.address ?? null;
    if (customer?.projectId) this.form.projectId = customer.projectId;
  }

  load() {
    this.api.leads().subscribe(data => this.leads = data);
  }

  create() {
    this.error = '';
    this.api.createLead(this.form).subscribe({
      next: () => {
        this.form = { ...this.form, customerId: null, customerName: '', phone: '', email: null, preferredLocation: null, projectId: null, assignedToId: null };
        this.load();
        this.loadAvailableCustomers();
      },
      error: err => this.error = err.error?.message || 'Could not create lead.'
    });
  }
}
