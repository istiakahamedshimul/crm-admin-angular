import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { CreateCustomerRequest, Customer, Lead } from '../../models/crm.models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Profiles</p><h1>Customers</h1></div>
    </section>

    <section class="form-grid">
      <form class="panel form-panel" (ngSubmit)="create()">
        <h2>Create Customer From Lead</h2>
        <label>Assigned lead
          <select name="leadId" [(ngModel)]="form.leadId" required>
            <option [ngValue]="0">Select lead</option>
            <option *ngFor="let lead of leads" [ngValue]="lead.id">{{ lead.customerName }} - {{ lead.phone }}</option>
          </select>
        </label>
        <label>Occupation<input name="occupation" [(ngModel)]="form.occupation"></label>
        <label>NID / Passport<input name="nid" [(ngModel)]="form.nidOrPassport"></label>
        <label>Nominee name<input name="nomineeName" [(ngModel)]="form.nomineeName"></label>
        <label>Nominee phone<input name="nomineePhone" [(ngModel)]="form.nomineePhone"></label>
        <button type="submit">Create Customer</button>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>

      <article class="panel">
        <h2>Customer Profiles</h2>
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Lead</th><th>Sales Executive</th><th>Payment</th></tr></thead>
          <tbody>
            <tr *ngFor="let customer of customers">
              <td>{{ customer.name }}</td><td>{{ customer.phone }}</td><td>#{{ customer.leadId || '-' }}</td><td>{{ customer.salesExecutive || '-' }}</td><td><span class="badge">{{ customer.paymentStatus }}</span></td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>
  `
})
export class CustomersComponent implements OnInit {
  private api = inject(ApiService);
  customers: Customer[] = [];
  leads: Lead[] = [];
  error = '';
  form: CreateCustomerRequest = { leadId: 0 };

  ngOnInit() {
    this.load();
    this.api.leads().subscribe(data => this.leads = data);
  }

  load() {
    this.api.customers().subscribe(data => this.customers = data);
  }

  create() {
    this.error = '';
    this.api.createCustomer(this.form).subscribe({
      next: () => {
        this.form = { leadId: 0 };
        this.load();
      },
      error: err => this.error = err.error?.message || 'Could not create customer.'
    });
  }
}
