import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import {
    CreateLeadRequest,
    Lead,
    SalesExecutive
} from '../../models/crm.models';
import {
    label,
    leadPriority,
    leadSource,
    leadStatus
} from '../../shared/format';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<section class="page-head">
    <div>
        <p class="eyebrow">Pipeline</p>
        <h1>Lead Management</h1>
    </div>
</section>

<section class="panel form-panel">

    <h2>Create New Lead</h2>

    <form (ngSubmit)="create()">

        <div class="form-grid">

            <label class="field">

                <span>Customer Name</span>

                <input
                    name="customerName"
                    [(ngModel)]="form.customerName"
                    placeholder="Enter customer name"
                    required>

            </label>

            <label class="field">

                <span>Phone Number</span>

                <input
                    name="phone"
                    [(ngModel)]="form.phone"
                    placeholder="01XXXXXXXXX"
                    required>

            </label>

            <label class="field">

                <span>Email</span>

                <input
                    name="email"
                    [(ngModel)]="form.email"
                    placeholder="example@email.com">

            </label>

            <label class="field">

                <span>Preferred Location</span>

                <input
                    name="preferredLocation"
                    [(ngModel)]="form.preferredLocation"
                    placeholder="Preferred location">

            </label>

            <label class="field">

                <span>Interested Project</span>

                <input
                    name="interestedProject"
                    [(ngModel)]="form.interestedProject"
                    placeholder="Project name">

            </label>

            <label class="field">

                <span>Assign Sales Executive</span>

                <select
                    name="assignedToId"
                    [(ngModel)]="form.assignedToId"
                    required>

                    <option [ngValue]="null">
                        Select Executive
                    </option>

                    <option
                        *ngFor="let sales of salesExecutives"
                        [ngValue]="sales.id">

                        {{sales.fullName}}

                    </option>

                </select>

            </label>

            <label class="field full-width">

                <span>Priority</span>

                <select
                    name="priority"
                    [(ngModel)]="form.priority">

                    <option [ngValue]="0">Low</option>
                    <option [ngValue]="1">Medium</option>
                    <option [ngValue]="2">Top</option>

                </select>

            </label>

        </div>

        <button
            class="primary-btn"
            type="submit">

            + Create Lead

        </button>

        <p class="error" *ngIf="error">

            {{error}}

        </p>

    </form>

</section>

<section class="panel table-panel">

    <div class="table-header">

        <h2>Assigned Leads</h2>

        <input
            class="search-box"
            placeholder="Search leads (Coming Soon)"
            disabled>

    </div>

    <table>

        <thead>

            <tr>

                <th>Customer</th>

                <th>Phone</th>

                <th>Priority</th>

                <th>Status</th>

                <th>Sales Executive</th>

                <th>Action</th>

            </tr>

        </thead>

        <tbody>

            <tr *ngFor="let lead of leads">

                <td>{{lead.customerName}}</td>

                <td>{{lead.phone}}</td>

                <td>

                    <span
                        class="priority-badge"
                        [ngClass]="{

                        'priority-low':lead.priority===0,

                        'priority-medium':lead.priority===1,

                        'priority-top':lead.priority===2

                        }">

                        {{label(leadPriority,lead.priority)}}

                    </span>

                </td>

                <td>

                    <span class="status-badge">

                        {{label(leadStatus,lead.status)}}

                    </span>

                </td>

                <td>

                    {{lead.assignedToName || '-'}}

                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            class="edit-btn"
                            type="button">

                            ✏️

                        </button>

                        <button
                            class="delete-btn"
                            type="button">

                            🗑️

                        </button>

                    </div>

                </td>

            </tr>

                        <tr *ngIf="leads.length===0">

                <td colspan="6" class="empty-table">

                    No leads available.

                </td>

            </tr>

        </tbody>

    </table>

</section>
`
})
export class LeadsComponent implements OnInit {

    private api = inject(ApiService);

    leads: Lead[] = [];

    salesExecutives: SalesExecutive[] = [];

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

        interestedProject: null,

        source: leadSource.indexOf('Manual'),

        priority: 1,

        assignedToId: null,

        remarks: null

    };

    ngOnInit() {

        this.load();

        this.api.salesExecutives().subscribe(data => {

            this.salesExecutives = data;

        });

    }

    load() {

        this.api.leads().subscribe(data => {

            this.leads = data;

        });

    }

    create() {

        this.error = '';

        this.api.createLead(this.form).subscribe({

            next: () => {

                this.form = {

                    ...this.form,

                    customerName: '',

                    phone: '',

                    email: null,

                    preferredLocation: null,

                    interestedProject: null,

                    assignedToId: null

                };

                this.load();

            },

            error: err => {

                this.error = err.error?.message || 'Could not create lead.';

            }

        });

    }

}