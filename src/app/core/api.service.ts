import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {
  AuthResponse,
  AvailableLeadCustomer,
  Commission,
  CreateCustomerRequest,
  CreateLeadRequest,
  CreateProjectRequest,
  CreateSubGroupRequest,
  CreateSalesExecutiveRequest,
  Customer,
  DashboardSummary,
  FollowUp,
  Lead,
  LeadAutomationSettings,
  Payment,
  Project,
  ReportSummary,
  ReturnedLead,
  SalesExecutive,
  SalesExecutiveDetail,
  SalesPerformanceReport,
  SubGroup,
  UserSummary, UpdateSalesExecutiveRequest,
  VehicleBooking, Vehicle, LiveEmployeeLocation, TravelHistory
} from '../models/crm.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = environment.apiBaseUrl;

  private options() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.auth.token()}`
      })
    };
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { email, password });
  }

  dashboard(from?:string,to?:string) {
    const query=from&&to?`?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`:'';
    return this.http.get<DashboardSummary>(`${this.baseUrl}/dashboard${query}`, this.options());
  }

  users() {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/users`, this.options());
  }

  createSalesExecutive(request: CreateSalesExecutiveRequest) {
    return this.http.post(`${this.baseUrl}/users/sales-executives`, request, this.options());
  }

  salesExecutiveDetail(id: number) {
    return this.http.get<SalesExecutiveDetail>(`${this.baseUrl}/users/sales-executives/${id}`, this.options());
  }

  salesPerformanceReport(id: number, from: string, to: string) {
    const params = new URLSearchParams({ salesExecutiveId: String(id), from, to });
    return this.http.get<SalesPerformanceReport>(`${this.baseUrl}/dashboard/sales-report?${params}`, this.options());
  }

  updateSalesExecutive(id: number, request: UpdateSalesExecutiveRequest) {
    return this.http.put(`${this.baseUrl}/users/sales-executives/${id}`, request, this.options());
  }

  salesExecutives() {
    return this.http.get<SalesExecutive[]>(`${this.baseUrl}/sales-executives`, this.options());
  }

  leads() {
    return this.http.get<Lead[]>(`${this.baseUrl}/leads`, this.options());
  }

  returnedLeads() {
    return this.http.get<ReturnedLead[]>(`${this.baseUrl}/leads/returned`, this.options());
  }

  followUps() {
    return this.http.get<FollowUp[]>(`${this.baseUrl}/followups`, this.options());
  }

  proofUrl(fileUrl: string) {
    if (!fileUrl) return '';
    try {
      const path = new URL(fileUrl, window.location.origin).pathname;
      return `${new URL(this.baseUrl).origin}${path}`;
    } catch {
      return fileUrl;
    }
  }

  createLead(request: CreateLeadRequest) {
    return this.http.post(`${this.baseUrl}/leads`, request, this.options());
  }

  importLeads(file: File, autoAssign: boolean) {
    const body = new FormData();
    body.append('file', file);
    body.append('autoAssign', String(autoAssign));
    return this.http.post<{ imported: number; skipped: unknown[] }>(`${this.baseUrl}/leads/import`, body, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.token()}` })
    });
  }

  leadImportTemplateUrl() { return `${this.baseUrl}/leads/import-template`; }

  updateLead(id: number, request: Partial<CreateLeadRequest> & Record<string, unknown>) {
    return this.http.put(`${this.baseUrl}/leads/${id}`, request, this.options());
  }

  leadAutomationSettings() {
    return this.http.get<LeadAutomationSettings>(`${this.baseUrl}/lead-automation-settings`, this.options());
  }

  updateLeadAutomationSettings(request: LeadAutomationSettings) {
    return this.http.put<LeadAutomationSettings>(`${this.baseUrl}/lead-automation-settings`, request, this.options());
  }

  customers() {
    return this.http.get<Customer[]>(`${this.baseUrl}/customers`, this.options());
  }

  customersAvailableForLead() {
    return this.http.get<AvailableLeadCustomer[]>(`${this.baseUrl}/customers/available-for-lead`, this.options());
  }

  createCustomer(request: CreateCustomerRequest) {
    return this.http.post(`${this.baseUrl}/customers`, request, this.options());
  }

  projects() {
    return this.http.get<Project[]>(`${this.baseUrl}/projects`, this.options());
  }

  createProject(request: CreateProjectRequest) {
    return this.http.post(`${this.baseUrl}/projects`, request, this.options());
  }

  subGroups() {
    return this.http.get<SubGroup[]>(`${this.baseUrl}/subgroups`, this.options());
  }

  createSubGroup(request: CreateSubGroupRequest) {
    return this.http.post(`${this.baseUrl}/subgroups`, request, this.options());
  }

  payments() {
    return this.http.get<{items: Payment[]}>(`${this.baseUrl}/payments`, this.options()).pipe(map(x => x.items));
  }

  approvePayment(id: number) {
    return this.http.post(`${this.baseUrl}/payments/${id}/approve`, {}, this.options());
  }

  rejectPayment(id: number, reason: string) {
    return this.http.post(`${this.baseUrl}/payments/${id}/reject`, { reason }, this.options());
  }
  reversePayment(id: number, reason: string) { return this.http.post(`${this.baseUrl}/payments/${id}/reverse`, { reason }, this.options()); }

  financialSummary(customerId:number){return this.http.get<any>(`${this.baseUrl}/customers/${customerId}/financial/summary`,this.options());}
  financialHistory(customerId:number){return this.http.get<any>(`${this.baseUrl}/customers/${customerId}/financial/history`,this.options());}
  saveAgreement(customerId:number,request:any){return this.http.put(`${this.baseUrl}/customers/${customerId}/financial/agreement`,request,this.options());}
  setFileId(customerId:number,fileId:string){return this.http.put(`${this.baseUrl}/customers/${customerId}/file-id`,{fileId},this.options());}
  recordPayment(request:any,idempotencyKey:string){return this.http.post(`${this.baseUrl}/payments`,request,{headers:new HttpHeaders({Authorization:`Bearer ${this.auth.token()}`,'Idempotency-Key':idempotencyKey})});}
  accessControl(){return this.http.get<any>(`${this.baseUrl}/access-control`,this.options());}
  createRole(request:any){return this.http.post(`${this.baseUrl}/access-control/roles`,request,this.options());}
  createPermissionGroup(request:any){return this.http.post(`${this.baseUrl}/access-control/groups`,request,this.options());}
  createPermission(request:any){return this.http.post(`${this.baseUrl}/access-control/permissions`,request,this.options());}
  setRolePermissions(id:number,ids:number[]){return this.http.put(`${this.baseUrl}/access-control/roles/${id}/permissions`,{ids},this.options());}
  setUserPermissions(id:number,ids:number[]){return this.http.put(`${this.baseUrl}/access-control/users/${id}/permissions`,{ids},this.options());}
  createAdminUser(request:any){return this.http.post(`${this.baseUrl}/users`,request,this.options());}
  adminAccounts(){return this.http.get<any[]>(`${this.baseUrl}/users/admin-accounts`,this.options());}
  updateAdminUser(id:number,request:any){return this.http.put(`${this.baseUrl}/users/${id}`,request,this.options());}
  adminNotifications(){return this.http.get<any>(`${this.baseUrl}/notifications/admin`,this.options());}
  notificationSettings(){return this.http.get<any>(`${this.baseUrl}/notification-settings`,this.options());}
  saveNotificationSettings(request:any){return this.http.put(`${this.baseUrl}/notification-settings`,request,this.options());}

  commissions() {
    return this.http.get<Commission[]>(`${this.baseUrl}/commissions`, this.options());
  }

  reports() {
    return this.http.get<ReportSummary>(`${this.baseUrl}/reports/basic`, this.options());
  }
  dailyWorkReports(from:string,to:string,salesExecutiveId?:number|null){const params=new URLSearchParams({from,to});if(salesExecutiveId)params.set('salesExecutiveId',String(salesExecutiveId));return this.http.get<any>(`${this.baseUrl}/daily-work-reports?${params}`,this.options());}

  vehicleBookings() {
    return this.http.get<VehicleBooking[]>(`${this.baseUrl}/vehicle-bookings`, this.options());
  }

  approveVehicleBooking(id: number, vehicleId: number, driver?: string, driverPhone?: string, remarks?: string) {
    return this.http.post(`${this.baseUrl}/vehicle-bookings/${id}/approve`, { vehicleId, driver, driverPhone, remarks }, this.options());
  }

  rejectVehicleBooking(id: number, remarks: string) {
    return this.http.post(`${this.baseUrl}/vehicle-bookings/${id}/reject`, { remarks }, this.options());
  }
  vehicles() { return this.http.get<Vehicle[]>(`${this.baseUrl}/vehicles`, this.options()); }
  createVehicle(request: Omit<Vehicle, 'id'>) { return this.http.post(`${this.baseUrl}/vehicles`, request, this.options()); }
  updateVehicle(id: number, request: Omit<Vehicle, 'id'>) { return this.http.put(`${this.baseUrl}/vehicles/${id}`, request, this.options()); }
  setVehicleStatus(id: number, isActive: boolean) { return this.http.patch(`${this.baseUrl}/vehicles/${id}/status`, isActive, this.options()); }
  createAdminVisit(request: Record<string, unknown>) { return this.http.post(`${this.baseUrl}/vehicle-bookings/admin`, request, this.options()); }
  liveLocations() { return this.http.get<LiveEmployeeLocation[]>(`${this.baseUrl}/locations/live`, this.options()); }
  travelHistory(employeeId: number, date: string) {
    const offset = -new Date().getTimezoneOffset();
    return this.http.get<TravelHistory>(`${this.baseUrl}/locations/history/${employeeId}?date=${date}&timezoneOffsetMinutes=${offset}`, this.options());
  }
}
