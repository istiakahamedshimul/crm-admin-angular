import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

@Component({
  standalone:true,imports:[CommonModule,FormsModule],
  styles:[`.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-bottom:20px}.panel h2{margin-top:0}.permissions{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:12px}.permission{display:inline-flex;align-items:center;gap:7px;font-size:13px}.permission input{width:auto}.assignment{padding:18px 0;border-bottom:1px solid var(--line)}.assignment:last-child{border-bottom:0}.meta{color:var(--muted);font-size:13px;margin-top:3px}.success{color:#16834a}`],
  template:`
    <section class="page-head"><div><p class="eyebrow">Super Admin</p><h1>Roles & permissions</h1><p>Configure permission groups and role access. Department accounts are managed separately under Admin Users.</p></div></section>
    <p class="success" *ngIf="message">{{message}}</p><p class="error">{{error}}</p>
    <div class="grid"><form class="panel" (ngSubmit)="addRole()"><h2>Create role</h2><label>Name<input name="rn" [(ngModel)]="role.name" required></label><label>Department<input name="rd" [(ngModel)]="role.department"></label><button [disabled]="saving">Create role</button></form><form class="panel" (ngSubmit)="addGroup()"><h2>Create permission group</h2><label>Name<input name="gn" [(ngModel)]="group.name" required></label><label>Description<input name="gd" [(ngModel)]="group.description"></label><button [disabled]="saving">Create group</button></form><form class="panel" (ngSubmit)="addPermission()"><h2>Create permission</h2><label>Group<select name="pg" [(ngModel)]="permission.groupId" required><option *ngFor="let g of data?.groups" [ngValue]="g.id">{{g.name}}</option></select></label><label>Code<input name="pc" [(ngModel)]="permission.code" placeholder="module.action" required></label><label>Name<input name="pn" [(ngModel)]="permission.name" required></label><button [disabled]="saving">Create permission</button></form></div>
    <article class="panel"><h2>Role permission assignments</h2><div class="assignment" *ngFor="let r of data?.roles"><strong>{{r.name}}</strong><div class="meta">{{r.department || 'No department label'}}</div><div class="permissions"><label class="permission" *ngFor="let p of permissions"><input type="checkbox" [checked]="r.permissionIds.includes(p.id)" (change)="toggleRole(r,p.id,$any($event.target).checked)">{{p.code}}</label></div></div></article>
  `
})
export class RolePermissionsComponent{
  private api=inject(ApiService);data:any;saving=false;error='';message='';role:any={name:'',department:''};group:any={name:'',description:''};permission:any={code:'',name:'',groupId:null};
  constructor(){this.load()}get permissions(){return(this.data?.groups??[]).flatMap((x:any)=>x.permissions)}
  load(){this.api.accessControl().subscribe({next:x=>this.data=x,error:e=>this.fail(e)})}
  addRole(){this.run(this.api.createRole(this.role),'Role created.',()=>this.role={name:'',department:''})}addGroup(){this.run(this.api.createPermissionGroup(this.group),'Permission group created.',()=>this.group={name:'',description:''})}addPermission(){this.run(this.api.createPermission(this.permission),'Permission created.',()=>this.permission={code:'',name:'',groupId:null})}
  toggleRole(r:any,id:number,on:boolean){const ids=on?[...r.permissionIds,id]:r.permissionIds.filter((x:number)=>x!==id);this.run(this.api.setRolePermissions(r.id,ids),'Role permissions updated.')}
  private run(request:any,message:string,reset?:()=>void){this.saving=true;this.error='';this.message='';request.subscribe({next:()=>{this.saving=false;this.message=message;reset?.();this.load()},error:(e:any)=>{this.saving=false;this.fail(e)}})}private fail(e:any){this.error=e.error?.message??'The request could not be completed.'}
}
