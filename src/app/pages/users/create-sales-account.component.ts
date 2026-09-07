import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CreateSalesExecutiveRequest } from '../../models/crm.models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Account creation</p><h1>Add Sales Employee</h1><p class="page-copy">Create secure portal access and place the employee in the correct sales team.</p></div>
      <a routerLink="/users" class="back-link">← All employees</a>
    </section>

    <section class="create-layout">
      <form class="form-card" (ngSubmit)="create()" #accountForm="ngForm">
        <header><span>01</span><div><h2>Employee information</h2><p>All fields are required for account creation.</p></div></header>
        <div class="form-grid">
          <label>Full name<input name="fullName" [(ngModel)]="form.fullName" autocomplete="name" placeholder="Employee's full name" required></label>
          <label>Designation<input name="designation" [(ngModel)]="form.designation" placeholder="e.g. Senior Sales Executive" required></label>
          <label>Email address<input name="email" type="email" [(ngModel)]="form.email" autocomplete="email" placeholder="employee@company.com" required></label>
          <label>Phone number<input name="phone" [(ngModel)]="form.phone" autocomplete="tel" placeholder="01XXXXXXXXX" required></label>
          <label>Team / sub-team<select name="salesTeamId" [(ngModel)]="form.salesTeamId" required><option [ngValue]="null">Select a team</option><optgroup *ngFor="let group of hierarchy" [label]="group.name"><option *ngFor="let team of group.teams" [ngValue]="team.id">{{ team.parentTeamId ? '↳ ' : '' }}{{ team.name }}</option></optgroup></select></label>
          <label>Temporary password<input name="password" [(ngModel)]="form.password" type="password" autocomplete="new-password" minlength="8" required></label>
        </div>
        <div class="notice"><strong>Account security</strong><span>Share the temporary password privately and ask the employee to change it after their first login.</span></div>
        <p class="error" *ngIf="error">{{ error }}</p>
        <footer><a routerLink="/users" class="cancel">Cancel</a><button type="submit" [disabled]="saving || accountForm.invalid">{{ saving ? 'Creating account…' : 'Create Employee Account' }}</button></footer>
      </form>

      <aside>
        <div class="preview-avatar">{{ initials }}</div>
        <p class="eyebrow">Account preview</p><h2>{{ form.fullName || 'New employee' }}</h2><span>{{ form.designation || 'Sales Executive' }}</span>
        <dl><div><dt>Email</dt><dd>{{ form.email || 'Not entered' }}</dd></div><div><dt>Phone</dt><dd>{{ form.phone || 'Not entered' }}</dd></div><div><dt>Access</dt><dd>Sales mobile application</dd></div></dl>
        <div class="success-box" *ngIf="message"><strong>✓ Account created</strong><p>{{ message }}</p><a routerLink="/users">Return to employee list →</a></div>
      </aside>
    </section>
  `,
  styles: [`
    :host{display:block}.back-link,.cancel{padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:#fff;color:#334155;font-weight:700}.create-layout{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:18px;align-items:start}.form-card,.create-layout aside{border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:var(--shadow)}.form-card{padding:24px}.form-card header{display:flex;align-items:center;gap:12px;padding-bottom:18px;margin-bottom:20px;border-bottom:1px solid var(--line)}.form-card header>span{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#e6f4f2;color:#0f766e;font-weight:900}.form-card h2,.form-card p{margin:0}.form-card header p{margin-top:3px;color:#64748b;font-size:12px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.form-grid label{display:grid;gap:7px;color:#475569;font-size:12px;font-weight:800}.form-grid input,.form-grid select{height:44px}.notice{display:flex;gap:10px;padding:13px;margin-top:18px;border-radius:11px;background:#eff6ff;color:#1e40af;font-size:11px}.notice span{color:#475569}.form-card footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding-top:20px;margin-top:20px;border-top:1px solid var(--line)}.cancel{padding:11px 16px}.create-layout aside{position:sticky;top:18px;padding:24px;text-align:center}.preview-avatar{display:grid;place-items:center;width:72px;height:72px;margin:0 auto 16px;border-radius:20px;background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff;font-size:22px;font-weight:900}.create-layout aside h2{margin:3px 0}.create-layout aside>span{color:#0f766e;font-size:12px;font-weight:800}.create-layout dl{display:grid;gap:0;margin:22px 0 0;text-align:left}.create-layout dl div{padding:11px 0;border-top:1px solid var(--line)}dt{color:#64748b;font-size:10px;text-transform:uppercase}dd{margin:3px 0 0;color:#0f172a;font-size:12px;font-weight:700;overflow-wrap:anywhere}.success-box{padding:14px;margin-top:18px;border-radius:12px;background:#ecfdf5;color:#047857;text-align:left}.success-box p{margin:5px 0;font-size:12px}.success-box a{font-size:11px;font-weight:800}@media(max-width:900px){.create-layout{grid-template-columns:1fr}.create-layout aside{position:static}}@media(max-width:620px){.form-card{padding:18px}.form-grid{grid-template-columns:1fr}.form-card footer{align-items:stretch;flex-direction:column-reverse}.form-card footer>*{width:100%;text-align:center}}
  `]
})
export class CreateSalesAccountComponent implements OnInit {
  private api = inject(ApiService);
  hierarchy: any[] = [];
  saving = false;
  error = '';
  message = '';
  form: CreateSalesExecutiveRequest = { fullName: '', email: '', phone: '', designation: 'Sales Executive', password: 'Sales@12345', salesTeamId: null };

  get initials() { return this.form.fullName.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'SE'; }
  ngOnInit() { this.api.salesHierarchy().subscribe({ next: data => this.hierarchy = data, error: () => this.hierarchy = [] }); }
  create() {
    this.saving = true; this.error = ''; this.message = '';
    this.api.createSalesExecutive(this.form).subscribe({
      next: () => { this.saving = false; this.message = `${this.form.fullName}'s sales account is ready.`; },
      error: error => { this.saving = false; this.error = error.error?.message || 'Could not create the employee account.'; }
    });
  }
}
