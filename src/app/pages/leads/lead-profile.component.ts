import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { FollowUp, Lead, Project, SalesExecutive } from '../../models/crm.models';
import { leadStatus } from '../../shared/format';

const followUpTypes = ['WhatsApp', 'Call', 'Facebook', 'Meeting', 'Office Visit', 'Site Visit', 'SMS', 'Email', 'Follow-up'];

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Lead intelligence</p><h1>Lead Profile</h1><p class="page-copy">Complete contact record, ownership, and journey at a glance.</p></div>
      <a routerLink="/leads" class="ghost-button back-link">← Back to leads</a>
    </section>

    <p class="error" *ngIf="error">{{error}}</p>
    <div class="loading panel" *ngIf="loading">Loading lead profile…</div>

    <ng-container *ngIf="lead && !loading">
      <section class="profile-hero">
        <div class="identity">
          <div class="avatar">{{initials(lead.customerName)}}</div>
          <div><span class="source-badge">{{sourceLabel(lead.source)}} lead</span><h2>{{lead.customerName}}</h2><p>{{lead.phone}}<span *ngIf="lead.email"> · {{lead.email}}</span></p></div>
        </div>
        <div class="hero-facts">
          <div><span>Current stage</span><strong>{{statusLabel(lead.status)}}</strong></div>
          <div><span>Sales executive</span><strong>{{lead.assignedToName || 'Unassigned'}}</strong></div>
          <div><span>Project</span><strong>{{lead.projectName || 'Not selected'}}</strong></div>
          <div><span>Total updates</span><strong>{{timeline.length}}</strong></div>
        </div>
      </section>

      <section class="profile-layout">
        <form class="panel editor" (ngSubmit)="save()">
          <div class="section-head"><div><p class="eyebrow">Lead information</p><h2>Profile & Assignment</h2></div><span class="saved" *ngIf="message">{{message}}</span></div>
          <div class="form-grid">
            <label>Lead name<input name="customerName" [(ngModel)]="form.customerName" required></label>
            <label>Phone<input name="phone" [(ngModel)]="form.phone" required></label>
            <label>Alternative phone<input name="alternativePhone" [(ngModel)]="form.alternativePhone"></label>
            <label>Email<input name="email" type="email" [(ngModel)]="form.email"></label>
            <label class="full">Address<input name="address" [(ngModel)]="form.address"></label>
            <label>Preferred location<input name="preferredLocation" [(ngModel)]="form.preferredLocation"></label>
            <label>Budget range<input name="budgetRange" [(ngModel)]="form.budgetRange"></label>
            <label>Project<select name="projectId" [(ngModel)]="form.projectId"><option [ngValue]="null">None</option><option *ngFor="let project of projects" [ngValue]="project.id">{{project.name}}</option></select></label>
            <label>Sales executive<select name="assignedToId" [(ngModel)]="form.assignedToId"><option [ngValue]="null">Unassigned</option><option *ngFor="let sales of salesExecutives" [ngValue]="sales.id">{{sales.fullName}}</option></select></label>
            <label>Status<select name="status" [(ngModel)]="form.status"><option *ngFor="let status of statusOptions" [ngValue]="status.value">{{status.label}}</option></select></label>
            <label>Lead source<select name="source" [(ngModel)]="form.source"><option [ngValue]="11">Company</option><option [ngValue]="12">Self</option><option [ngValue]="5">Referral</option></select></label>
            <ng-container *ngIf="form.source===5">
              <label>Referrer name<input name="referrerName" [(ngModel)]="form.referrerName"></label>
              <label>Referrer phone<input name="referrerPhone" [(ngModel)]="form.referrerPhone"></label>
              <label class="full">Referrer email<input name="referrerEmail" type="email" [(ngModel)]="form.referrerEmail"></label>
            </ng-container>
            <label class="full">Remarks<textarea name="remarks" rows="4" [(ngModel)]="form.remarks"></textarea></label>
          </div>
          <p class="error" *ngIf="saveError">{{saveError}}</p>
          <div class="form-actions"><span>Created {{lead.createdAt|date:'medium'}}</span><button type="submit" [disabled]="saving">{{saving?'Saving…':'Save Changes'}}</button></div>
        </form>

        <article class="panel journey-panel">
          <div class="section-head"><div><p class="eyebrow">Activity journey</p><h2>Lead Timeline</h2><p>Every salesperson submission appears as a checkpoint.</p></div><span class="journey-count">{{timeline.length}} updates</span></div>
          <div class="journey-summary"><div><span>Started</span><strong>{{lead.createdAt|date:'dd MMM yyyy'}}</strong></div><div><span>Latest activity</span><strong>{{latestActivity ? (latestActivity.createdAt|date:'dd MMM, h:mm a') : 'No update yet'}}</strong></div></div>
          <div class="journey" *ngIf="timeline.length; else emptyJourney">
            <div class="journey-step" *ngFor="let item of timeline; let last=last" [class.last]="last">
              <div class="rail"><span class="point" [class.visit]="item.type===5 || item.resultingStatus===5 || item.resultingStatus===6">{{item.type===5 || item.resultingStatus===5 || item.resultingStatus===6?'⌖':'✓'}}</span><i></i></div>
              <div class="step-card">
                <div class="step-head"><span class="activity-type">{{activityLabel(item)}}</span><time>{{item.createdAt|date:'dd MMM yyyy, h:mm a'}}</time></div>
                <p>{{item.summary}}</p>
                <div class="step-meta"><span>By {{item.salesExecutive}}</span><span *ngIf="item.nextFollowUpAt">Next: {{item.nextFollowUpAt|date:'dd MMM, h:mm a'}}</span><span *ngIf="item.proofs.length">{{item.proofs.length}} proof file{{item.proofs.length===1?'':'s'}}</span></div>
              </div>
            </div>
          </div>
          <ng-template #emptyJourney><div class="empty-journey"><span>○</span><strong>No follow-up submitted yet</strong><p>The first salesperson update will start this lead journey.</p></div></ng-template>
          <div class="current-stage"><span class="finish-point">★</span><div><small>Current pipeline stage</small><strong>{{statusLabel(lead.status)}}</strong></div></div>
        </article>
      </section>
    </ng-container>
  `,
  styles: [`
    .back-link{display:inline-flex;align-items:center;text-decoration:none}.loading{padding:40px;text-align:center;color:var(--muted)}.profile-hero{padding:24px;margin-bottom:20px;border-radius:18px;background:linear-gradient(125deg,#0f172a,#134e4a);color:white;display:flex;justify-content:space-between;align-items:center;gap:24px;box-shadow:0 16px 34px rgba(15,23,42,.18)}.identity{display:flex;align-items:center;gap:16px}.avatar{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#2dd4bf,#0f766e);font-size:22px;font-weight:900}.source-badge{display:inline-block;padding:4px 8px;margin-bottom:6px;border-radius:99px;background:rgba(255,255,255,.12);color:#99f6e4;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px}.identity h2{margin:0 0 4px;font-size:25px;color:white}.identity p{margin:0;color:#cbd5e1}.hero-facts{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:10px}.hero-facts div{padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.06)}.hero-facts span,.hero-facts strong{display:block}.hero-facts span{font-size:10px;color:#94a3b8;margin-bottom:4px;text-transform:uppercase}.hero-facts strong{font-size:13px;color:white}.profile-layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(380px,.95fr);gap:20px;align-items:start}.editor,.journey-panel{padding:22px}.section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:20px}.section-head h2{margin:2px 0 0}.section-head p:not(.eyebrow){margin:5px 0 0;color:var(--muted);font-size:12px}.saved{padding:6px 10px;border-radius:99px;background:#ecfdf3;color:#047857;font-size:11px;font-weight:800}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-grid .full{grid-column:1/-1}.form-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:20px;padding-top:16px;border-top:1px solid var(--line)}.form-actions span{font-size:11px;color:var(--muted)}.journey-count{white-space:nowrap;padding:6px 10px;border-radius:99px;background:#e8f5f3;color:#0f766e;font-size:11px;font-weight:800}.journey-summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:22px}.journey-summary div{padding:12px;border-radius:10px;background:#f8fafc;border:1px solid var(--line)}.journey-summary span,.journey-summary strong{display:block}.journey-summary span{font-size:10px;color:var(--muted);margin-bottom:4px}.journey-summary strong{font-size:12px}.journey-step{display:grid;grid-template-columns:34px 1fr;gap:10px}.rail{display:flex;align-items:center;flex-direction:column}.point{position:relative;z-index:1;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#0f766e;color:white;font-size:12px;font-weight:900;box-shadow:0 0 0 5px #e8f5f3}.point.visit{background:#7c3aed;box-shadow:0 0 0 5px #f3e8ff}.rail i{width:2px;flex:1;min-height:32px;background:#cbd5e1}.journey-step.last .rail i{background:linear-gradient(#cbd5e1,transparent)}.step-card{padding:0 0 22px}.step-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.activity-type{font-size:12px;font-weight:900;color:#0f766e}.step-head time{font-size:10px;color:var(--muted)}.step-card p{margin:7px 0;padding:11px;border-radius:9px;background:#f8fafc;color:#334155;font-size:13px;line-height:1.45}.step-meta{display:flex;gap:8px;flex-wrap:wrap}.step-meta span{padding:3px 7px;border-radius:5px;background:#f1f5f9;color:#64748b;font-size:10px;font-weight:700}.current-stage{display:flex;align-items:center;gap:12px;margin-left:2px;padding:12px;border-radius:12px;background:#fffbeb;border:1px solid #fde68a}.finish-point{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#f59e0b;color:white}.current-stage small,.current-stage strong{display:block}.current-stage small{font-size:10px;color:#92400e}.current-stage strong{color:#78350f}.empty-journey{text-align:center;padding:34px 10px;color:var(--muted)}.empty-journey>span{display:block;font-size:34px}.empty-journey strong{display:block;color:#334155;margin:7px}.empty-journey p{margin:0;font-size:12px}@media(max-width:1100px){.profile-hero{align-items:flex-start;flex-direction:column}.hero-facts{width:100%}.profile-layout{grid-template-columns:1fr}}@media(max-width:680px){.hero-facts{grid-template-columns:1fr 1fr}.form-grid{grid-template-columns:1fr}.form-grid .full{grid-column:auto}.profile-hero{padding:18px}.identity{align-items:flex-start}.avatar{width:52px;height:52px}.step-head{align-items:flex-start;flex-direction:column}.journey-summary{grid-template-columns:1fr}}
  `]
})
export class LeadProfileComponent implements OnInit {
  private api=inject(ApiService);private route=inject(ActivatedRoute);
  lead?:Lead;timeline:FollowUp[]=[];salesExecutives:SalesExecutive[]=[];projects:Project[]=[];form:any={};loading=true;saving=false;error='';saveError='';message='';
  statusOptions=leadStatus.map((label,value)=>({label,value}));
  get latestActivity(){return this.timeline.length?this.timeline[this.timeline.length-1]:undefined}
  ngOnInit(){const id=Number(this.route.snapshot.paramMap.get('id'));forkJoin([this.api.leads(),this.api.followUps(),this.api.salesExecutives(),this.api.projects()]).subscribe({next:([leads,followUps,sales,projects])=>{this.lead=leads.find(item=>item.id===id);if(!this.lead){this.error='Lead not found.';this.loading=false;return}this.timeline=followUps.filter(item=>item.leadId===id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));this.salesExecutives=sales;this.projects=projects;this.fillForm();this.loading=false},error:err=>{this.error=err.error?.message||'Could not load the lead profile.';this.loading=false}})}
  fillForm(){if(!this.lead)return;this.form={customerName:this.lead.customerName,phone:this.lead.phone,alternativePhone:this.lead.alternativePhone??null,email:this.lead.email??null,address:this.lead.address??null,preferredLocation:this.lead.preferredLocation??null,budgetRange:this.lead.budgetRange??null,projectId:this.lead.projectId??null,assignedToId:this.lead.assignedToId??null,status:this.lead.status,source:this.lead.source,referrerName:this.lead.referrerName??null,referrerPhone:this.lead.referrerPhone??null,referrerEmail:this.lead.referrerEmail??null,remarks:this.lead.remarks??null}}
  save(){if(!this.lead)return;if(this.form.assignedToId&&this.form.status===0)this.form.status=1;this.saving=true;this.saveError='';this.message='';this.api.updateLead(this.lead.id,this.form).subscribe({next:()=>{this.saving=false;this.message='Lead profile saved.';Object.assign(this.lead!,this.form);this.lead!.assignedToName=this.salesExecutives.find(x=>x.id===this.form.assignedToId)?.fullName;this.lead!.projectName=this.projects.find(x=>x.id===this.form.projectId)?.name},error:err=>{this.saving=false;this.saveError=err.error?.message||'Could not update this lead.'}})}
  initials(name:string){return name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
  statusLabel(value:number){return leadStatus[value]??'Unknown'}
  followUpLabel(value:number){return followUpTypes[value]??'Follow-up'}
  activityLabel(item:FollowUp){return item.resultingStatus!==null&&item.resultingStatus!==undefined&&item.resultingStatus>=4?this.statusLabel(item.resultingStatus):this.followUpLabel(item.type)}
  sourceLabel(value:number){return value===12?'Self':value===5?'Referral':'Company'}
}
