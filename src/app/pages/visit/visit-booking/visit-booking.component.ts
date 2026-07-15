import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<section class="page-head">
    <div>
        <p class="eyebrow">Customer Visit</p>
        <h1>Visit Booking</h1>
    </div>
</section>

<section class="panel form-panel">

    <h2>Schedule Customer Visit</h2>

    <div class="form-grid">

        <!-- Customer -->

        <label>
            Customer
            <select>
                <option>Select Customer</option>
            </select>
        </label>

        <label>
            Phone Number
            <input
                type="text"
                placeholder="01XXXXXXXXXX">
        </label>

        <!-- Visitors -->

        <label>
            Number of Visitors
            <input
                type="number"
                value="1">
        </label>

        <label>
            Project
            <select>
                <option>Select Project</option>
            </select>
        </label>

        <!-- Date Time -->

        <label>
            Visit Date
            <input type="date">
        </label>

        <label>
            Visit Time
            <input type="time">
        </label>

        <!-- Pickup -->

        <label class="full-width">
            Pickup Location
            <input
                type="text"
                placeholder="Pickup location">
        </label>

        <!-- Destination -->

        <label class="full-width">
            Destination
            <input
                type="text"
                placeholder="Destination / Project">
        </label>

        <!-- Vehicle -->

        <label>
            Vehicle
            <select>
                <option>Select Vehicle</option>
                <option>Toyota Hiace</option>
                <option>Toyota Noah</option>
                <option>Microbus</option>
                <option>SUV</option>
                <option>Premio</option>
            </select>
        </label>

        <!-- Driver -->

        <label>
            Driver
            <select>
                <option>Select Driver</option>
            </select>
        </label>

        <!-- Purpose -->

        <label>
            Purpose
            <select>
                <option>Site Visit</option>
                <option>Booking</option>
                <option>Customer Meeting</option>
                <option>Inspection</option>
            </select>
        </label>

        <!-- Status -->

        <label>
            Status
            <select>
                <option>Scheduled</option>
                <option>Confirmed</option>
                <option>Completed</option>
                <option>Cancelled</option>
            </select>
        </label>

        <!-- Remarks -->

        <label class="full-width">
            Remarks
            <textarea
                rows="4"
                placeholder="Write additional notes..."></textarea>
        </label>

    </div>

    <div class="visit-footer">

    <button
        type="submit"
        class="primary-button full-button">

        Schedule Visit

    </button>

</div>

</section>
`
})
export class VisitBookingComponent {

}