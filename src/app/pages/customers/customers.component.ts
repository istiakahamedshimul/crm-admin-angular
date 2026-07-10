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

    <div>

        <p class="eyebrow">Profiles</p>

        <h1>Customer Management</h1>

    </div>

</section>

<!-- Create Customer -->

<section class="panel form-panel">

    <h2>Create Customer From Lead</h2>

    <form (ngSubmit)="create()">

        <div class="form-grid">

            <label class="field">

                <span>Assigned Lead</span>

                <select
                    name="leadId"
                    [(ngModel)]="form.leadId"
                    required>

                    <option [ngValue]="0">

                        Select Lead

                    </option>

                    <option
                        *ngFor="let lead of leads"
                        [ngValue]="lead.id">

                        {{lead.customerName}} - {{lead.phone}}

                    </option>

                </select>

            </label>

            <label class="field">

                <span>Occupation</span>

                <input
                    type="text"
                    name="occupation"
                    [(ngModel)]="form.occupation"
                    placeholder="Customer occupation">

            </label>

            <label class="field">

                <span>NID / Passport</span>

                <input
                    type="text"
                    name="nid"
                    [(ngModel)]="form.nidOrPassport"
                    placeholder="NID or Passport Number">

            </label>

            <label class="field">

                <span>Nominee Name</span>

                <input
                    type="text"
                    name="nomineeName"
                    [(ngModel)]="form.nomineeName"
                    placeholder="Nominee name">

            </label>

            <label class="field full-width">

                <span>Nominee Phone</span>

                <input
                    type="text"
                    name="nomineePhone"
                    [(ngModel)]="form.nomineePhone"
                    placeholder="Nominee phone number">

            </label>

        </div>

        <button
            class="primary-btn"
            type="submit">

            + Create Customer

        </button>

        <p class="error" *ngIf="error">

            {{error}}

        </p>

    </form>

</section>

<!-- Customer List -->

<section class="panel table-panel">

    <div class="table-header">

        <h2>Customer Profiles</h2>

        <input
            class="search-box"
            placeholder="Search customers (Coming Soon)"
            disabled>

    </div>

    <table>

        <thead>

            <tr>

                <th>Customer</th>

                <th>Phone</th>

                <th>Lead ID</th>

                <th>Sales Executive</th>

                <th>Payment</th>

                <th>Action</th>

            </tr>

        </thead>

        <tbody>

            <tr *ngFor="let customer of customers">

                <td>{{customer.name}}</td>

                <td>{{customer.phone}}</td>

                <td>#{{customer.leadId || '-'}}</td>

                <td>{{customer.salesExecutive || '-'}}</td>

                <td>

                    <span
                        class="payment-badge"
                        [ngClass]="{

                        'paid':customer.paymentStatus==='Paid',

                        'partial':customer.paymentStatus==='Partial',

                        'due':customer.paymentStatus==='Due'

                        }">

                        {{customer.paymentStatus}}

                    </span>

                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            type="button"
                            class="edit-btn">

                            ✏️

                        </button>

                        <button
                            type="button"
                            class="delete-btn">

                            🗑️

                        </button>

                    </div>

                </td>

            </tr>


                        <tr *ngIf="customers.length===0">

                <td colspan="6" class="empty-table">

                    No customer found.

                </td>

            </tr>

        </tbody>

    </table>

</section>

`
})
export class CustomersComponent implements OnInit {

    private api = inject(ApiService);

    customers: Customer[] = [];

    leads: Lead[] = [];

    error = '';

    form: CreateCustomerRequest = {

        leadId: 0

    };

    ngOnInit() {

        this.load();

        this.api.leads().subscribe(data => {

            this.leads = data;

        });

    }

    load() {

        this.api.customers().subscribe(data => {

            this.customers = data;

        });

    }

    create() {

        this.error = '';

        this.api.createCustomer(this.form).subscribe({

            next: () => {

                this.form = {

                    leadId: 0

                };

                this.load();

            },

            error: err => {

                this.error = err.error?.message || 'Could not create customer.';

            }

        });

    }

}