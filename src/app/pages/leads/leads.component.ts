import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { VoiceService } from '../../core/voice.service';
import { AvailableLeadCustomer, CreateLeadRequest, Lead, LeadAutomationSettings, Project, ReturnedLead, SalesExecutive } from '../../models/crm.models';
import { label, leadSource, leadStatus, projectType } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Pipeline</p>
        <h1>Lead Management</h1>
        <p class="page-copy">Manage manually created leads, bulk import prospects, and assign tasks to sales executives.</p>
      </div>
    </section>

    <section class="panel" style="padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;">
        <div>
          <h2 style="margin:0 0 6px;">Assigned lead automation</h2>
          <p class="page-copy" style="margin:0;">Warn employees at the selected interval. Leads still in Assigned state with no follow-up return to Unassigned automatically.</p>
        </div>
        <form (ngSubmit)="saveAutomationSettings()" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
          <label>Return to unassigned after (hours)
            <input type="number" name="unassignAfterHours" min="0.0167" max="720" step="any" required [(ngModel)]="automationSettings.unassignAfterHours">
          </label>
          <label>Warning interval (hours)
            <input type="number" name="reminderIntervalHours" min="0.0167" max="168" step="any" required [(ngModel)]="automationSettings.reminderIntervalHours">
          </label>
          <button type="submit" [disabled]="savingAutomation">Save configuration</button>
        </form>
      </div>
      <p class="success" *ngIf="automationMessage" style="margin:12px 0 0;">{{ automationMessage }}</p>
      <p class="error" *ngIf="automationError" style="margin:12px 0 0;">{{ automationError }}</p>
    </section>

    <!-- Refined Metrics Bar -->
    <section class="metric-grid">
      <article class="metric-card">
        <div class="metric-icon-wrap" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
          <span class="metric-icon-letter">📊</span>
        </div>
        <div class="metric-body">
          <span>Total Pipeline Leads</span>
          <strong>{{ totalLeads }}</strong>
        </div>
      </article>

      <article class="metric-card">
        <div class="metric-icon-wrap" style="background: linear-gradient(135deg, #10b981, #047857);">
          <span class="metric-icon-letter">👤</span>
        </div>
        <div class="metric-body">
          <span>Assigned Leads</span>
          <strong>{{ assignedLeads }}</strong>
        </div>
      </article>

      <article class="metric-card">
        <div class="metric-icon-wrap" style="background: linear-gradient(135deg, #f59e0b, #b45309);">
          <span class="metric-icon-letter">⏳</span>
        </div>
        <div class="metric-body">
          <span>Pending Actions</span>
          <strong>{{ pendingLeads }}</strong>
        </div>
      </article>
    </section>

    <section class="form-grid">
      <!-- Consolidated Creation & Ingestion Panel -->
      <div class="panel" style="padding: 24px; display: flex; flex-direction: column;">
        <!-- Clean Tabbed Switcher -->
        <div style="display: flex; gap: 8px; margin-bottom: 24px; padding: 4px; background: var(--panel-soft); border-radius: 8px; border: 1px solid var(--line);">
          <button type="button" 
                  style="flex: 1; min-height: 36px; padding: 0 12px; border-radius: 6px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s;"
                  [style.background]="activeTab === 'create' ? '#ffffff' : 'transparent'"
                  [style.color]="activeTab === 'create' ? 'var(--text-dark)' : 'var(--muted)'"
                  [style.box-shadow]="activeTab === 'create' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'"
                  (click)="activeTab = 'create'">
            ✍️ Single Entry
          </button>
          <button type="button" 
                  style="flex: 1; min-height: 36px; padding: 0 12px; border-radius: 6px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s;"
                  [style.background]="activeTab === 'import' ? '#ffffff' : 'transparent'"
                  [style.color]="activeTab === 'import' ? 'var(--text-dark)' : 'var(--muted)'"
                  [style.box-shadow]="activeTab === 'import' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'"
                  (click)="activeTab = 'import'">
            📤 Bulk Import
          </button>
        </div>

        <!-- Tab 1: Single Entry -->
        <div *ngIf="activeTab === 'create'">
          <form class="form-panel" (ngSubmit)="create()" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <h2 style="font-size: 16px; margin: 0 0 6px; display: flex; align-items: center; gap: 6px;">Create & Assign Lead</h2>
              <p style="color: var(--muted); font-size: 12px; margin: 0 0 12px;">Create a new prospect manually and assign to a sales executive.</p>
            </div>

            <label>Select customer (Optional)
              <select name="selectedCustomerId" [(ngModel)]="selectedCustomerId" (change)="selectCustomer(selectedCustomerId)">
                <option [ngValue]="null">-- New Customer --</option>
                <option *ngFor="let c of availableCustomers" [ngValue]="c.id">{{ c.name }} ({{ c.phone }})</option>
              </select>
            </label>

            <label>Lead name <span style="color:var(--danger)">*</span>
              <input name="customerName" [(ngModel)]="form.customerName" required placeholder="e.g. Istiak Ahamed">
            </label>

            <label>Phone <span style="color:var(--danger)">*</span>
              <input name="phone" [(ngModel)]="form.phone" required placeholder="e.g. 01712345678">
            </label>

            <label>Email (optional)
              <input name="email" type="email" [(ngModel)]="form.email" placeholder="e.g. user@domain.com">
            </label>

            <label>Preferred location
              <input name="preferredLocation" [(ngModel)]="form.preferredLocation" placeholder="e.g. Gulshan, Dhaka">
            </label>

            <label>Project (optional)
              <select name="projectId" [(ngModel)]="form.projectId">
                <option [ngValue]="null">None</option>
                <option *ngFor="let project of projects" [ngValue]="project.id">{{ project.name }}</option>
              </select>
            </label>

            <label>Assign sales executive <span style="color:var(--danger)">*</span>
              <select name="assignedToId" [(ngModel)]="form.assignedToId" required>
                <option [ngValue]="null">Select executive</option>
                <option *ngFor="let sales of salesExecutives" [ngValue]="sales.id">{{ sales.fullName }}</option>
              </select>
            </label>

            <button type="submit" style="margin-top: 8px;">Create Lead</button>
            <p class="error" *ngIf="error" style="margin-top: 8px;">⚠️ {{ error }}</p>
          </form>
        </div>

        <!-- Tab 2: Bulk Import -->
        <div *ngIf="activeTab === 'import'">
          <form class="form-panel" (ngSubmit)="importLeads()" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <h2 style="font-size: 16px; margin: 0 0 6px; display: flex; align-items: center; gap: 6px;">Import Leads</h2>
              <p style="color: var(--muted); font-size: 12px; margin: 0 0 12px;">Upload CSV or Excel sheets containing your lead records.</p>
            </div>
            
            <input type="file" #fileInput accept=".csv,.xls,.xlsx" (change)="chooseImportFile($event)" style="display: none;">
            
            <div (click)="fileInput.click()" 
                 style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 32px 16px; text-align: center; cursor: pointer; background: #fafafb; transition: all 0.2s ease-in-out;"
                 onmouseover="this.style.borderColor='var(--brand)'; this.style.background='#f0fdfa';"
                 onmouseout="this.style.borderColor='#cbd5e1'; this.style.background='#fafafb';">
              <span style="font-size: 32px; display: block; margin-bottom: 8px;">📁</span>
              <strong style="display: block; font-size: 13px; color: var(--text-dark);" *ngIf="!importFile">Click to browse file</strong>
              <strong style="display: block; font-size: 13px; color: var(--brand-dark);" *ngIf="importFile">{{ importFile.name }}</strong>
              <span style="font-size: 11px; color: var(--muted); display: block; margin-top: 4px;">
                {{ importFile ? ((importFile.size / 1024) | number:'1.0-1') + ' KB - Click to replace' : 'CSV, XLS, or XLSX sheets up to 10MB' }}
              </span>
            </div>

            <div *ngIf="importFile" style="display: flex; justify-content: flex-end; margin-top: -8px;">
              <button type="button" class="ghost-button" (click)="clearImportFile()" style="min-height: 28px; padding: 0 10px; font-size: 11px; border-radius: 4px; gap: 4px; box-shadow: none;">
                ❌ Clear File
              </button>
            </div>

            <div style="background: #f0fdfa; border: 1px solid #ccfbf1; padding: 12px; border-radius: 8px; font-size: 12px; color: #0d9488; line-height: 1.5;">
              💡 <strong>Requirements:</strong> Name and Phone are mandatory. The property type is resolved automatically based on the project selected.
            </div>

            <label style="display: flex; gap: 8px; align-items: center; cursor: pointer; user-select: none; margin-top: 4px;">
              <input type="checkbox" name="autoAssign" [(ngModel)]="autoAssign" style="width: auto; min-height: auto; cursor: pointer;"> 
              <span style="font-size: 12px; font-weight: 500;">Auto-assign equally among active sales employees</span>
            </label>

            <button type="submit" [disabled]="!importFile" style="margin-top: 8px;">Import Leads</button>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line);">
              <a [href]="templateUrl" target="_blank" style="font-size: 12px; font-weight: 600; color: var(--brand); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                ⬇️ Download demo template
              </a>
            </div>

            <p class="success" *ngIf="importMessage" style="margin-top: 8px;">ℹ️ {{ importMessage }}</p>
          </form>
        </div>
      </div>

      <!-- Right Panel: Leads Directory -->
      <article class="panel" style="padding: 24px;">
        <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="margin: 0; display: flex; align-items: center; gap: 8px;">Lead Directory</h2>
              <p style="color: var(--muted); font-size: 13px; margin: 4px 0 0;">Review lead status, project options, and executive performance.</p>
            </div>
          </div>

          <div style="display:flex;gap:8px;border-bottom:1px solid var(--line);padding-bottom:10px;">
            <button type="button" class="ghost-button" [class.active]="directoryTab === 'assigned'" (click)="directoryTab='assigned'">
              Assigned ({{ assignedLeads }})
            </button>
            <button type="button" class="ghost-button" [class.active]="directoryTab === 'unassigned'" (click)="directoryTab='unassigned'">
              Unassigned ({{ unassignedLeads }})
            </button>
            <button type="button" class="ghost-button" [class.active]="directoryTab === 'returned'" (click)="directoryTab='returned'">
              Returned history ({{ returnedLeads.length }})
            </button>
          </div>

          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; width: 100%;">
            <!-- Search Input -->
            <div style="position: relative; flex: 1; min-width: 220px;">
              <input type="text" 
                     [(ngModel)]="searchTerm" 
                     placeholder="🔍 Search name, phone, project or executive..." 
                     style="min-height: 40px; font-size: 13px;">
            </div>
            
            <!-- Category Filter -->
            <div style="min-width: 200px;">
              <select [(ngModel)]="selectedProjectType" style="min-height: 40px; font-size: 13px; cursor: pointer;">
                <option [ngValue]="null">All property types</option>
                <option *ngFor="let type of propertyTypeOptions" [ngValue]="type.value">{{ type.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Refined Leads Card Grid -->
        <div *ngIf="directoryTab !== 'returned'" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          <div *ngFor="let lead of filteredLeads" 
               style="background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; transition: all 0.2s ease-in-out;"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-hover)'; this.style.borderColor='var(--brand)';"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow)'; this.style.borderColor='var(--line)';">
            
            <!-- Left color strip by status -->
            <div [style.background]="lead.status === 0 ? 'var(--warning)' : 'var(--success)'" 
                 style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px;"></div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-left: 4px;">
              <div style="min-width: 0; flex: 1; padding-right: 8px;">
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" [title]="lead.customerName">
                  {{ lead.customerName }}
                </h3>
                <span style="font-size: 12px; color: var(--muted); display: block; margin-top: 4px;">
                  📞 {{ lead.phone }}
                </span>
                <span *ngIf="lead.email" style="font-size: 12px; color: var(--muted); display: block; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" [title]="lead.email">
                  📧 {{ lead.email }}
                </span>
              </div>
              <span class="badge" style="flex-shrink: 0; font-size: 11px;">
                {{ lead.projectType === null || lead.projectType === undefined ? 'General' : label(projectType, lead.projectType) }}
              </span>
            </div>
            
            <div style="border-top: 1px solid var(--panel-soft); border-bottom: 1px solid var(--panel-soft); padding: 12px 0 12px 4px; font-size: 13px; display: flex; flex-direction: column; gap: 8px; color: #475569;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px;">🏢</span>
                <span style="color: var(--muted); font-size: 12px;">Project:</span>
                <strong style="color: var(--text-dark); margin-left: auto;">{{ lead.projectName || 'None' }}</strong>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px;">👤</span>
                <span style="color: var(--muted); font-size: 12px;">Executive:</span>
                <strong style="color: var(--text-dark); margin-left: auto;">{{ lead.assignedToName || 'Unassigned' }}</strong>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="color:var(--muted);font-size:12px">Source:</span>
                <strong style="margin-left:auto">{{ sourceLabel(lead.source) }}</strong>
              </div>
              <div *ngIf="lead.source === 5 && lead.referrerName" style="font-size:11px;color:var(--muted);text-align:right">
                Referred by {{ lead.referrerName }} · {{ lead.referrerPhone }}<span *ngIf="lead.referrerEmail"> · {{ lead.referrerEmail }}</span>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding-left: 4px; font-size: 12px;">
              <span style="color: var(--muted);">Status:</span>
              <span class="status-pill" [class.pending]="lead.status === 0" [class.approved]="lead.status === 1">
                {{ label(leadStatus, lead.status) }}
              </span>
            </div>

            <div *ngIf="directoryTab === 'unassigned'" style="display:flex;gap:8px;align-items:flex-end;border-top:1px solid var(--line);padding-top:12px">
              <label style="flex:1;margin:0;font-size:11px">Quick assign
                <select [(ngModel)]="quickAssignee[lead.id]" style="min-height:36px;font-size:12px">
                  <option [ngValue]="null">Select salesperson</option>
                  <option *ngFor="let sales of salesExecutives" [ngValue]="sales.id">{{ sales.fullName }}</option>
                </select>
              </label>
              <button type="button" (click)="quickAssign(lead)" [disabled]="!quickAssignee[lead.id]"
                style="min-height:36px;padding:0 12px">Assign</button>
              <button type="button" class="ghost-button" (click)="openLeadEditor(lead)"
                style="min-height:36px;padding:0 12px">Edit</button>
            </div>
            <button *ngIf="directoryTab === 'assigned'" type="button" class="ghost-button" (click)="openLeadEditor(lead)">View / Edit lead profile</button>
          </div>
        </div>
        
        <div *ngIf="directoryTab !== 'returned' && filteredLeads.length === 0" class="empty-card" style="margin-top: 20px;">
          No leads found matching current filters.
        </div>

        <div *ngIf="directoryTab === 'returned'" style="overflow:auto;">
          <table style="width:100%;border-collapse:collapse;min-width:900px;">
            <thead>
              <tr>
                <th style="text-align:left;padding:12px;border-bottom:1px solid var(--line)">Lead</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid var(--line)">Returned from</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid var(--line)">Assigned time</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid var(--line)">Returned time</th>
                <th style="text-align:center;padding:12px;border-bottom:1px solid var(--line)">Warnings</th>
                <th style="text-align:left;padding:12px;border-bottom:1px solid var(--line)">Current status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredReturnedLeads">
                <td style="padding:12px;border-bottom:1px solid var(--line)">
                  <strong>{{ item.customerName }}</strong>
                  <small style="display:block;color:var(--muted)">{{ item.phone }}</small>
                </td>
                <td style="padding:12px;border-bottom:1px solid var(--line)">{{ item.salesExecutive }}</td>
                <td style="padding:12px;border-bottom:1px solid var(--line)">{{ item.assignedAt | date:'medium' }}</td>
                <td style="padding:12px;border-bottom:1px solid var(--line)">{{ item.returnedAt | date:'medium' }}</td>
                <td style="padding:12px;text-align:center;border-bottom:1px solid var(--line)">{{ item.notificationCount }}</td>
                <td style="padding:12px;border-bottom:1px solid var(--line)">
                  <span class="status-pill">{{ label(leadStatus, item.currentStatus) }}</span>
                  <small *ngIf="item.currentAssignedTo" style="display:block;color:var(--muted);margin-top:4px">
                    Now assigned to {{ item.currentAssignedTo }}
                  </small>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="filteredReturnedLeads.length === 0" class="empty-card" style="margin-top:20px">
            No returned leads found.
          </div>
        </div>
      </article>
    </section>

    <div *ngIf="editingLead" (click)="closeLeadEditor()"
      style="position:fixed;inset:0;background:rgba(15,23,42,.62);z-index:1100;overflow:auto;padding:24px">
      <form (click)="$event.stopPropagation()" (ngSubmit)="saveLeadEditor()"
        style="width:min(760px,100%);margin:auto;background:white;border-radius:18px;padding:24px;box-shadow:0 30px 70px rgba(15,23,42,.3)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px">
          <div>
            <p class="eyebrow">Full lead editor</p>
            <h2 style="margin:0">Edit {{ editingLead.customerName }}</h2>
          </div>
          <button type="button" class="ghost-button" (click)="closeLeadEditor()">Close</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px">
          <label>Lead name<input name="editCustomerName" [(ngModel)]="editLeadForm.customerName" required></label>
          <label>Phone<input name="editPhone" [(ngModel)]="editLeadForm.phone" required></label>
          <label>Alternative phone<input name="editAlternativePhone" [(ngModel)]="editLeadForm.alternativePhone"></label>
          <label>Email<input name="editEmail" type="email" [(ngModel)]="editLeadForm.email"></label>
          <label>Address<input name="editAddress" [(ngModel)]="editLeadForm.address"></label>
          <label>Preferred location<input name="editPreferredLocation" [(ngModel)]="editLeadForm.preferredLocation"></label>
          <label>Budget range<input name="editBudgetRange" [(ngModel)]="editLeadForm.budgetRange"></label>
          <label>Project
            <select name="editProjectId" [(ngModel)]="editLeadForm.projectId">
              <option [ngValue]="null">None</option>
              <option *ngFor="let project of projects" [ngValue]="project.id">{{ project.name }}</option>
            </select>
          </label>
          <label>Sales executive
            <select name="editAssignedToId" [(ngModel)]="editLeadForm.assignedToId">
              <option [ngValue]="null">Keep unassigned</option>
              <option *ngFor="let sales of salesExecutives" [ngValue]="sales.id">{{ sales.fullName }}</option>
            </select>
          </label>
          <label>Status
            <select name="editStatus" [(ngModel)]="editLeadForm.status">
              <option *ngFor="let option of leadStatusOptions" [ngValue]="option.value">{{ option.label }}</option>
            </select>
          </label>
          <label>Lead source
            <select name="editSource" [(ngModel)]="editLeadForm.source">
              <option [ngValue]="11">Company</option><option [ngValue]="12">Self</option><option [ngValue]="5">Referral</option>
            </select>
          </label>
          <ng-container *ngIf="editLeadForm.source === 5">
            <label>Referrer name<input name="editReferrerName" [(ngModel)]="editLeadForm.referrerName"></label>
            <label>Referrer phone<input name="editReferrerPhone" [(ngModel)]="editLeadForm.referrerPhone"></label>
            <label>Referrer email<input name="editReferrerEmail" type="email" [(ngModel)]="editLeadForm.referrerEmail"></label>
          </ng-container>
          <label style="grid-column:1/-1">Remarks
            <textarea name="editRemarks" rows="4" [(ngModel)]="editLeadForm.remarks"></textarea>
          </label>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px">
          <button type="button" class="ghost-button" (click)="closeLeadEditor()">Cancel</button>
          <button type="submit" [disabled]="savingLead">{{ savingLead ? 'Saving...' : 'Save lead' }}</button>
        </div>
        <p class="error" *ngIf="leadEditorError" style="margin-top:12px">{{ leadEditorError }}</p>
      </form>
    </div>
  `
})
export class LeadsComponent implements OnInit {
  private api = inject(ApiService);
  private voiceService = inject(VoiceService);
  leads: Lead[] = [];
  returnedLeads: ReturnedLead[] = [];
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
  leadStatusOptions = leadStatus.map((status, value) => ({ value, label: status }));
  quickAssignee: Record<number, number | null> = {};
  editingLead: Lead | null = null;
  editLeadForm: any = {};
  savingLead = false;
  leadEditorError = '';

  // Tab State
  activeTab: 'create' | 'import' = 'create';
  directoryTab: 'assigned' | 'unassigned' | 'returned' = 'assigned';
  automationSettings: LeadAutomationSettings = { unassignAfterHours: 24, reminderIntervalHours: 1 };
  automationMessage = '';
  automationError = '';
  savingAutomation = false;
  searchTerm = '';
  selectedCustomerId: number | null = null;

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
    source: leadSource.indexOf('Company'),
    assignedToId: null,
    remarks: null
  };

  get totalLeads() {
    return this.leads.length;
  }

  get assignedLeads() {
    return this.leads.filter(lead => lead.assignedToId !== null && lead.assignedToId !== undefined).length;
  }

  get pendingLeads() {
    return this.leads.filter(lead => lead.status === 0).length;
  }

  get unassignedLeads() {
    return this.leads.filter(lead => lead.assignedToId === null || lead.assignedToId === undefined).length;
  }

  get filteredLeads() {
    if (this.directoryTab === 'returned') return [];
    let result = this.leads.filter(lead => this.directoryTab === 'assigned'
      ? lead.assignedToId !== null && lead.assignedToId !== undefined
      : lead.assignedToId === null || lead.assignedToId === undefined);
    if (this.selectedProjectType !== null) {
      result = result.filter(lead => lead.projectType === this.selectedProjectType);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(lead =>
        lead.customerName.toLowerCase().includes(term) ||
        lead.phone.includes(term) ||
        (lead.projectName && lead.projectName.toLowerCase().includes(term)) ||
        (lead.assignedToName && lead.assignedToName.toLowerCase().includes(term))
      );
    }
    return result;
  }

  get filteredReturnedLeads() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.returnedLeads;
    return this.returnedLeads.filter(item =>
      item.customerName.toLowerCase().includes(term) ||
      item.phone.includes(term) ||
      item.salesExecutive.toLowerCase().includes(term));
  }

  ngOnInit() {
    this.voiceService.leadExecutive$.subscribe(name => {
      if (!name) return;
      this.searchTerm = name;
      this.voiceService.leadExecutiveSubject.next(null);
    });
    this.load();
    this.loadReturnedLeads();
    this.api.leadAutomationSettings().subscribe(data => this.automationSettings = data);
    this.api.salesExecutives().subscribe(data => this.salesExecutives = data);
    this.api.projects().subscribe(data => this.projects = data);
    this.loadAvailableCustomers();
    this.templateUrl = this.api.leadImportTemplateUrl();
  }

  loadReturnedLeads() {
    this.api.returnedLeads().subscribe(data => this.returnedLeads = data);
  }

  quickAssign(lead: Lead) {
    const assignedToId = this.quickAssignee[lead.id];
    if (!assignedToId) return;
    this.api.updateLead(lead.id, { assignedToId, status: 1 }).subscribe({
      next: () => {
        delete this.quickAssignee[lead.id];
        this.load();
      },
      error: err => this.error = err.error?.message || 'Could not assign lead.'
    });
  }

  openLeadEditor(lead: Lead) {
    this.editingLead = lead;
    this.leadEditorError = '';
    this.editLeadForm = {
      customerName: lead.customerName,
      phone: lead.phone,
      alternativePhone: lead.alternativePhone ?? null,
      email: lead.email ?? null,
      address: lead.address ?? null,
      preferredLocation: lead.preferredLocation ?? null,
      budgetRange: lead.budgetRange ?? null,
      projectId: lead.projectId ?? null,
      assignedToId: lead.assignedToId ?? null,
      status: lead.status,
      source: lead.source,
      referrerName: lead.referrerName ?? null,
      referrerPhone: lead.referrerPhone ?? null,
      referrerEmail: lead.referrerEmail ?? null,
      remarks: lead.remarks ?? null
    };
  }

  closeLeadEditor() {
    if (!this.savingLead) this.editingLead = null;
  }

  saveLeadEditor() {
    if (!this.editingLead) return;
    if (this.editLeadForm.assignedToId && this.editLeadForm.status === 0)
      this.editLeadForm.status = 1;
    this.savingLead = true;
    this.leadEditorError = '';
    this.api.updateLead(this.editingLead.id, this.editLeadForm).subscribe({
      next: () => {
        this.savingLead = false;
        this.editingLead = null;
        this.load();
      },
      error: err => {
        this.savingLead = false;
        this.leadEditorError = err.error?.message || 'Could not update lead.';
      }
    });
  }

  saveAutomationSettings() {
    this.savingAutomation = true;
    this.automationMessage = '';
    this.automationError = '';
    this.api.updateLeadAutomationSettings(this.automationSettings).subscribe({
      next: data => {
        this.automationSettings = data;
        this.automationMessage = 'Lead automation configuration saved.';
        this.savingAutomation = false;
      },
      error: err => {
        this.automationError = err.error?.message || 'Could not save lead automation configuration.';
        this.savingAutomation = false;
      }
    });
  }

  chooseImportFile(event: Event) {
    this.importFile = (event.target as HTMLInputElement).files?.[0];
  }

  clearImportFile() {
    this.importFile = undefined;
    this.importMessage = '';
  }

  importLeads() {
    if (!this.importFile) return;
    this.importMessage = '';
    this.api.importLeads(this.importFile, this.autoAssign).subscribe({
      next: result => {
        this.importMessage = `${result.imported} leads imported; ${result.skipped.length} skipped.`;
        this.load();
        this.clearImportFile();
      },
      error: err => this.importMessage = err.error?.message || 'Import failed.'
    });
  }

  loadAvailableCustomers() {
    this.api.customersAvailableForLead().subscribe(data => this.availableCustomers = data);
  }

  selectCustomer(customerId: number | null) {
    const customer = this.availableCustomers.find(x => x.id === customerId);
    this.form.customerId = customerId;
    this.form.customerName = customer?.name ?? '';
    this.form.phone = customer?.phone ?? '';
    this.form.alternativePhone = customer?.alternativePhone ?? null;
    this.form.email = customer?.email ?? null;
    this.form.address = customer?.address ?? null;
    this.form.projectId = null;
    this.form.assignedToId = customer?.assignedToId ?? null;
  }

  sourceLabel(source: number) { return source === 12 ? 'Self' : source === 5 ? 'Referral' : 'Company'; }

  load() {
    this.api.leads().subscribe(data => this.leads = data);
  }

  create() {
    this.error = '';
    this.api.createLead(this.form).subscribe({
      next: () => {
        this.form = { ...this.form, customerId: null, customerName: '', phone: '', email: null, preferredLocation: null, projectId: null, assignedToId: null };
        this.selectedCustomerId = null;
        this.load();
        this.loadAvailableCustomers();
      },
      error: err => this.error = err.error?.message || 'Could not create lead.'
    });
  }
}
