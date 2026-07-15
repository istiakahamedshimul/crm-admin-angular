import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    standalone: true,
    imports: [CommonModule],
    template: `
<section class="page-head">
    <div>
        <p class="eyebrow">Customer Visit</p>
        <h1>Booking List</h1>
    </div>
</section>

<section class="panel">

    <div class="table-header">
        <div>
            <h2>Scheduled Visits</h2>
            <p>Manage customer visit requests.</p>
        </div>
    </div>

    <table>

        <thead>

            <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Project</th>
                <th>Date</th>
                <th>Time</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Status</th>
            </tr>

        </thead>

        <tbody>

            <tr
                class="clickable-row"
                *ngFor="let booking of bookings"
                (click)="openDetails(booking)">

                <td>#{{ booking.id }}</td>
                <td>{{ booking.customer }}</td>
                <td>{{ booking.project }}</td>
                <td>{{ booking.date }}</td>
                <td>{{ booking.time }}</td>
                <td>{{ booking.vehicle }}</td>
                <td>{{ booking.driver }}</td>

                <td>

                    <span
                        class="status"
                        [ngClass]="{
                            'pending': booking.status=='Pending',
                            'approved': booking.status=='Approved',
                            'declined': booking.status=='Declined'
                        }">

                        {{ booking.status }}

                    </span>

                </td>

            </tr>

        </tbody>

    </table>

</section>

<!-- Details Modal -->

<div
    class="modal-backdrop"
    *ngIf="selectedBooking"
    (click)="closeDetails()">

    <div
        class="visit-modal"
        (click)="$event.stopPropagation()">

        <div class="modal-header">

            <h2>Visit Booking Details</h2>

            <button
                class="close-btn"
                (click)="closeDetails()">

                ✕

            </button>

        </div>

        <div class="details-grid">

            <div><strong>Booking ID</strong></div>
            <div>#{{ selectedBooking.id }}</div>

            <div><strong>Customer</strong></div>
            <div>{{ selectedBooking.customer }}</div>

            <div><strong>Phone Number</strong></div>
            <div>{{ selectedBooking.phone }}</div>

            <div><strong>Number of Visitors</strong></div>
            <div>{{ selectedBooking.visitors }}</div>

            <div><strong>Project</strong></div>
            <div>{{ selectedBooking.project }}</div>

            <div><strong>Visit Date</strong></div>
            <div>{{ selectedBooking.date }}</div>

            <div><strong>Visit Time</strong></div>
            <div>{{ selectedBooking.time }}</div>

            <div><strong>Pickup Location</strong></div>
            <div>{{ selectedBooking.pickup }}</div>

            <div><strong>Destination</strong></div>
            <div>{{ selectedBooking.destination }}</div>

            <div><strong>Vehicle</strong></div>
            <div>{{ selectedBooking.vehicle }}</div>

            <div><strong>Driver</strong></div>
            <div>{{ selectedBooking.driver }}</div>

            <div><strong>Purpose</strong></div>
            <div>{{ selectedBooking.purpose }}</div>

            <div><strong>Status</strong></div>

            <div>

                <span
                    class="status"
                    [ngClass]="{
                        'pending': selectedBooking.status=='Pending',
                        'approved': selectedBooking.status=='Approved',
                        'declined': selectedBooking.status=='Declined'
                    }">

                    {{ selectedBooking.status }}

                </span>

            </div>

            <div><strong>Remarks</strong></div>
            <div>{{ selectedBooking.remarks }}</div>

                            </div>

        <div class="modal-footer">

            <button
                class="approve-btn"
                (click)="selectedBooking.status='Approved'">

                Approve

            </button>

            <button
                class="decline-btn"
                (click)="selectedBooking.status='Declined'">

                Decline

            </button>

            <button
                class="ghost-button"
                (click)="closeDetails()">

                Close

            </button>

        </div>

    </div>

</div>

`
})
export class VisitBookingListComponent {

    selectedBooking: any = null;

    bookings = [

        {
            id: 1001,
            customer: 'Rakib Ahmed',
            phone: '017XXXXXXXX',
            visitors: 3,
            project: 'Green Valley',
            date: '15 Jul 2026',
            time: '10:30 AM',
            pickup: 'Dhanmondi, Dhaka',
            destination: 'Green Valley Site Office',
            vehicle: 'Toyota Hiace',
            driver: 'Rahim',
            purpose: 'Site Visit',
            status: 'Pending',
            remarks: 'Customer wants to visit the project with family before booking.'
        },

        {
            id: 1002,
            customer: 'Nusrat Jahan',
            phone: '018XXXXXXXX',
            visitors: 2,
            project: 'Lake View',
            date: '16 Jul 2026',
            time: '2:00 PM',
            pickup: 'Mirpur, Dhaka',
            destination: 'Lake View Project',
            vehicle: 'SUV',
            driver: 'Karim',
            purpose: 'Booking',
            status: 'Approved',
            remarks: 'Returning customer.'
        },

        {
            id: 1003,
            customer: 'Hasan',
            phone: '019XXXXXXXX',
            visitors: 4,
            project: 'Dream City',
            date: '17 Jul 2026',
            time: '11:00 AM',
            pickup: 'Uttara, Dhaka',
            destination: 'Dream City Sales Office',
            vehicle: 'Premio',
            driver: 'Salam',
            purpose: 'Inspection',
            status: 'Declined',
            remarks: 'Visit cancelled due to bad weather.'
        }

    ];

    openDetails(booking: any) {

        this.selectedBooking = booking;

    }

    closeDetails() {

        this.selectedBooking = null;

    }

}