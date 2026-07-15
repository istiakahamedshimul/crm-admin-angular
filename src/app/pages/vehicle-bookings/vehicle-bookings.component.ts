import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { VehicleBooking } from '../../models/crm.models';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-head">
      <div><p class="eyebrow">Transport</p><h1>Vehicle Visit Bookings</h1></div>
      <button type="button" class="ghost-button" (click)="load()">Refresh</button>
    </section>

    <article class="panel table-panel">
      <table>
        <thead><tr><th>Visit Date</th><th>Sales Employee</th><th>Persons</th><th>Pickup</th><th>Visit Place</th><th>Status</th><th>Remarks</th><th>Action</th></tr></thead>
        <tbody>
          <tr *ngFor="let booking of bookings">
            <td>{{ booking.visitDate | date:'dd MMM yyyy' }}</td>
            <td>{{ booking.salesExecutive }}</td>
            <td>{{ booking.personCount }}</td>
            <td>{{ booking.pickupPlace }}</td>
            <td>{{ booking.visitPlace }}</td>
            <td><span class="badge">{{ statuses[booking.status] }}</span></td>
            <td>{{ booking.adminRemarks || '-' }}</td>
            <td class="actions">
              <button type="button" (click)="approve(booking.id)" [disabled]="booking.status !== 0">Approve</button>
              <button type="button" class="danger" (click)="reject(booking.id)" [disabled]="booking.status !== 0">Reject</button>
            </td>
          </tr>
          <tr *ngIf="bookings.length === 0"><td colspan="8" class="empty-table">No vehicle booking requests.</td></tr>
        </tbody>
      </table>
    </article>
  `
})
export class VehicleBookingsComponent implements OnInit {
  private api = inject(ApiService);
  bookings: VehicleBooking[] = [];
  statuses = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

  ngOnInit() { this.load(); }
  load() { this.api.vehicleBookings().subscribe(data => this.bookings = data); }
  approve(id: number) {
    const remarks = prompt('Approval remarks (optional)') || undefined;
    this.api.approveVehicleBooking(id, remarks).subscribe(() => this.load());
  }
  reject(id: number) {
    const remarks = prompt('Reason for rejection');
    if (remarks?.trim()) this.api.rejectVehicleBooking(id, remarks.trim()).subscribe(() => this.load());
  }
}
