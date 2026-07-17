import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { CreateLeadRequest, Lead, Project, SalesExecutive } from '../../models/crm.models';
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
        <label>Customer name<input name="customerName" [(ngModel)]="form.customerName" required></label>
        <label>Phone<input name="phone" [(ngModel)]="form.phone" required></label>
        <label>Email<input name="email" [(ngModel)]="form.email"></label>
        <label>Preferred location<input name="preferredLocation" [(ngModel)]="form.preferredLocation"></label>
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
        <h2>Assigned Leads</h2>
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Project</th><th>Priority</th><th>Status</th><th>Sales Executive</th></tr></thead>
          <tbody>
            <tr *ngFor="let lead of leads">
              <td>{{ lead.customerName }}</td>
              <td>{{ lead.phone }}</td>
              <td>{{ lead.projectName || 'None' }}</td>
              <td>{{ label(leadPriority, lead.priority) }}</td>
              <td><span class="badge">{{ label(leadStatus, lead.status) }}</span></td>
              <td>{{ lead.assignedToName || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>
  `
})
export class LeadsComponent implements OnInit {
  private api = inject(ApiService);
  leads: Lead[] = [];
  salesExecutives: SalesExecutive[] = [];
  projects: Project[] = [];
  error = '';
  label = label;
  leadPriority = leadPriority;
  leadStatus = leadStatus;
  form: CreateLeadRequest = {
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

  ngOnInit() {
    this.load();
    this.api.salesExecutives().subscribe(data => this.salesExecutives = data);
    this.api.projects().subscribe(data => this.projects = data);
  }

  load() {
    this.api.leads().subscribe(data => this.leads = data);
  }

  create() {
    this.error = '';
    this.api.createLead(this.form).subscribe({
      next: () => {
        this.form = { ...this.form, customerName: '', phone: '', email: null, preferredLocation: null, projectId: null, assignedToId: null };
        this.load();
      },
      error: err => this.error = err.error?.message || 'Could not create lead.'
    });
  }
}
