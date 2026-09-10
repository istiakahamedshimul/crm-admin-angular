import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';

interface BackupItem {
  id: string;
  type: 'Instant' | 'Weekly';
  status: 'Queued' | 'Running' | 'Completed' | 'Failed';
  fileName?: string;
  sizeBytes?: number;
  createdAtUtc: string;
  completedAtUtc?: string;
  expiresAtUtc?: string;
  error?: string;
}

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">System protection</p>
        <h1>Project & database backups</h1>
        <p class="intro">Create a consistent CRM database dump and a copy of the currently deployed application.</p>
      </div>
      <button (click)="create()" [disabled]="creating || active">
        <span class="button-icon">+</span>{{ active ? 'Backup in progress' : 'Create instant backup' }}
      </button>
    </section>

    <div class="policy-grid">
      <article class="policy-card weekly">
        <div class="policy-icon">W</div>
        <div><strong>Weekly protection</strong><p>Created automatically every 7 days. A successful new backup replaces the previous weekly copy.</p></div>
      </article>
      <article class="policy-card instant">
        <div class="policy-icon">24</div>
        <div><strong>Instant download</strong><p>Generated in the background and available for 24 hours before automatic removal.</p></div>
      </article>
    </div>

    <p class="notice success" *ngIf="message">{{ message }}</p>
    <p class="notice error" *ngIf="error">{{ error }}</p>

    <article class="panel">
      <div class="panel-title"><div><h2>Backup history</h2><p>Only Super Admin accounts can create or download backups.</p></div><button class="ghost-button" (click)="load()" [disabled]="loading">Refresh</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Backup</th><th>Created</th><th>Size</th><th>Retention</th><th>Status</th><th class="actions">Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let item of items; trackBy: track">
              <td><strong>{{ item.type }}</strong><small>{{ item.fileName || 'Preparing archive…' }}</small></td>
              <td>{{ item.createdAtUtc | date:'medium' }}</td>
              <td>{{ item.sizeBytes ? formatBytes(item.sizeBytes) : '—' }}</td>
              <td>{{ item.type === 'Weekly' ? 'Until next weekly backup' : (item.expiresAtUtc | date:'medium') }}</td>
              <td><span class="status" [class]="'status ' + item.status.toLowerCase()"><i></i>{{ item.status }}</span><small class="failure" *ngIf="item.error">{{ item.error }}</small></td>
              <td class="actions"><button *ngIf="item.status === 'Completed'" class="download" (click)="download(item)" [disabled]="downloading === item.id">{{ downloading === item.id ? 'Downloading…' : 'Download' }}</button></td>
            </tr>
            <tr *ngIf="!items.length && !loading"><td colspan="6" class="empty">No backups have been created yet.</td></tr>
            <tr *ngIf="loading && !items.length"><td colspan="6" class="empty">Loading backups…</td></tr>
          </tbody>
        </table>
      </div>
    </article>
  `,
  styles: [`
    .page-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:22px}.page-head h1{font-size:30px;letter-spacing:-.8px;margin:4px 0 8px}.eyebrow{color:var(--brand);font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}.intro,.panel-title p,.policy-card p{color:var(--muted);line-height:1.6}.button-icon{font-size:22px;font-weight:400}.policy-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:20px}.policy-card{display:flex;gap:16px;padding:20px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:var(--shadow)}.policy-card strong{font-size:16px}.policy-card p{font-size:13px;margin-top:5px}.policy-icon{width:44px;height:44px;flex:0 0 44px;border-radius:12px;display:grid;place-items:center;font-weight:800;background:#ecfdf5;color:#047857}.instant .policy-icon{background:#eff6ff;color:#2563eb}.panel{padding:0;overflow:hidden}.panel-title{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid var(--line)}.panel-title h2{font-size:18px;margin-bottom:4px}.panel-title p{font-size:12px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:15px 18px;border-bottom:1px solid var(--line);white-space:nowrap}th{font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:var(--muted);background:#f8fafc}td{font-size:13px}td strong,td small{display:block}td small{color:var(--muted);margin-top:4px;max-width:250px;overflow:hidden;text-overflow:ellipsis}.actions{text-align:right}.status{display:inline-flex;align-items:center;gap:7px;padding:5px 9px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:12px;font-weight:700}.status i{width:7px;height:7px;border-radius:50%;background:#94a3b8}.status.completed{background:#ecfdf5;color:#047857}.status.completed i{background:#10b981}.status.running,.status.queued{background:#eff6ff;color:#1d4ed8}.status.running i,.status.queued i{background:#3b82f6;animation:pulse 1.2s infinite}.status.failed{background:#fef2f2;color:#b91c1c}.status.failed i{background:#ef4444}.download{min-height:34px;padding:0 13px;font-size:12px}.notice{padding:12px 16px;border-radius:9px;margin-bottom:16px;font-size:13px}.notice.success{background:#ecfdf5;color:#047857}.notice.error,.failure{color:#b91c1c!important}.notice.error{background:#fef2f2}.empty{text-align:center!important;color:var(--muted);padding:40px!important}@keyframes pulse{50%{opacity:.35}}@media(max-width:800px){.page-head{display:grid}.policy-grid{grid-template-columns:1fr}.page-head button{width:100%}}
  `]
})
export class BackupsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  items: BackupItem[] = [];
  loading = false;
  creating = false;
  downloading = '';
  message = '';
  error = '';
  private timer?: ReturnType<typeof setInterval>;
  get active() { return this.items.some(x => x.status === 'Queued' || x.status === 'Running'); }

  ngOnInit() { this.load(); this.timer = setInterval(() => { if (this.active) this.load(false); }, 4000); }
  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }
  track(_: number, item: BackupItem) { return item.id; }
  load(showLoader = true) {
    if (showLoader) this.loading = true;
    this.api.backups().subscribe({
      next: response => { this.items = response.items; this.loading = false; },
      error: response => { this.error = response.error?.message || 'Could not load backups.'; this.loading = false; }
    });
  }
  create() {
    this.creating = true; this.error = ''; this.message = '';
    this.api.createBackup().subscribe({
      next: () => { this.message = 'Backup preparation started. You can continue using the CRM.'; this.creating = false; this.load(false); },
      error: response => { this.error = response.error?.message || 'Could not start the backup.'; this.creating = false; }
    });
  }
  download(item: BackupItem) {
    this.downloading = item.id; this.error = '';
    this.api.backupDownloadLink(item.id).subscribe({
      next: response => {
        const link = document.createElement('a');
        link.href = this.api.backupDownloadUrl(item.id, response.token);
        link.download = item.fileName || `crm-backup-${item.id}.tar.gz`;
        document.body.appendChild(link); link.click(); link.remove();
        this.downloading = '';
      },
      error: () => { this.error = 'The backup could not be downloaded. It may have expired.'; this.downloading = ''; }
    });
  }
  formatBytes(bytes: number) { const units = ['B','KB','MB','GB']; let value = bytes, unit = 0; while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; } return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`; }
}
