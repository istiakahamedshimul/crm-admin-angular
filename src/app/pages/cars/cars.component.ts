import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<section class="page-head">
    <div>
        <p class="eyebrow">Vehicle Management</p>
        <h1>Cars</h1>
    </div>
</section>

<section class="panel form-panel">

    <h2>{{ editing ? 'Update Car' : 'Register New Car' }}</h2>

    <div class="form-grid">

        <label>
            Registration Number
            <input
                type="text"
                [(ngModel)]="car.registrationNo"
                name="registrationNo"
                placeholder="Dhaka Metro-GA-11-1234">
        </label>

        <label>
            Vehicle Type
            <select
                [(ngModel)]="car.vehicleType"
                name="vehicleType">

                <option value="">Select Vehicle Type</option>
                <option>Microbus</option>
                <option>SUV</option>
                <option>Sedan</option>
                <option>Pickup</option>
                <option>Bus</option>

            </select>
        </label>

        <label>
            Brand
            <input
                type="text"
                [(ngModel)]="car.brand"
                name="brand"
                placeholder="Toyota">
        </label>

        <label>
            Model
            <input
                type="text"
                [(ngModel)]="car.model"
                name="model"
                placeholder="Hiace">
        </label>

        <label>
            Color
            <input
                type="text"
                [(ngModel)]="car.color"
                name="color"
                placeholder="White">
        </label>

        <label>
            Seating Capacity
            <input
                type="number"
                [(ngModel)]="car.seats"
                name="seats">
        </label>

        <label>
            Fuel Type
            <select
                [(ngModel)]="car.fuelType"
                name="fuelType">

                <option value="">Select Fuel Type</option>
                <option>Petrol</option>
                <option>Diesel</option>
                <option>Octane</option>
                <option>Hybrid</option>
                <option>Electric</option>

            </select>
        </label>

        <label>
            Purchase Date
            <input
                type="date"
                [(ngModel)]="car.purchaseDate"
                name="purchaseDate">
        </label>

        <label>
            Status
            <select
                [(ngModel)]="car.status"
                name="status">

                <option>Active</option>
                <option>Maintenance</option>
                <option>Out of Service</option>

            </select>
        </label>

        <label>
            Current Mileage (KM)
            <input
                type="number"
                [(ngModel)]="car.mileage"
                name="mileage">
        </label>

    </div>

    <div class="visit-footer">

        <button
            class="primary-button full-button"
            (click)="saveCar()">

            {{ editing ? 'Update Car' : 'Register Car' }}

        </button>

    </div>

</section>

<section class="panel">

    <div class="table-header">

        <div>
            <h2>Registered Cars</h2>
            <p>All registered company vehicles.</p>
        </div>

    </div>

    <table>

        <thead>

            <tr>

                <th>ID</th>
                <th>Registration</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Type</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Action</th>

            </tr>

        </thead>

        <tbody>

            <tr
                *ngFor="let c of cars"
                class="clickable-row"
                (click)="viewCar(c)">

                <td>{{ c.id }}</td>
                <td>{{ c.registrationNo }}</td>
                <td>{{ c.brand }}</td>
                <td>{{ c.model }}</td>
                <td>{{ c.vehicleType }}</td>
                <td>{{ c.seats }}</td>

                <td>

                    <span
                        class="status"
                        [ngClass]="{
                            'approved': c.status=='Active',
                            'pending': c.status=='Maintenance',
                            'declined': c.status=='Out of Service'
                        }">

                        {{ c.status }}

                    </span>

                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            class="ghost-button"
                            (click)="viewCar(c); $event.stopPropagation()">

                            View

                        </button>

                        <button
                            class="primary-button"
                            (click)="editCar(c); $event.stopPropagation()">

                            Edit

                        </button>

                    </div>

                </td>

            </tr>

        </tbody>

    </table>

</section>

<!-- =========================
     Car Details Modal
========================== -->

