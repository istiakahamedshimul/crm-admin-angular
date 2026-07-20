import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { CreateCustomerRequest, Customer } from '../../models/crm.models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Profiles</p><h1>Customers</h1></div>
    </section>

    <section class="form-grid">
      <form class="panel form-panel" (ngSubmit)="create()">
        <h2>Create Customer</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: -12px;">Register new customer profiles. Assign them to leads later.</p>
        
        <label>Name<input name="name" [(ngModel)]="form.name" required placeholder="e.g. Robert Smith"></label>
        <label>Phone<input name="phone" [(ngModel)]="form.phone" required placeholder="e.g. +8801500000000"></label>
        <label>Email<input name="email" type="email" [(ngModel)]="form.email" placeholder="e.g. robert@mail.com"></label>
        <label>Address<input name="address" [(ngModel)]="form.address" placeholder="e.g. Banani, Dhaka"></label>
        <label>Occupation<input name="occupation" [(ngModel)]="form.occupation" placeholder="e.g. Software Engineer"></label>
        <label>NID / Passport<input name="nid" [(ngModel)]="form.nidOrPassport" placeholder="e.g. 199100000000"></label>
        <label>Nominee name<input name="nomineeName" [(ngModel)]="form.nomineeName" placeholder="e.g. Sarah Smith"></label>
        <label>Nominee phone<input name="nomineePhone" [(ngModel)]="form.nomineePhone" placeholder="e.g. +8801600000000"></label>
        
        <button type="submit">Create Customer</button>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>

      <article class="panel">
        <h2>Customer Directory</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: -12px; margin-bottom: 20px;">Review registered clients, lead link status, and payment histories.</p>
        
        <!-- Customer Card Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          <div *ngFor="let customer of customers" style="background: var(--bg); border: 1px solid var(--line); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h3 style="font-size: 16px; font-weight: 700; color: var(--text-dark); margin: 0;">{{ customer.name }}</h3>
                <span style="font-size: 12px; color: var(--muted); display: block; margin-top: 2px;">📞 {{ customer.phone }}</span>
              </div>
              <span class="badge" [style.background]="getPaymentBg(customer.paymentStatus)" [style.color]="getPaymentColor(customer.paymentStatus)">
                {{ customer.paymentStatus }}
              </span>
            </div>
            
            <div style="border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 12px 0; font-size: 13px; display: flex; flex-direction: column; gap: 8px; color: #475569;">
              <span style="display: flex; justify-content: space-between;">
                <span style="color: var(--muted);">Assigned Executive:</span>
                <strong>{{ customer.salesExecutive || 'None' }}</strong>
              </span>
              <span style="display: flex; justify-content: space-between;">
                <span style="color: var(--muted);">Linked Lead ID:</span>
                <strong>{{ customer.leadId ? '#' + customer.leadId : 'Not linked' }}</strong>
              </span>
            </div>
            
            <div style="display: flex; gap: 8px; justify-content: flex-end; font-size: 12px;">
              <span style="color: var(--muted); align-self: center;">ID: #{{ customer.id }}</span>
            </div>
          </div>
        </div>
      </article>
    </section>
  `
})
export class CustomersComponent implements OnInit {
  private api = inject(ApiService);
  customers: Customer[] = [];
  error = '';
  form: CreateCustomerRequest = { name: '', phone: '', leadId: null };

  ngOnInit() {
    this.load();
  }

  getPaymentBg(status: string): string {
    if (!status) return '#f1f5f9';
    const s = status.toLowerCase();
    return s.includes('paid') || s.includes('done') || s.includes('approve') ? 'var(--success-bg)' : 'var(--warning-bg)';
  }

  getPaymentColor(status: string): string {
    if (!status) return '#475569';
    const s = status.toLowerCase();
    return s.includes('paid') || s.includes('done') || s.includes('approve') ? 'var(--success-dark)' : 'var(--warning-dark)';
  }

  load() {
    this.api.customers().subscribe(data => this.customers = data);
  }

  create() {
    this.error = '';
    this.api.createCustomer(this.form).subscribe({
      next: () => {
        this.form = { name: '', phone: '', leadId: null };
        this.load();
      },
      error: err => this.error = err.error?.message || 'Could not create customer.'
    });
  }
}
