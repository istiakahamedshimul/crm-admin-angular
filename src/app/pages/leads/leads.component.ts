import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { VoiceService } from '../../core/voice.service';
import { Lead, LeadAutomationSettings, ReturnedLead, SalesExecutive } from '../../models/crm.models';
import { label, leadSource, leadStatus, projectType } from '../../shared/format';

type DirectoryTab = 'all' | 'assigned' | 'unassigned' | 'returned';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Sales pipeline</p><h1>Lead Directory</h1><p class="page-copy">Search, filter, assign and review every lead from one workspace.</p></div>
      <div class="page-actions"><a routerLink="/leads/import" class="secondary-action">Import Leads</a><a routerLink="/leads/new" class="primary-action">＋ Add Lead</a></div>
    </section>

    <section class="summary-grid"><article><span>Total leads</span><strong>{{ leads.length }}</strong><small>Full pipeline</small></article><article><span>Assigned</span><strong class="green">{{ assignedCount }}</strong><small>With an employee</small></article><article><span>Unassigned</span><strong class="orange">{{ unassignedCount }}</strong><small>Require assignment</small></article><article><span>Returned</span><strong>{{ returnedLeads.length }}</strong><small>Automation history</small></article></section>

    <details class="automation-card">
      <summary><div><strong>Assigned lead automation</strong><span>Automatic warnings and return-to-unassigned timing</span></div><span class="configure">Configure</span></summary>
      <form (ngSubmit)="saveAutomationSettings()"><label>Return after (hours)<input type="number" name="unassignAfterHours" min="0.0167" max="720" step="any" required [(ngModel)]="automationSettings.unassignAfterHours"></label><label>Warning interval (hours)<input type="number" name="reminderIntervalHours" min="0.0167" max="168" step="any" required [(ngModel)]="automationSettings.reminderIntervalHours"></label><button [disabled]="savingAutomation">{{ savingAutomation ? 'Saving…' : 'Save Configuration' }}</button><span class="success" *ngIf="automationMessage">{{ automationMessage }}</span><span class="error" *ngIf="automationError">{{ automationError }}</span></form>
    </details>

    <section class="directory-card">
      <header class="directory-toolbar">
        <div class="tabs"><button type="button" [class.active]="tab==='all'" (click)="tab='all'">All <b>{{ leads.length }}</b></button><button type="button" [class.active]="tab==='assigned'" (click)="tab='assigned'">Assigned <b>{{ assignedCount }}</b></button><button type="button" [class.active]="tab==='unassigned'" (click)="tab='unassigned'">Unassigned <b>{{ unassignedCount }}</b></button><button type="button" [class.active]="tab==='returned'" (click)="tab='returned'">Returned <b>{{ returnedLeads.length }}</b></button></div>
        <div class="filters"><input type="search" [(ngModel)]="search" placeholder="Search name, phone, project or employee"><select [(ngModel)]="assignee" *ngIf="tab!=='returned'"><option value="">All employees</option><option *ngFor="let employee of assignees" [value]="employee">{{ employee }}</option></select><select [(ngModel)]="status" *ngIf="tab!=='returned'"><option value="">All statuses</option><option *ngFor="let option of statusOptions" [value]="option.value">{{ option.label }}</option></select><select [(ngModel)]="selectedProjectType" *ngIf="tab!=='returned'"><option [ngValue]="null">All property types</option><option *ngFor="let option of propertyTypeOptions" [ngValue]="option.value">{{ option.label }}</option></select><button type="button" class="refresh" (click)="load()">Refresh</button></div>
      </header>

      <div class="table-scroll" *ngIf="tab!=='returned'">
        <table><thead><tr><th>Lead</th><th>Project</th><th>Source</th><th>Assigned employee</th><th>Status</th><th>Next follow-up</th><th>Created</th><th></th></tr></thead><tbody>
          <tr *ngFor="let lead of filteredLeads" (click)="openLead(lead)"><td><strong class="lead-name">{{ lead.customerName }}</strong><small>{{ lead.phone }}<span *ngIf="lead.email"> · {{ lead.email }}</span></small></td><td><strong>{{ lead.projectName || 'No project' }}</strong><small>{{ typeLabel(lead.projectType) }}</small></td><td><span class="source">{{ sourceLabel(lead.source) }}</span></td><td><span class="assignee" [class.unassigned]="!lead.assignedToName">{{ lead.assignedToName || 'Unassigned' }}</span></td><td><span class="lead-status" [attr.data-status]="lead.status">{{ statusLabel(lead.status) }}</span></td><td>{{ lead.nextFollowUpAt ? (lead.nextFollowUpAt | date:'MMM d, y, h:mm a') : 'Not scheduled' }}</td><td>{{ lead.createdAt | date:'MMM d, y' }}</td><td><div class="row-actions"><ng-container *ngIf="!lead.assignedToId"><select (click)="$event.stopPropagation()" [(ngModel)]="quickAssignee[lead.id]"><option [ngValue]="null">Select employee</option><option *ngFor="let employee of salesExecutives" [ngValue]="employee.id">{{ employee.fullName }}</option></select><button type="button" (click)="$event.stopPropagation(); quickAssign(lead)" [disabled]="!quickAssignee[lead.id]">Assign</button></ng-container><button type="button" class="view" (click)="$event.stopPropagation(); openLead(lead)">View →</button></div></td></tr>
          <tr *ngIf="!filteredLeads.length"><td colspan="8" class="empty">No leads match the selected filters.</td></tr>
        </tbody></table>
      </div>

      <div class="table-scroll" *ngIf="tab==='returned'">
        <table><thead><tr><th>Lead</th><th>Returned from</th><th>Assigned</th><th>Returned</th><th>Warnings</th><th>Current status</th><th>Current owner</th><th></th></tr></thead><tbody><tr *ngFor="let item of filteredReturned"><td><strong class="lead-name">{{ item.customerName }}</strong><small>{{ item.phone }}</small></td><td>{{ item.salesExecutive }}</td><td>{{ item.assignedAt | date:'MMM d, y, h:mm a' }}</td><td>{{ item.returnedAt | date:'MMM d, y, h:mm a' }}</td><td><span class="warning-count">{{ item.notificationCount }}</span></td><td><span class="lead-status">{{ statusLabel(item.currentStatus) }}</span></td><td>{{ item.currentAssignedTo || 'Unassigned' }}</td><td><button class="view" type="button" (click)="openReturned(item)">View →</button></td></tr><tr *ngIf="!filteredReturned.length"><td colspan="8" class="empty">No returned leads match your search.</td></tr></tbody></table>
      </div>
    </section>
    <p class="error page-error" *ngIf="error">{{ error }}</p>
  `,
  styleUrls: ['./leads.component.css']
})
export class LeadsComponent implements OnInit {
  private api = inject(ApiService); private router = inject(Router); private voiceService = inject(VoiceService);
  leads: Lead[] = []; returnedLeads: ReturnedLead[] = []; salesExecutives: SalesExecutive[] = [];
  tab: DirectoryTab = 'all'; search = ''; assignee = ''; status = ''; selectedProjectType: number | null = null; error = '';
  quickAssignee: Record<number, number | null> = {};
  automationSettings: LeadAutomationSettings = { unassignAfterHours: 24, reminderIntervalHours: 1 };
  automationMessage = ''; automationError = ''; savingAutomation = false;
  readonly statusOptions = leadStatus.map((name, value) => ({ label: name, value }));
  readonly propertyTypeOptions = projectType.map((name, value) => ({ label: name, value }));
  get assignedCount() { return this.leads.filter(lead => !!lead.assignedToId).length; }
  get unassignedCount() { return this.leads.length - this.assignedCount; }
  get assignees() { return [...new Set(this.leads.map(lead => lead.assignedToName).filter((name): name is string => !!name))].sort(); }
  get filteredLeads() {
    const term = this.search.trim().toLowerCase();
    return this.leads.filter(lead => this.tab === 'all' || (this.tab === 'assigned' ? !!lead.assignedToId : !lead.assignedToId)).filter(lead => !this.assignee || lead.assignedToName === this.assignee).filter(lead => this.status === '' || lead.status === Number(this.status)).filter(lead => this.selectedProjectType === null || lead.projectType === this.selectedProjectType).filter(lead => !term || [lead.customerName, lead.phone, lead.email, lead.projectName, lead.assignedToName].some(value => value?.toLowerCase().includes(term))).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
  get filteredReturned() { const term = this.search.trim().toLowerCase(); return this.returnedLeads.filter(item => !term || [item.customerName,item.phone,item.salesExecutive,item.currentAssignedTo].some(value => value?.toLowerCase().includes(term))).sort((a,b)=>b.returnedAt.localeCompare(a.returnedAt)); }
  ngOnInit() { this.voiceService.leadExecutive$.subscribe(name => { if(name){this.search=name;this.voiceService.leadExecutiveSubject.next(null);} }); this.load(); this.api.leadAutomationSettings().subscribe(data=>this.automationSettings=data); }
  load() { forkJoin({leads:this.api.leads(),returned:this.api.returnedLeads(),employees:this.api.salesExecutives()}).subscribe({next:data=>{this.leads=data.leads;this.returnedLeads=data.returned;this.salesExecutives=data.employees;},error:error=>this.error=error.error?.message||'Could not load lead directory.'}); }
  quickAssign(lead:Lead){const assignedToId=this.quickAssignee[lead.id];if(!assignedToId)return;this.api.updateLead(lead.id,{assignedToId,status:1}).subscribe({next:()=>{delete this.quickAssignee[lead.id];this.load();},error:error=>this.error=error.error?.message||'Could not assign lead.'});}
  saveAutomationSettings(){this.savingAutomation=true;this.automationMessage='';this.automationError='';this.api.updateLeadAutomationSettings(this.automationSettings).subscribe({next:data=>{this.automationSettings=data;this.automationMessage='Configuration saved.';this.savingAutomation=false;},error:error=>{this.automationError=error.error?.message||'Could not save configuration.';this.savingAutomation=false;}});}
  openLead(lead:Lead){void this.router.navigate(['/leads',lead.id]);} openReturned(item:ReturnedLead){void this.router.navigate(['/leads',item.leadId]);}
  statusLabel(value:number){return label(leadStatus,value);} typeLabel(value?:number){return value===null||value===undefined?'General':label(projectType,value);} sourceLabel(value:number){return value===12?'Self':value===5?'Referral':label(leadSource,value)||'Company';}
}
