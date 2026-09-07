import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { UserSummary } from '../../models/crm.models';
import { VoiceService } from '../../core/voice.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Team management</p><h1>Sales Accounts</h1><p class="page-copy">Manage employee access, team placement and account status.</p></div>
      <a routerLink="/users/new" class="add-button"><span>＋</span> Add Employee</a>
    </section>

    <section class="stats-grid">
      <article><span>Total employees</span><strong>{{ salesUsers.length }}</strong></article>
      <article><span>Active accounts</span><strong class="active-number">{{ activeCount }}</strong></article>
      <article><span>Inactive accounts</span><strong class="inactive-number">{{ salesUsers.length - activeCount }}</strong></article>
      <article><span>Teams represented</span><strong>{{ teamCount }}</strong></article>
    </section>

    <section class="table-card">
      <header class="table-toolbar">
        <div><h2>All sales employees</h2><p>{{ filteredUsers.length }} matching accounts</p></div>
        <div class="filters">
          <input type="search" [(ngModel)]="search" placeholder="Search name, email or phone">
          <select [(ngModel)]="team"><option value="">All teams</option><option *ngFor="let name of teams" [value]="name">{{ name }}</option></select>
          <select [(ngModel)]="status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <button type="button" class="refresh" (click)="load()" [disabled]="loading">{{ loading ? 'Loading…' : 'Refresh' }}</button>
        </div>
      </header>

      <div class="table-scroll">
        <table>
          <thead><tr><th>Employee</th><th>Contact</th><th>Designation</th><th>Sales group</th><th>Team / sub-team</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers" (click)="openDetail(user)" tabindex="0" (keydown.enter)="openDetail(user)">
              <td><div class="employee"><span class="avatar">{{ initials(user.fullName) }}</span><div><strong>{{ user.fullName }}</strong><small>ID #{{ user.id }}</small></div></div></td>
              <td><strong class="email">{{ user.email }}</strong><small>{{ user.phone }}</small></td>
              <td>{{ user.designation || 'Sales Executive' }}</td>
              <td>{{ user.salesGroup || 'Not assigned' }}</td>
              <td>{{ user.salesTeam || 'Not assigned' }}</td>
              <td><span class="status-pill" [class.active]="user.isActive" [class.inactive]="!user.isActive"><i></i>{{ user.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td><button type="button" class="view-button" (click)="$event.stopPropagation(); openDetail(user)">View profile →</button></td>
            </tr>
            <tr *ngIf="!loading && !filteredUsers.length"><td colspan="7" class="empty">No employee accounts match these filters.</td></tr>
          </tbody>
        </table>
        <div class="empty" *ngIf="loading">Loading employee accounts…</div>
      </div>
    </section>
  `,
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private voiceService = inject(VoiceService);
  users: UserSummary[] = [];
  search = '';
  team = '';
  status = '';
  loading = true;
  private pendingAutoSelectId: number | null = null;

  get salesUsers() { return this.users.filter(user => user.role === 'SalesExecutive'); }
  get activeCount() { return this.salesUsers.filter(user => user.isActive).length; }
  get teams() { return [...new Set(this.salesUsers.map(user => user.salesTeam).filter((name): name is string => !!name))].sort(); }
  get teamCount() { return this.teams.length; }
  get filteredUsers() {
    const term = this.search.trim().toLowerCase();
    return this.salesUsers
      .filter(user => !term || [user.fullName, user.email, user.phone, user.designation, user.salesGroup, user.salesTeam].some(value => value?.toLowerCase().includes(term)))
      .filter(user => !this.team || user.salesTeam === this.team)
      .filter(user => !this.status || (this.status === 'active' ? user.isActive : !user.isActive))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  ngOnInit() {
    this.load();
    this.voiceService.autoSelectSalesExecutive$.subscribe(id => {
      if (!id) return;
      const user = this.salesUsers.find(item => item.id === id);
      if (user) this.openDetail(user); else this.pendingAutoSelectId = id;
    });
  }

  load() {
    this.loading = true;
    this.api.users().subscribe({
      next: data => {
        this.users = data;
        this.loading = false;
        if (this.pendingAutoSelectId) {
          const user = this.salesUsers.find(item => item.id === this.pendingAutoSelectId);
          if (user) this.openDetail(user);
          this.pendingAutoSelectId = null;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  openDetail(user: UserSummary) {
    this.voiceService.autoSelectSalesExecutiveSubject.next(null);
    void this.router.navigate(['/users', user.id]);
  }

  initials(name: string) { return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'SE'; }
}
