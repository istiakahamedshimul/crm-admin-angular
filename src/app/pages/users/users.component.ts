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
        <label>Full name<input name="fullName" [(ngModel)]="form.fullName" required></label>
        <label>Email<input name="email" [(ngModel)]="form.email" required></label>
        <label>Phone<input name="phone" [(ngModel)]="form.phone" required></label>
        <label>Password<input name="password" [(ngModel)]="form.password" type="password" required></label>
        <button type="submit">Create Account</button>
        <p class="success" *ngIf="message">{{ message }}</p>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>

      <article class="panel">
        <h2>Users</h2>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.fullName }}</td><td>{{ user.email }}</td><td>{{ user.role }}</td><td><span class="badge">{{ user.isActive ? 'Active' : 'Inactive' }}</span></td>
            </tr>
          </tbody>
        </table>
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
