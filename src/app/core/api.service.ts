import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {
  AuthResponse,
  Commission,
  CreateCustomerRequest,
  CreateLeadRequest,
  CreateProjectRequest,
  CreateSubGroupRequest,
  CreateSalesExecutiveRequest,
  Customer,
  DashboardSummary,
  FollowUp,
  Invoice,
  Lead,
  Payment,
  Project,
  ReportSummary,
  SalesExecutive,
  SubGroup,
  UserSummary,
  VehicleBooking, Vehicle
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

  dashboard() {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/dashboard`, this.options());
  }

  users() {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/users`, this.options());
  }

  createSalesExecutive(request: CreateSalesExecutiveRequest) {
    return this.http.post(`${this.baseUrl}/users/sales-executives`, request, this.options());
  }

  salesExecutives() {
    return this.http.get<SalesExecutive[]>(`${this.baseUrl}/sales-executives`, this.options());
  }

  leads() {
    return this.http.get<Lead[]>(`${this.baseUrl}/leads`, this.options());
  }

  followUps() {
    return this.http.get<FollowUp[]>(`${this.baseUrl}/followups`, this.options());
  }

  createLead(request: CreateLeadRequest) {
    return this.http.post(`${this.baseUrl}/leads`, request, this.options());
  }

  updateLead(id: number, request: Partial<CreateLeadRequest> & Record<string, unknown>) {
    return this.http.put(`${this.baseUrl}/leads/${id}`, request, this.options());
  }

  customers() {
    return this.http.get<Customer[]>(`${this.baseUrl}/customers`, this.options());
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

  invoices() {
    return this.http.get<Invoice[]>(`${this.baseUrl}/invoices`, this.options());
  }

  payments() {
    return this.http.get<Payment[]>(`${this.baseUrl}/payments`, this.options());
  }

  approvePayment(id: number) {
    return this.http.post(`${this.baseUrl}/payments/${id}/approve`, {}, this.options());
  }

  rejectPayment(id: number, reason: string) {
    return this.http.post(`${this.baseUrl}/payments/${id}/reject`, { reason }, this.options());
  }

  commissions() {
    return this.http.get<Commission[]>(`${this.baseUrl}/commissions`, this.options());
  }

  reports() {
    return this.http.get<ReportSummary>(`${this.baseUrl}/reports/basic`, this.options());
  }

  vehicleBookings() {
    return this.http.get<VehicleBooking[]>(`${this.baseUrl}/vehicle-bookings`, this.options());
  }

  approveVehicleBooking(id: number, vehicleId: number, driver?: string, remarks?: string) {
    return this.http.post(`${this.baseUrl}/vehicle-bookings/${id}/approve`, { vehicleId, driver, remarks }, this.options());
  }

  rejectVehicleBooking(id: number, remarks: string) {
    return this.http.post(`${this.baseUrl}/vehicle-bookings/${id}/reject`, { remarks }, this.options());
  }
  vehicles() { return this.http.get<Vehicle[]>(`${this.baseUrl}/vehicles`, this.options()); }
  createVehicle(request: Omit<Vehicle, 'id'>) { return this.http.post(`${this.baseUrl}/vehicles`, request, this.options()); }
  updateVehicle(id: number, request: Omit<Vehicle, 'id'>) { return this.http.put(`${this.baseUrl}/vehicles/${id}`, request, this.options()); }
  setVehicleStatus(id: number, isActive: boolean) { return this.http.patch(`${this.baseUrl}/vehicles/${id}/status`, isActive, this.options()); }
  createAdminVisit(request: Record<string, unknown>) { return this.http.post(`${this.baseUrl}/vehicle-bookings/admin`, request, this.options()); }
}
