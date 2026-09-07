import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { '[class.readonly]': '!auth.hasPermission("users.manage")' },
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Sales organization</p><h1>Sales Hierarchy</h1><p class="page-copy">Organize reporting lines, leaders, members and monthly performance targets.</p></div>
      <div class="period-control"><label>Reporting month<input type="month" [(ngModel)]="month"></label><button type="button" class="ghost-button" (click)="load()">Refresh</button></div>
    </section>

    <section class="summary-grid">
      <article><span>Sales groups</span><strong>{{ groups.length }}</strong><small>Active reporting groups</small></article>
      <article><span>Teams</span><strong>{{ teamCount }}</strong><small>Main teams and sub-teams</small></article>
      <article><span>Sales employees</span><strong>{{ salesUsers.length }}</strong><small>Active executives</small></article>
      <article><span>Assigned leaders</span><strong>{{ leaderCount }}</strong><small>Across all team levels</small></article>
    </section>

    <section class="setup-grid" *ngIf="auth.hasPermission('users.manage')">
      <form class="setup-card" *ngIf="auth.hasRole('SuperAdmin')" (ngSubmit)="createGroup()">
        <header><span class="setup-icon">G</span><div><h2>Create sales group</h2><p>Set the top-level reporting owner.</p></div></header>
        <div class="fields"><label>Group name<input name="groupName" [(ngModel)]="groupForm.name" placeholder="e.g. Dhaka Sales" required></label><label>Group leader<select name="groupLeader" [(ngModel)]="groupForm.groupLeaderId" required><option [ngValue]="null">Select group leader</option><option *ngFor="let user of groupLeaders" [ngValue]="user.id">{{ user.fullName }}</option></select></label><button>Create Group</button></div>
      </form>

      <form class="setup-card" *ngIf="groups.length" (ngSubmit)="createTeam()">
        <header><span class="setup-icon team-icon">T</span><div><h2>Create team or sub-team</h2><p>Add a working unit under a sales group.</p></div></header>
        <div class="fields team-fields"><label>Sales group<select name="teamGroup" [(ngModel)]="teamForm.salesGroupId" (ngModelChange)="teamForm.parentTeamId=null" required><option *ngFor="let group of groups" [ngValue]="group.id">{{ group.name }}</option></select></label><label>Level<select name="teamParent" [(ngModel)]="teamForm.parentTeamId"><option [ngValue]="null">Main team</option><option *ngFor="let team of selectedGroup?.teams" [ngValue]="team.id" [disabled]="team.parentTeamId">Under {{ team.name }}</option></select></label><label>Team name<input name="teamName" [(ngModel)]="teamForm.name" placeholder="Team name" required></label><label>Team leader<select name="teamLeader" [(ngModel)]="teamForm.teamLeaderId"><option [ngValue]="null">Assign later</option><option *ngFor="let user of salesUsers" [ngValue]="user.id">{{ user.fullName }}</option></select></label><button>Create Team</button></div>
      </form>
    </section>

    <div class="alert error" *ngIf="error">{{ error }}<button type="button" (click)="error=''">×</button></div>
    <div class="alert success" *ngIf="message">{{ message }}<button type="button" (click)="message=''">×</button></div>

    <section class="empty-state" *ngIf="!groups.length && !error"><span>G</span><h2>No sales groups yet</h2><p>Create your first sales group to start building the organization.</p></section>

    <section class="group-card" *ngFor="let group of groups; let groupIndex = index">
      <header class="group-head">
        <div class="group-identity"><span class="group-number">{{ (groupIndex + 1).toString().padStart(2, '0') }}</span><div><p class="eyebrow">Sales group</p><h2>{{ group.name }}</h2><span class="leader-line">Group Leader: <b>{{ group.groupLeader || 'Not assigned' }}</b></span></div></div>
        <div class="group-actions"><span class="team-count">{{ group.teams.length }} teams · {{ groupMembers(group) }} members</span><button type="button" (click)="loadReport(group)">View Performance</button></div>
      </header>

      <form class="target-bar group-target" *ngIf="auth.hasRole('SuperAdmin')" (ngSubmit)="saveGroupTarget(group)">
        <div class="target-label"><span>Group target</span><small>Monthly combined objective</small></div>
        <label>Month<input type="month" name="gm{{group.id}}" [(ngModel)]="group.targetMonth"></label>
        <label>Sales units<input type="number" min="0" name="gu{{group.id}}" [(ngModel)]="group.unitTarget" placeholder="0"></label>
        <label>Collection target<input type="number" min="0" name="gc{{group.id}}" [(ngModel)]="group.collectionTarget" placeholder="0"></label>
        <button>Save Target</button>
      </form>

      <div class="teams-grid">
        <article class="team-card" *ngFor="let team of mainTeams(group)">
          <header class="team-head"><div><span class="level-badge">Main team</span><h3>{{ team.name }}</h3><p>{{ team.memberCount }} members</p></div><span class="leader-badge">{{ team.teamLeader || 'Leader not assigned' }}</span></header>

          <div class="team-controls" *ngIf="auth.hasPermission('users.manage')">
            <form (ngSubmit)="setLeader(team)"><label>Team leader<select name="leader{{team.id}}" [(ngModel)]="team.teamLeaderId"><option [ngValue]="null">Not assigned</option><option *ngFor="let member of team.members" [ngValue]="member.id">{{ member.fullName }}</option></select></label><button>Assign</button></form>
            <form (ngSubmit)="saveTeamTarget(team)"><label>Month<input type="month" name="tm{{team.id}}" [(ngModel)]="team.targetMonth"></label><label>Units<input type="number" min="0" name="tu{{team.id}}" [(ngModel)]="team.unitTarget" placeholder="0"></label><label>Collection<input type="number" min="0" name="tc{{team.id}}" [(ngModel)]="team.collectionTarget" placeholder="0"></label><button>Save</button></form>
          </div>

          <div class="member-section"><div class="section-title"><span>Team members</span><b>{{ team.members.length }}</b></div><div class="member-list"><div class="member" *ngFor="let member of team.members"><span class="avatar">{{ initials(member.fullName) }}</span><div><strong>{{ member.fullName }}</strong><small>{{ member.designation || 'Sales Executive' }}</small></div></div><p class="no-members" *ngIf="!team.members.length">No employees assigned to this team.</p></div></div>

          <section class="sub-team" *ngFor="let child of subTeams(group, team.id)">
            <header><div><span class="level-badge sub-level">Sub-team</span><h4>{{ child.name }}</h4><p>{{ child.memberCount }} members · Leader: <b>{{ child.teamLeader || 'Not assigned' }}</b></p></div></header>
            <div class="team-controls compact" *ngIf="auth.hasPermission('users.manage')"><form (ngSubmit)="setLeader(child)"><label>Leader<select name="leader{{child.id}}" [(ngModel)]="child.teamLeaderId"><option [ngValue]="null">Not assigned</option><option *ngFor="let member of child.members" [ngValue]="member.id">{{ member.fullName }}</option></select></label><button>Assign</button></form><form (ngSubmit)="saveTeamTarget(child)"><label>Month<input type="month" name="tm{{child.id}}" [(ngModel)]="child.targetMonth"></label><label>Units<input type="number" min="0" name="tu{{child.id}}" [(ngModel)]="child.unitTarget"></label><label>Collection<input type="number" min="0" name="tc{{child.id}}" [(ngModel)]="child.collectionTarget"></label><button>Save</button></form></div>
            <div class="member-list sub-members"><div class="member" *ngFor="let member of child.members"><span class="avatar small">{{ initials(member.fullName) }}</span><div><strong>{{ member.fullName }}</strong><small>{{ member.designation || 'Sales Executive' }}</small></div></div><p class="no-members" *ngIf="!child.members.length">No sub-team members.</p></div>
          </section>
        </article>
      </div>
    </section>

    <div class="modal" *ngIf="report" (click)="report=null">
      <article class="report-card" (click)="$event.stopPropagation()">
        <header><div><p class="eyebrow">Group performance</p><h2>{{ report.group.name }}</h2><span>{{ report.month | date:'MMMM yyyy' }}</span></div><button type="button" class="close-button" (click)="report=null">×</button></header>
        <section class="report-totals"><article><span>Sales units</span><strong>{{ report.totals.units }}</strong><small>Target {{ report.target?.unitTarget || 0 }}</small></article><article><span>Total collection</span><strong>{{ report.totals.collection | number:'1.2-2' }}</strong><small>Target {{ report.target?.collectionTarget || 0 | number:'1.2-2' }}</small></article></section>
        <div class="report-table"><table><thead><tr><th>Team / employee</th><th>Designation</th><th>Units</th><th>Collection</th></tr></thead><tbody><ng-container *ngFor="let team of report.teams"><tr class="team-row"><td colspan="4">{{ team.name }} · {{ team.leader || 'No leader' }}</td></tr><tr *ngFor="let member of team.members"><td>{{ member.fullName }}</td><td>{{ member.designation }}</td><td>{{ member.units }}</td><td>{{ member.collection | number:'1.2-2' }}</td></tr></ng-container></tbody></table></div>
      </article>
    </div>
  `,
  styleUrls: ['./sales-hierarchy.component.css']
})
export class SalesHierarchyComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);
  groups: any[] = [];
  users: any[] = [];
  report: any;
  error = '';
  message = '';
  month = new Date().toISOString().slice(0, 7);
  groupForm: any = { name: '', groupLeaderId: null };
  teamForm: any = { name: '', salesGroupId: null, parentTeamId: null, teamLeaderId: null };

  constructor() { this.load(); }
  get groupLeaders() { return this.users.filter(user => user.role === 'GroupLeader' && user.isActive); }
  get salesUsers() { return this.users.filter(user => user.role === 'SalesExecutive' && user.isActive); }
  get selectedGroup() { return this.groups.find(group => group.id === this.teamForm.salesGroupId); }
  get teamCount() { return this.groups.reduce((total, group) => total + group.teams.length, 0); }
  get leaderCount() { return this.groups.reduce((total, group) => total + group.teams.filter((team: any) => !!team.teamLeader).length, 0); }
  groupMembers(group: any) { return group.teams.reduce((total: number, team: any) => total + team.members.length, 0); }
  initials(name: string) { return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'SE'; }

  load() {
    forkJoin({ groups: this.api.salesHierarchy(), users: this.auth.hasPermission('users.manage') ? this.api.users() : of([]) }).subscribe({
      next: result => {
        this.groups = result.groups.map(group => ({ ...group, targetMonth: this.month, unitTarget: 0, collectionTarget: 0, teams: group.teams.map((team: any) => ({ ...team, targetMonth: this.month, unitTarget: 0, collectionTarget: 0 })) }));
        this.users = result.users;
        if (!this.teamForm.salesGroupId) this.teamForm.salesGroupId = this.groups[0]?.id ?? null;
      },
      error: error => this.error = error.error?.message || 'Could not load sales hierarchy.'
    });
  }
  createGroup() { this.clearAlerts(); this.api.createSalesGroup(this.groupForm).subscribe({ next: () => { this.message = 'Sales group created.'; this.groupForm = { name: '', groupLeaderId: null }; this.load(); }, error: error => this.error = error.error?.message || 'Could not create group.' }); }
  createTeam() { this.clearAlerts(); this.api.createSalesTeam(this.teamForm).subscribe({ next: () => { this.message = 'Team created.'; this.teamForm = { ...this.teamForm, name: '', parentTeamId: null, teamLeaderId: null }; this.load(); }, error: error => this.error = error.error?.message || 'Could not create team.' }); }
  saveGroupTarget(group: any) { this.clearAlerts(); this.api.saveSalesGroupTarget(group.id, { month: `${group.targetMonth}-01`, unitTarget: group.unitTarget, collectionTarget: group.collectionTarget }).subscribe({ next: () => this.message = 'Group target saved.', error: error => this.error = error.error?.message || 'Could not save target.' }); }
  saveTeamTarget(team: any) { this.clearAlerts(); this.api.saveSalesTeamTarget(team.id, { month: `${team.targetMonth}-01`, unitTarget: team.unitTarget, collectionTarget: team.collectionTarget }).subscribe({ next: () => this.message = 'Team target saved.', error: error => this.error = error.error?.message || 'Could not save target.' }); }
  setLeader(team: any) { this.clearAlerts(); this.api.setSalesTeamLeader(team.id, team.teamLeaderId).subscribe({ next: () => { this.message = 'Team leader assigned.'; this.load(); }, error: error => this.error = error.error?.message || 'Could not assign team leader.' }); }
  loadReport(group: any) { this.clearAlerts(); this.api.salesGroupReport(group.id, `${this.month}-01`).subscribe({ next: result => this.report = result, error: error => this.error = error.error?.message || 'Could not load group report.' }); }
  mainTeams(group: any) { return group.teams.filter((team: any) => !team.parentTeamId); }
  subTeams(group: any, id: number) { return group.teams.filter((team: any) => team.parentTeamId === id); }
  private clearAlerts() { this.error = ''; this.message = ''; }
}
