import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { LeadsComponent } from './pages/leads/leads.component';
import { FollowupsComponent } from './pages/followups/followups.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { ProjectsComponent } from './pages/properties/projects/projects.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { CommissionsComponent } from './pages/commissions/commissions.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { VehicleBookingsComponent } from './pages/vehicle-bookings/vehicle-bookings.component';
import { ScheduleVisitComponent } from './pages/vehicle-bookings/schedule-visit.component';
import { VehiclesComponent } from './pages/vehicle-bookings/vehicles.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'users', component: UsersComponent, canActivate: [authGuard] },
  { path: 'leads', component: LeadsComponent, canActivate: [authGuard] },
  { path: 'followups', component: FollowupsComponent, canActivate: [authGuard] },
  { path: 'customers', component: CustomersComponent, canActivate: [authGuard] },
 
    {
        path: 'properties/projects',
        component: ProjectsComponent,
        canActivate: [authGuard]
    },
  { path: 'invoices', component: InvoicesComponent, canActivate: [authGuard] },
  { path: 'payments', component: PaymentsComponent, canActivate: [authGuard] },
  { path: 'commissions', component: CommissionsComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: 'vehicle-bookings', redirectTo: 'transport/requests', pathMatch: 'full' },
  { path: 'transport/requests', component: VehicleBookingsComponent, canActivate: [authGuard] },
  { path: 'transport/schedule', component: ScheduleVisitComponent, canActivate: [authGuard] },
  { path: 'transport/vehicles', component: VehiclesComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
