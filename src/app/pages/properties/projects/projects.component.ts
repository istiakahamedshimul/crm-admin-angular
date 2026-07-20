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

    <!-- Side-by-side Creation Forms in Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; margin-bottom: 24px;">
      <!-- Create Subgroup Form -->
      <section class="panel form-panel">
        <h2>Create Subgroup</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: -12px;">Subgroups represent your internal corporate units.</p>
        <form (ngSubmit)="createSubGroup()">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <label class="field">
              <span>Subgroup Name *</span>
              <input name="subGroupName" [(ngModel)]="subGroupForm.name" placeholder="e.g. Real Capital Properties" required>
            </label>
            <label class="field">
              <span>Description</span>
              <input name="subGroupDescription" [(ngModel)]="subGroupForm.description" placeholder="Optional description">
            </label>
          </div>
          <button class="primary-btn" type="submit" [disabled]="creatingSubGroup" style="margin-top: 16px;">
            {{ creatingSubGroup ? 'Creating...' : 'Create Subgroup' }}
          </button>
        </form>
      </section>

      <!-- Add Project Form -->
      <section class="panel form-panel">
        <h2>Add Project</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: -12px;">Register new projects to map properties and leads.</p>
        <form (ngSubmit)="createProject()">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <label class="field">
              <span>Subgroup *</span>
              <select name="subGroupId" [(ngModel)]="projectForm.subGroupId" required>
                <option [ngValue]="0" disabled>Select subgroup</option>
                <option *ngFor="let group of subGroups" [ngValue]="group.id">{{ group.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>Project Name *</span>
              <input type="text" name="projectName" [(ngModel)]="projectForm.name" placeholder="e.g. Green Valley" required>
            </label>
            <label class="field">
              <span>Project Type *</span>
              <select name="type" [(ngModel)]="projectForm.type">
                <option *ngFor="let type of projectTypes; let index = index" [ngValue]="index">{{ type }}</option>
              </select>
            </label>
            <label class="field">
              <span>Location *</span>
              <input type="text" name="location" [(ngModel)]="projectForm.location" placeholder="e.g. Dhaka" required>
            </label>
            <label class="field" style="grid-column: span 2;">
              <span>Status *</span>
              <select name="status" [(ngModel)]="projectForm.status">
                <option [ngValue]="1">Ongoing</option>
                <option [ngValue]="2">Ready</option>
                <option [ngValue]="3">Completed</option>
              </select>
            </label>
          </div>
          <button class="primary-btn" type="submit" style="margin-top: 16px;">
            Create Project
          </button>
        </form>
      </section>
    </div>

    <!-- Project Card Inventory List -->
    <section class="panel table-panel">
      <div class="table-header" style="margin-bottom: 20px;">
        <div>
          <h2>Project Inventory</h2>
          <p style="color: var(--muted); font-size: 13px; margin-top: 2px;">View registered apartments, land plots, and structures.</p>
        </div>
      </div>

      <!-- Modern Project Card Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px;">
        <article *ngFor="let project of projects" style="background: var(--bg); border: 1px solid var(--line); border-radius: 14px; padding: 22px; display: flex; flex-direction: column; gap: 14px; transition: transform 0.2s ease;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="width: 42px; height: 42px; border-radius: 10px; display: grid; place-items: center; background: var(--brand-light); color: var(--brand); font-weight: 800; font-size: 18px;">
              🏢
            </div>
            <span class="status-pill" [class.approved]="project.status===3" [class.pending]="project.status===1" [class.inactive]="project.status===2">
              {{ label(projectStatus, project.status) }}
            </span>
          </div>

          <div>
            <h3 style="font-size: 17px; font-weight: 700; color: var(--text-dark); margin: 0 0 4px;">{{ project.name }}</h3>
            <span style="font-size: 12px; color: var(--muted); font-weight: 600;">📁 {{ project.subGroup }}</span>
          </div>

          <div style="border-top: 1px solid var(--line); padding-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto;">
            <span style="padding: 4px 8px; border-radius: 6px; background: white; border: 1px solid var(--line); font-size: 12px; font-weight: 600; color: #475569;">
              📍 {{ project.location }}
            </span>
            <span style="padding: 4px 8px; border-radius: 6px; background: white; border: 1px solid var(--line); font-size: 12px; font-weight: 600; color: #475569;">
              🏡 {{ projectTypes[project.type] }}
            </span>
          </div>
        </article>
      </div>

      <div class="empty-card" *ngIf="projects.length === 0" style="margin-top: 20px;">
        No projects registered yet.
      </div>
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
