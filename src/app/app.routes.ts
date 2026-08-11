import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { SalesExecutiveProfileComponent } from './pages/users/sales-executive-profile.component';
import { LeadsComponent } from './pages/leads/leads.component';
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
import { AccessControlComponent } from './pages/access-control/access-control.component';
import { CustomerFinancialsComponent } from './pages/financials/customer-financials.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'users', component: UsersComponent, canActivate: [authGuard] },
  { path: 'users/:id', component: SalesExecutiveProfileComponent, canActivate: [authGuard] },
  { path: 'leads', component: LeadsComponent, canActivate: [authGuard] },
  { path: 'followups', component: FollowupsComponent, canActivate: [authGuard] },
  { path: 'customers', component: CustomersComponent, canActivate: [authGuard] },
  { path: 'financials', component: CustomerFinancialsComponent, canActivate: [authGuard,roleGuard], data:{roles:['SuperAdmin','Admin','CS','CA']} },
  { path: 'access-control', component: AccessControlComponent, canActivate: [authGuard,roleGuard], data:{roles:['SuperAdmin']} },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard,roleGuard], data:{roles:['SuperAdmin','Admin']} },
 
    {
        path: 'properties/projects',
        component: ProjectsComponent,
        canActivate: [authGuard]
    },
  { path: 'payments', component: PaymentsComponent, canActivate: [authGuard,roleGuard], data:{roles:['SuperAdmin','Admin','CA']} },
  { path: 'payments/record', component: RecordPaymentComponent, canActivate: [authGuard,roleGuard], data:{roles:['SuperAdmin','Admin','CA']} },
  { path: 'commissions', component: CommissionsComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: 'employee-locations', component: EmployeeLocationsComponent, canActivate: [authGuard] },
  { path: 'vehicle-bookings', redirectTo: 'transport/requests', pathMatch: 'full' },
  { path: 'transport/requests', component: VehicleBookingsComponent, canActivate: [authGuard] },
  { path: 'transport/schedule', component: ScheduleVisitComponent, canActivate: [authGuard] },
  { path: 'transport/vehicles', component: VehiclesComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
