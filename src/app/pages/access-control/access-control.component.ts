import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-bottom:20px}
    .panel h2{margin-top:0}.permissions{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:12px}
    .permission{display:inline-flex;align-items:center;gap:7px;font-size:13px}.assignment{padding:18px 0;border-bottom:1px solid var(--line)}
    .assignment:last-child{border-bottom:0}.meta{color:var(--muted);font-size:13px;margin-top:3px}.success{color:#16834a}
  `],
  template: `
    <section class="page-head"><div><p class="eyebrow">Super Admin</p><h1>Users, roles & permissions</h1><p>Create admin accounts and precisely control role or individual access.</p></div></section>
    <p class="success" *ngIf="message">{{message}}</p><p class="error">{{error}}</p>

    <div class="grid">
      <form class="panel" (ngSubmit)="addUser()">
        <h2>Create admin account</h2>
        <label>Full name<input name="un" [(ngModel)]="user.fullName" required></label>
        <label>Email<input name="ue" type="email" [(ngModel)]="user.email" required></label>
        <label>Phone<input name="up" [(ngModel)]="user.phone" required></label>
        <label>Role<select name="ur" [(ngModel)]="user.role" required><option value="" disabled>Select role</option><option *ngFor="let r of assignableRoles" [value]="r.name">{{r.name}}</option></select></label>
        <label>Temporary password<input name="uw" type="password" [(ngModel)]="user.password" required minlength="8"></label>
        <button [disabled]="saving">Create account</button>
      </form>
      <form class="panel" (ngSubmit)="addRole()"><h2>Create role</h2><label>Name<input name="rn" [(ngModel)]="role.name" required></label><label>Department<input name="rd" [(ngModel)]="role.department"></label><button [disabled]="saving">Create role</button></form>
      <form class="panel" (ngSubmit)="addGroup()"><h2>Create permission group</h2><label>Name<input name="gn" [(ngModel)]="group.name" required></label><label>Description<input name="gd" [(ngModel)]="group.description"></label><button [disabled]="saving">Create group</button></form>
      <form class="panel" (ngSubmit)="addPermission()"><h2>Create permission</h2><label>Group<select name="pg" [(ngModel)]="permission.groupId" required><option *ngFor="let g of data?.groups" [ngValue]="g.id">{{g.name}}</option></select></label><label>Code<input name="pc" [(ngModel)]="permission.code" placeholder="module.action" required></label><label>Name<input name="pn" [(ngModel)]="permission.name" required></label><button [disabled]="saving">Create permission</button></form>
    </div>

    <article class="panel"><h2>Role permission assignments</h2><div class="assignment" *ngFor="let r of data?.roles"><strong>{{r.name}}</strong><div class="meta">{{r.department || 'No department label'}}</div><div class="permissions"><label class="permission" *ngFor="let p of permissions"><input type="checkbox" [checked]="r.permissionIds.includes(p.id)" (change)="toggleRole(r,p.id,$any($event.target).checked)">{{p.code}}</label></div></div></article>
    <article class="panel" style="margin-top:20px"><h2>Individual user permissions</h2><p class="meta">These are additional permissions granted directly to a user.</p><div class="assignment" *ngFor="let u of data?.users"><strong>{{u.fullName}}</strong><div class="meta">{{u.email}} · {{u.roleName}}</div><div class="permissions"><label class="permission" *ngFor="let p of permissions"><input type="checkbox" [checked]="u.permissionIds.includes(p.id)" (change)="toggleUser(u,p.id,$any($event.target).checked)">{{p.code}}</label></div></div></article>
  `
})
export class AccessControlComponent {
  private api = inject(ApiService);
  data: any; saving = false; error = ''; message = '';
  user: any = { fullName: '', email: '', phone: '', role: '', password: '' };
  role: any = { name: '', department: '' };
  group: any = { name: '', description: '' };
  permission: any = { code: '', name: '', groupId: null };
  constructor(){ this.load(); }
  get permissions(){ return (this.data?.groups ?? []).flatMap((x:any) => x.permissions); }
  get assignableRoles(){ return (this.data?.roles ?? []).filter((x:any) => x.isActive && x.name !== 'Customer'); }
  load(){ this.api.accessControl().subscribe({next:x=>this.data=x,error:e=>this.fail(e)}); }
  addUser(){ this.run(this.api.createAdminUser(this.user), 'Admin account created.', ()=>this.user={fullName:'',email:'',phone:'',role:'',password:''}); }
  addRole(){ this.run(this.api.createRole(this.role), 'Role created.', ()=>this.role={name:'',department:''}); }
  addGroup(){ this.run(this.api.createPermissionGroup(this.group), 'Permission group created.', ()=>this.group={name:'',description:''}); }
  addPermission(){ this.run(this.api.createPermission(this.permission), 'Permission created.', ()=>this.permission={code:'',name:'',groupId:null}); }
  toggleRole(r:any,id:number,on:boolean){ const ids=on?[...r.permissionIds,id]:r.permissionIds.filter((x:number)=>x!==id); this.run(this.api.setRolePermissions(r.id,ids),'Role permissions updated.'); }
  toggleUser(u:any,id:number,on:boolean){ const ids=on?[...u.permissionIds,id]:u.permissionIds.filter((x:number)=>x!==id); this.run(this.api.setUserPermissions(u.id,ids),'User permissions updated.'); }
  private run(request:any,message:string,reset?:()=>void){ this.saving=true;this.error='';this.message='';request.subscribe({next:()=>{this.saving=false;this.message=message;reset?.();this.load()},error:(e:any)=>{this.saving=false;this.fail(e)}}); }
  private fail(e:any){ this.error=e.error?.message ?? 'The request could not be completed.'; }
}