<div
    class="modal-backdrop"
    *ngIf="selectedCar"
    (click)="closeDetails()">

    <div
        class="visit-modal"
        (click)="$event.stopPropagation()">

        <div class="modal-header">

            <h2>Car Details</h2>

            <button
                class="close-btn"
                (click)="closeDetails()">

                ✕

            </button>

        </div>

        <div class="details-grid">

            <div><strong>Registration No</strong></div>
            <div>{{ selectedCar.registrationNo }}</div>

            <div><strong>Vehicle Type</strong></div>
            <div>{{ selectedCar.vehicleType }}</div>

            <div><strong>Brand</strong></div>
            <div>{{ selectedCar.brand }}</div>

            <div><strong>Model</strong></div>
            <div>{{ selectedCar.model }}</div>

            <div><strong>Color</strong></div>
            <div>{{ selectedCar.color }}</div>

            <div><strong>Seating Capacity</strong></div>
            <div>{{ selectedCar.seats }}</div>

            <div><strong>Fuel Type</strong></div>
            <div>{{ selectedCar.fuelType }}</div>

            <div><strong>Purchase Date</strong></div>
            <div>{{ selectedCar.purchaseDate }}</div>

            <div><strong>Current Mileage</strong></div>
            <div>{{ selectedCar.mileage }} KM</div>

            <div><strong>Status</strong></div>

            <div>

                <span
                    class="status"
                    [ngClass]="{
                        'approved': selectedCar.status=='Active',
                        'pending': selectedCar.status=='Maintenance',
                        'declined': selectedCar.status=='Out of Service'
                    }">

                    {{ selectedCar.status }}

                </span>

            </div>

        </div>

        <div class="modal-footer">

            <button
                class="primary-button"
                (click)="editCar(selectedCar)">

                Edit

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

export class CarsComponent {

    editing = false;

    selectedCar: any = null;

    editingIndex = -1;

    car = {
        registrationNo: '',
        vehicleType: '',
        brand: '',
        model: '',
        color: '',
        seats: 0,
        fuelType: '',
        purchaseDate: '',
        mileage: 0,
        status: 'Active'
    };

    cars: any[] = [

        {
            id: 1,
            registrationNo: 'Dhaka Metro-GA-11-1234',
            vehicleType: 'Microbus',
            brand: 'Toyota',
            model: 'Hiace',
            color: 'White',
            seats: 14,
            fuelType: 'Diesel',
            purchaseDate: '2024-02-12',
            mileage: 22000,
            status: 'Active'
        },

        {
            id: 2,
            registrationNo: 'Dhaka Metro-KA-21-5678',
            vehicleType: 'SUV',
            brand: 'Toyota',
            model: 'Noah',
            color: 'Black',
            seats: 7,
            fuelType: 'Octane',
            purchaseDate: '2023-11-08',
            mileage: 31000,
            status: 'Maintenance'
        },

        {
            id: 3,
            registrationNo: 'Dhaka Metro-HA-31-9999',
            vehicleType: 'SUV',
            brand: 'Honda',
            model: 'Vezel',
            color: 'Silver',
            seats: 5,
            fuelType: 'Hybrid',
            purchaseDate: '2022-09-17',
            mileage: 48000,
            status: 'Out of Service'
        }

    ];

    saveCar() {

        if (this.editing) {

            this.cars[this.editingIndex] = {
                ...this.car,
                id: this.cars[this.editingIndex].id
            };

            this.editing = false;
            this.editingIndex = -1;

        }
        else {

            this.cars.push({

                id: this.cars.length + 1,

                ...this.car

            });

        }

        this.resetForm();

    }

    editCar(car: any) {

        this.car = { ...car };

        this.editing = true;

        this.editingIndex = this.cars.findIndex(x => x.id === car.id);

        this.closeDetails();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

    }

    viewCar(car: any) {

        this.selectedCar = car;

    }

    closeDetails() {

        this.selectedCar = null;

    }

    resetForm() {

        this.car = {

            registrationNo: '',
            vehicleType: '',
            brand: '',
            model: '',
            color: '',
            seats: 0,
            fuelType: '',
            purchaseDate: '',
            mileage: 0,
            status: 'Active'

        };

    }

}
