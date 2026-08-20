import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { SalesExecutiveProfileComponent } from './pages/users/sales-executive-profile.component';
import { LeadsComponent } from './pages/leads/leads.component';
import { LeadProfileComponent } from './pages/leads/lead-profile.component';
import { FollowupsComponent } from './pages/followups/followups.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { ProjectsComponent } from './pages/properties/projects/projects.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { RecordPaymentComponent } from './pages/payments/record-payment.component';
import { CommissionsComponent } from './pages/commissions/commissions.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { VehicleBookingsComponent } from './pages/vehicle-bookings/vehicle-bookings.component';
import { ScheduleVisitComponent } from './pages/vehicle-bookings/schedule-visit.component';
import { VehiclesComponent } from './pages/vehicle-bookings/vehicles.component';
import { EmployeeLocationsComponent } from './pages/employee-locations/employee-locations.component';
import { CustomerFinancialsComponent } from './pages/financials/customer-financials.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { permissionGuard } from './core/permission.guard';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { DailyWorkReportsComponent } from './pages/daily-work-reports/daily-work-reports.component';
import { AccessControlComponent } from './pages/access-control/access-control.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'users', component: UsersComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['users.manage']} },
  { path: 'users/:id', component: SalesExecutiveProfileComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['users.manage','leads.manage']} },
  { path: 'leads', component: LeadsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['leads.manage']} },
  { path: 'leads/:id', component: LeadProfileComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['leads.manage']} },
  { path: 'followups', component: FollowupsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['leads.manage']} },
  { path: 'customers', component: CustomersComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['customers.view']} },
  { path: 'financials', component: CustomerFinancialsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['agreements.manage','payments.view']} },
  { path: 'admin-users', component: AdminUsersComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['users.manage']} },
  { path: 'access-control', component: AccessControlComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['permissions.manage']} },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['notifications.manage']} },
 
    {
        path: 'properties/projects',
        component: ProjectsComponent,
        canActivate: [authGuard,permissionGuard], data:{permissions:['bookings.manage']}
    },
  { path: 'payments/record', component: RecordPaymentComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['payments.record']} },
  { path: 'payments', component: PaymentsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['payments.view']} },
  { path: 'commissions', component: CommissionsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['payments.view']} },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['reports.view']} },
  { path: 'daily-work-reports', component: DailyWorkReportsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['reports.view']} },
  { path: 'employee-locations', component: EmployeeLocationsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['leads.manage']} },
  { path: 'vehicle-bookings', redirectTo: 'transport/requests', pathMatch: 'full' },
  { path: 'transport/requests', component: VehicleBookingsComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['transportation.manage']} },
  { path: 'transport/schedule', component: ScheduleVisitComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['transportation.manage']} },
  { path: 'transport/vehicles', component: VehiclesComponent, canActivate: [authGuard,permissionGuard], data:{permissions:['transportation.manage']} },
  { path: '**', redirectTo: '' }
];
