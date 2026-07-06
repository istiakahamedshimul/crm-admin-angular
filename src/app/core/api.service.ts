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
  CreateSalesExecutiveRequest,
  CreateUnitRequest,
  Customer,
  DashboardSummary,
  FollowUp,
  Invoice,
  Lead,
  Payment,
  Project,
  ReportSummary,
  SalesExecutive,
  Unit,
  UserSummary
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

  units(projectId?: number) {
    const suffix = projectId ? `?projectId=${projectId}` : '';
    return this.http.get<Unit[]>(`${this.baseUrl}/units${suffix}`, this.options());
  }

  createUnit(request: CreateUnitRequest) {
    return this.http.post(`${this.baseUrl}/units`, request, this.options());
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
}
