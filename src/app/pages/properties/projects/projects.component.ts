import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { CreateProjectRequest, CreateSubGroupRequest, Project, SubGroup } from '../../../models/crm.models';
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

    <section class="panel form-panel">
      <h2>Create Subgroup</h2>
      <p>All subgroups belong to Real Capital Group.</p>
      <form (ngSubmit)="createSubGroup()">
        <div class="form-grid">
          <label class="field">
            <span>Subgroup Name</span>
            <input name="subGroupName" [(ngModel)]="subGroupForm.name" placeholder="e.g. Real Capital Properties" required>
          </label>
          <label class="field">
            <span>Description</span>
            <input name="subGroupDescription" [(ngModel)]="subGroupForm.description" placeholder="Optional description">
          </label>
        </div>
        <button class="primary-btn" type="submit" [disabled]="creatingSubGroup">
          {{ creatingSubGroup ? 'Creating...' : 'Create Subgroup' }}
        </button>
      </form>
    </section>

    <!-- Add Project Card -->
    <section class="panel form-panel">

      <h2>Add Project</h2>

      <form (ngSubmit)="createProject()">

  <div class="form-grid">

    <label class="field">
      <span>Subgroup</span>
      <select name="subGroupId" [(ngModel)]="projectForm.subGroupId" required>
        <option [ngValue]="0" disabled>Select subgroup</option>
        <option *ngFor="let group of subGroups" [ngValue]="group.id">{{ group.name }}</option>
      </select>
    </label>

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
      <span>Project Type</span>
      <select name="type" [(ngModel)]="projectForm.type">
        <option *ngFor="let type of projectTypes; let index = index" [ngValue]="index">{{ type }}</option>
      </select>
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
            <th>Subgroup</th>
            <th>Type</th>
            <th>Location</th>
            <th>Status</th>

          </tr>

        </thead>

        <tbody>

          <tr *ngFor="let project of projects">

            <td>{{ project.name }}</td>

            <td>{{ project.subGroup }}</td>

            <td>{{ projectTypes[project.type] }}</td>

            <td>{{ project.location }}</td>

            <td>

              <span class="status-badge">

                {{ label(projectStatus, project.status) }}

              </span>

            </td>

          </tr>

          <tr *ngIf="projects.length === 0">

            <td colspan="5" class="empty-table">

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
    subGroups: SubGroup[] = [];
    projectTypes = ['Apartment', 'Flat', 'Plot', 'Land', 'Commercial Space', 'Shop', 'Office Space'];
    creatingSubGroup = false;

    label = label;

    projectStatus = projectStatus;

    projectForm: CreateProjectRequest = {
        name: '',
        subGroupId: 0,
        type: 0,
        location: '',
        address: null,
        description: null,
        status: 1
    };

    subGroupForm: CreateSubGroupRequest = {
        name: '',
        description: null
    };

    ngOnInit() {
        this.load();
    }

    load() {
        this.api.projects().subscribe((data: Project[]) => {
            this.projects = data;
        });
        this.api.subGroups().subscribe((data: SubGroup[]) => {
            this.subGroups = data;
        });
    }

    createSubGroup() {
        const name = this.subGroupForm.name.trim();
        if (!name || this.creatingSubGroup) return;
        this.creatingSubGroup = true;
        this.api.createSubGroup({ ...this.subGroupForm, name }).subscribe({
            next: () => {
                this.subGroupForm = { name: '', description: null };
                this.creatingSubGroup = false;
                this.load();
            },
            error: () => this.creatingSubGroup = false
        });
    }

    createProject() {

        if (!this.projectForm.subGroupId) return;

        this.api.createProject(this.projectForm).subscribe(() => {

            this.projectForm = {
                name: '',
                subGroupId: 0,
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
