import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AvailableLeadCustomer, CreateLeadRequest, Lead, Project, SalesExecutive } from '../../models/crm.models';
import { label, leadSource, leadStatus, projectType } from '../../shared/format';

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
        <label>Lead name<input name="customerName" [(ngModel)]="form.customerName" required></label>
        <label>Phone<input name="phone" [(ngModel)]="form.phone" required></label>
        <label>Email (optional)<input name="email" type="email" [(ngModel)]="form.email"></label>
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
        <button type="submit">Create Lead</button>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>

      <form class="panel form-panel" (ngSubmit)="importLeads()">
        <h2>Import Leads</h2>
        <p>Name and Phone are mandatory. The property type is taken automatically from the project selected for the lead.</p>
        <label>CSV, XLS or XLSX<input type="file" accept=".csv,.xls,.xlsx" (change)="chooseImportFile($event)" required></label>
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="autoAssign" [(ngModel)]="autoAssign"> Auto-assign equally among active sales employees</label>
        <button type="submit" [disabled]="!importFile">Import Leads</button>
        <a [href]="templateUrl" target="_blank">Download demo CSV</a>
        <p *ngIf="importMessage">{{ importMessage }}</p>
      </form>

      <article class="panel">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2>Assigned Leads</h2>
            <p style="color: var(--muted); font-size: 13px; margin: 2px 0 0;">Review lead assignments and sales activities.</p>
          </div>
          <label style="min-width:220px">Filter by property type
            <select [(ngModel)]="selectedProjectType">
              <option [ngValue]="null">All property types</option>
              <option *ngFor="let type of propertyTypeOptions" [ngValue]="type.value">{{ type.label }}</option>
            </select>
          </label>
        </div>

        <!-- Modern Leads Card Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          <div *ngFor="let lead of filteredLeads" style="background: var(--bg); border: 1px solid var(--line); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; position: relative; overflow: hidden; transition: all 0.2s ease;">
            <div style="background:var(--brand);position:absolute;left:0;top:0;bottom:0;width:4px;"></div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-left: 6px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0;">{{ lead.customerName }}</h3>
                <span style="font-size: 12px; color: var(--muted); display: block; margin-top: 2px;">📞 {{ lead.phone }}</span>
              </div>
              <span class="badge">
                {{ lead.projectType === null || lead.projectType === undefined ? 'None' : label(projectType, lead.projectType) }}
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
          No leads found.
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
  importFile?: File;
  autoAssign = false;
  importMessage = '';
  templateUrl = '';
  label = label;
  projectType = projectType;
  leadStatus = leadStatus;
  selectedProjectType: number | null = null;
  propertyTypeOptions = projectType.map((type, value) => ({ value, label: type }));

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
    assignedToId: null,
    remarks: null
  };

  get filteredLeads() {
    return this.selectedProjectType === null
      ? this.leads
      : this.leads.filter(lead => lead.projectType === this.selectedProjectType);
  }

  ngOnInit() {
    this.load();
    this.api.salesExecutives().subscribe(data => this.salesExecutives = data);
    this.api.projects().subscribe(data => this.projects = data);
    this.loadAvailableCustomers();
    this.templateUrl = this.api.leadImportTemplateUrl();
  }

  chooseImportFile(event: Event) {
    this.importFile = (event.target as HTMLInputElement).files?.[0];
  }

  importLeads() {
    if (!this.importFile) return;
    this.importMessage = '';
    this.api.importLeads(this.importFile, this.autoAssign).subscribe({
      next: result => { this.importMessage = `${result.imported} leads imported; ${result.skipped.length} skipped.`; this.load(); },
      error: err => this.importMessage = err.error?.message || 'Import failed.'
    });
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
