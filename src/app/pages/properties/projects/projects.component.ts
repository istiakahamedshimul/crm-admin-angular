import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { CreateProjectRequest, Project } from '../../../models/crm.models';
import { label, projectStatus } from '../../../shared/format';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Inventory</p>
        <h1>Projects</h1>
      </div>
    </section>

    <!-- Add Project Card -->
    <section class="panel form-panel">

      <h2>Add Project</h2>

      <form (ngSubmit)="createProject()">

  <div class="form-grid">

    <label class="field">

      <span>Project Name</span>

      <input
        type="text"
        name="projectName"
        [(ngModel)]="projectForm.name"
        placeholder="e.g. Green Valley"
        required>

    </label>

    <label class="field">

      <span>Location</span>

      <input
        type="text"
        name="location"
        [(ngModel)]="projectForm.location"
        placeholder="e.g. Dhaka"
        required>

    </label>

    <label class="field full-width">

      <span>Status</span>

      <select
        name="status"
        [(ngModel)]="projectForm.status">

        <option [ngValue]="1">Ongoing</option>
        <option [ngValue]="2">Ready</option>
        <option [ngValue]="3">Completed</option>

      </select>

    </label>

  </div>

  <button
    class="primary-btn"
    type="submit">

    Create Project

  </button>

</form>

    </section>

    <!-- Project List -->

    <section class="panel table-panel">

      <div class="table-header">
        <h2>Projects</h2>
      </div>

      <table>

        <thead>

          <tr>

            <th>Name</th>
            <th>Location</th>
            <th>Status</th>
            <th>Available Units</th>

          </tr>

        </thead>

        <tbody>

          <tr *ngFor="let project of projects">

            <td>{{ project.name }}</td>

            <td>{{ project.location }}</td>

            <td>

              <span class="status-badge">

                {{ label(projectStatus, project.status) }}

              </span>

            </td>

            <td>

              {{ project.availableUnits }}/{{ project.totalUnits }}

            </td>

          </tr>

          <tr *ngIf="projects.length === 0">

            <td colspan="4" class="empty-table">

              No projects found.

            </td>

          </tr>

        </tbody>

      </table>

    </section>
  `
})
export class ProjectsComponent implements OnInit {

    private api = inject(ApiService);

    projects: Project[] = [];

    label = label;

    projectStatus = projectStatus;

    projectForm: CreateProjectRequest = {
        name: '',
        type: 0,
        location: '',
        address: null,
        description: null,
        status: 1
    };

    ngOnInit() {
        this.load();
    }

    load() {
        this.api.projects().subscribe((data: Project[]) => {
            this.projects = data;
        });
    }

    createProject() {

        this.api.createProject(this.projectForm).subscribe(() => {

            this.projectForm = {
                name: '',
                type: 0,
                location: '',
                address: null,
                description: null,
                status: 1
            };

            this.load();

        });

    }

}