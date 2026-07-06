import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { CreateProjectRequest, CreateUnitRequest, Project, Unit } from '../../models/crm.models';
import { label, money, projectStatus, unitStatus } from '../../shared/format';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Inventory</p><h1>Projects & Units</h1></div>
    </section>

    <section class="split-panels">
      <form class="panel form-panel" (ngSubmit)="createProject()">
        <h2>Add Project</h2>
        <label>Name<input name="projectName" [(ngModel)]="projectForm.name" required></label>
        <label>Location<input name="location" [(ngModel)]="projectForm.location" required></label>
        <label>Status
          <select name="status" [(ngModel)]="projectForm.status">
            <option [ngValue]="1">Ongoing</option><option [ngValue]="2">Ready</option><option [ngValue]="3">Completed</option>
          </select>
        </label>
        <button type="submit">Create Project</button>
      </form>

      <form class="panel form-panel" (ngSubmit)="createUnit()">
        <h2>Add Unit</h2>
        <label>Project
          <select name="projectId" [(ngModel)]="unitForm.projectId" required>
            <option [ngValue]="0">Select project</option>
            <option *ngFor="let project of projects" [ngValue]="project.id">{{ project.name }}</option>
          </select>
        </label>
        <label>Unit number<input name="unitNumber" [(ngModel)]="unitForm.unitNumber" required></label>
        <label>Size sqft<input name="sizeSqft" [(ngModel)]="unitForm.sizeSqft" type="number" required></label>
        <label>Final price<input name="finalPrice" [(ngModel)]="unitForm.finalPrice" type="number" required></label>
        <label>Booking money<input name="bookingMoney" [(ngModel)]="unitForm.bookingMoney" type="number" required></label>
        <button type="submit">Create Unit</button>
      </form>
    </section>

    <section class="two-column">
      <article class="panel">
        <h2>Projects</h2>
        <table><thead><tr><th>Name</th><th>Location</th><th>Status</th><th>Units</th></tr></thead>
          <tbody><tr *ngFor="let project of projects"><td>{{ project.name }}</td><td>{{ project.location }}</td><td>{{ label(projectStatus, project.status) }}</td><td>{{ project.availableUnits }}/{{ project.totalUnits }}</td></tr></tbody>
        </table>
      </article>
      <article class="panel">
        <h2>Units</h2>
        <table><thead><tr><th>Unit</th><th>Project</th><th>Size</th><th>Price</th><th>Status</th></tr></thead>
          <tbody><tr *ngFor="let unit of units"><td>{{ unit.unitNumber }}</td><td>{{ unit.project }}</td><td>{{ unit.sizeSqft }}</td><td>{{ money(unit.finalPrice) }}</td><td><span class="badge">{{ label(unitStatus, unit.status) }}</span></td></tr></tbody>
        </table>
      </article>
    </section>
  `
})
export class PropertiesComponent implements OnInit {
  private api = inject(ApiService);
  projects: Project[] = [];
  units: Unit[] = [];
  label = label;
  money = money;
  projectStatus = projectStatus;
  unitStatus = unitStatus;

  projectForm: CreateProjectRequest = { name: '', type: 0, location: '', address: null, description: null, status: 1 };
  unitForm: CreateUnitRequest = { projectId: 0, unitNumber: '', sizeSqft: 0, basePrice: 0, finalPrice: 0, bookingMoney: 0 };

  ngOnInit() { this.load(); }

  load() {
    this.api.projects().subscribe(data => this.projects = data);
    this.api.units().subscribe(data => this.units = data);
  }

  createProject() {
    this.api.createProject(this.projectForm).subscribe(() => {
      this.projectForm = { name: '', type: 0, location: '', address: null, description: null, status: 1 };
      this.load();
    });
  }

  createUnit() {
    this.unitForm.basePrice = this.unitForm.finalPrice;
    this.api.createUnit(this.unitForm).subscribe(() => {
      this.unitForm = { projectId: 0, unitNumber: '', sizeSqft: 0, basePrice: 0, finalPrice: 0, bookingMoney: 0 };
      this.load();
    });
  }
}
