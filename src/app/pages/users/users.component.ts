import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import {
    CreateSalesExecutiveRequest,
    UserSummary
} from '../../models/crm.models';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `

<section class="page-head">

    <div>

        <p class="eyebrow">Team</p>

        <h1>Sales Accounts</h1>

    </div>

</section>

<!-- Create Sales Executive -->

<section class="panel form-panel">

    <h2>Create Sales Executive</h2>

    <form (ngSubmit)="create()">

        <div class="form-grid">

            <label class="field">

                <span>Full Name</span>

                <input
                    name="fullName"
                    [(ngModel)]="form.fullName"
                    placeholder="Enter full name"
                    required>

            </label>

            <label class="field">

                <span>Email</span>

                <input
                    type="email"
                    name="email"
                    [(ngModel)]="form.email"
                    placeholder="example@email.com"
                    required>

            </label>

            <label class="field">

                <span>Phone</span>

                <input
                    name="phone"
                    [(ngModel)]="form.phone"
                    placeholder="01XXXXXXXXX"
                    required>

            </label>

            <label class="field">

                <span>Password</span>

                <input
                    type="password"
                    name="password"
                    [(ngModel)]="form.password"
                    required>

            </label>

        </div>

        <button
            class="primary-btn"
            type="submit">

            + Create Account

        </button>

        <p
            class="success"
            *ngIf="message">

            {{message}}

        </p>

        <p
            class="error"
            *ngIf="error">

            {{error}}

        </p>

    </form>

</section>

<!-- Sales Executive List -->

<section class="panel table-panel">

    <div class="table-header">

        <h2>Sales Executives</h2>

        <input
            class="search-box"
            placeholder="Search executives (Coming Soon)"
            disabled>

    </div>

    <table>

        <thead>

            <tr>

                <th>Name</th>

                <th>Email</th>

                <th>Role</th>

                <th>Status</th>

                <th>Action</th>

            </tr>

        </thead>

        <tbody>

            <tr *ngFor="let user of users">

                <td>

                    {{user.fullName}}

                </td>

                <td>

                    {{user.email}}

                </td>

                <td>

                    {{user.role}}

                </td>

                <td>

                    <span
                        class="status-badge"
                        [ngClass]="{

                        'status-active':user.isActive,

                        'status-inactive':!user.isActive

                        }">

                        {{user.isActive ? 'Active' : 'Inactive'}}

                    </span>

                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            type="button"
                            class="view-btn">

                            👁️

                        </button>

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

            <tr *ngIf="users.length===0">

                <td colspan="5" class="empty-table">

                    No sales executive found.

                </td>

            </tr>

        </tbody>

    </table>

</section>

`
})
export class UsersComponent implements OnInit {

    private api = inject(ApiService);

    users: UserSummary[] = [];

    message = '';

    error = '';

    form: CreateSalesExecutiveRequest = {

        fullName: '',

        email: '',

        phone: '',

        password: 'Sales@12345'

    };

    ngOnInit() {

        this.load();

    }

    load() {

        this.api.users().subscribe(data => {

            this.users = data;

        });

    }

    create() {

        this.message = '';

        this.error = '';

        this.api.createSalesExecutive(this.form).subscribe({

            next: () => {

                this.message = 'Sales executive created successfully.';

                this.form = {

                    fullName: '',

                    email: '',

                    phone: '',

                    password: 'Sales@12345'

                };

                this.load();

            },

            error: err => {

                this.error = err.error?.message || 'Could not create sales executive.';

            }

        });

    }

}