import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import {
    CreateUnitRequest,
    Project,
    Unit
} from '../../../models/crm.models';
import {
    label,
    money,
    unitStatus
} from '../../../shared/format';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Inventory</p>
        <h1>Units</h1>
      </div>
    </section>

    <!-- Add Unit -->

    <section class="panel form-panel">

      <h2>Add Unit</h2>

      <form (ngSubmit)="createUnit()">

  <div class="form-grid">

    <label class="field">
      <span>Project</span>

      <select
        name="projectId"
        [(ngModel)]="unitForm.projectId"
        required>

        <option [ngValue]="0">Select Project</option>

        <option
          *ngFor="let project of projects"
          [ngValue]="project.id">

          {{project.name}}

        </option>

      </select>

    </label>

    <label class="field">

      <span>Unit Number</span>

      <input
        type="text"
        name="unitNumber"
        [(ngModel)]="unitForm.unitNumber"
        placeholder="e.g. A-1203"
        required>

    </label>

    <label class="field">

      <span>Size (sqft)</span>

      <input
        type="number"
        name="sizeSqft"
        [(ngModel)]="unitForm.sizeSqft"
        placeholder="e.g. 1200"
        required>

    </label>

    <label class="field">

      <span>Final Price</span>

      <input
        type="number"
        name="finalPrice"
        [(ngModel)]="unitForm.finalPrice"
        placeholder="e.g. 6500000"
        required>

    </label>

    <label class="field full-width">

      <span>Booking Money</span>

      <input
        type="number"
        name="bookingMoney"
        [(ngModel)]="unitForm.bookingMoney"
        placeholder="e.g. 500000"
        required>

    </label>

  </div>

  <button
    class="primary-btn"
    type="submit">

    Create Unit

  </button>

</form>

    </section>

    <!-- Unit List -->

    <section class="panel table-panel">

      <div class="table-header">

        <h2>Units</h2>

      </div>

      <table>

        <thead>

          <tr>

            <th>Unit</th>
            <th>Project</th>
            <th>Size</th>
            <th>Price</th>
            <th>Status</th>

          </tr>

        </thead>

        <tbody>

          <tr *ngFor="let unit of units">

            <td>{{ unit.unitNumber }}</td>

            <td>{{ unit.project }}</td>

            <td>{{ unit.sizeSqft }} sqft</td>

            <td>{{ money(unit.finalPrice) }}</td>

            <td>

              <span class="status-badge">

                {{ label(unitStatus, unit.status) }}

              </span>

            </td>

          </tr>

          <tr *ngIf="units.length === 0">

            <td colspan="5" class="empty-table">

              No units found.

            </td>

          </tr>

        </tbody>

      </table>

    </section>
  `
})
export class UnitsComponent implements OnInit {

    private api = inject(ApiService);

    projects: Project[] = [];

    units: Unit[] = [];

    label = label;

    money = money;

    unitStatus = unitStatus;

    unitForm: CreateUnitRequest = {
        projectId: 0,
        unitNumber: '',
        sizeSqft: 0,
        basePrice: 0,
        finalPrice: 0,
        bookingMoney: 0
    };

    ngOnInit() {
        this.load();
    }

    load() {

        this.api.projects().subscribe((data: Project[]) => {
            this.projects = data;
        });

        this.api.units().subscribe((data: Unit[]) => {
            this.units = data;
        });

    }

    createUnit() {

        this.unitForm.basePrice = this.unitForm.finalPrice;

        this.api.createUnit(this.unitForm).subscribe(() => {

            this.unitForm = {
                projectId: 0,
                unitNumber: '',
                sizeSqft: 0,
                basePrice: 0,
                finalPrice: 0,
                bookingMoney: 0
            };

            this.load();

        });

    }

}