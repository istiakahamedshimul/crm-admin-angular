import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { CreateSalesExecutiveRequest, UserSummary } from '../../models/crm.models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Team</p><h1>Sales Accounts</h1></div>
    </section>

    <section class="form-grid">
      <form class="panel form-panel" (ngSubmit)="create()">
        <h2>Create Sales Executive</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: -12px;">Add new sales members to assign incoming leads.</p>
        
        <label>Full name<input name="fullName" [(ngModel)]="form.fullName" required placeholder="e.g. John Doe"></label>
        <label>Email<input name="email" [(ngModel)]="form.email" required placeholder="e.g. john@realestate.com"></label>
        <label>Phone<input name="phone" [(ngModel)]="form.phone" required placeholder="e.g. +8801700000000"></label>
        <label>Password<input name="password" [(ngModel)]="form.password" type="password" required></label>
        
        <button type="submit">Create Account</button>
        <p class="success" *ngIf="message">{{ message }}</p>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>

      <article class="panel">
        <h2>Users Directory</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: -12px; margin-bottom: 20px;">List of all active CRM executives and administrators.</p>
        
        <!-- Modern Card Grid instead of Table -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;">
          <div *ngFor="let user of users" style="background: var(--bg); border: 1px solid var(--line); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s ease, box-shadow 0.2s ease; position: relative;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <!-- Initials Avatar -->
              <div style="width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; color: white; background: linear-gradient(135deg, var(--brand) 0%, #06b6d4 100%); font-weight: 800; font-size: 14px; box-shadow: 0 4px 10px rgba(15, 118, 110, 0.25);">
                {{ getInitials(user.fullName) }}
              </div>
              <div>
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0;">{{ user.fullName }}</h3>
                <span style="font-size: 12px; color: var(--muted); display: block; margin-top: 1px;">{{ user.role }}</span>
              </div>
            </div>
            
            <div style="border-top: 1px solid var(--line); padding-top: 12px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; color: #475569;">
              <span style="display: flex; align-items: center; gap: 8px;">📧 {{ user.email }}</span>
              <span style="display: flex; align-items: center; gap: 8px;">📱 {{ user.phone || 'No phone' }}</span>
            </div>
            
            <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 10px;">
              <span class="status-pill" [class.approved]="user.isActive" [class.inactive]="!user.isActive">
                {{ user.isActive ? 'Active Member' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </section>
  `
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  users: UserSummary[] = [];
  message = '';
  error = '';
  form: CreateSalesExecutiveRequest = { fullName: '', email: '', phone: '', password: 'Sales@12345' };

  ngOnInit() { this.load(); }

  load() {
    this.api.users().subscribe(data => this.users = data);
  }

  getInitials(name: string): string {
    if (!name) return 'EX';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  create() {
    this.message = '';
    this.error = '';
    this.api.createSalesExecutive(this.form).subscribe({
      next: () => {
        this.message = 'Sales executive created.';
        this.form = { fullName: '', email: '', phone: '', password: 'Sales@12345' };
        this.load();
      },
      error: err => this.error = err.error?.message || 'Could not create sales executive.'
    });
  }
}
