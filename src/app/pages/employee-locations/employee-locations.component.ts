import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { LiveEmployeeLocation, LocationPoint, TravelHistory } from '../../models/crm.models';
import * as L from 'leaflet';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="location-page">
      <header class="location-hero">
        <div><p class="eyebrow">Field intelligence</p><h1>Employee locations</h1><p>See your field team now and review date-wise travel evidence.</p></div>
        <div class="live-pill"><i></i> Live monitoring <span>refreshes every 30s</span></div>
      </header>

      <section class="location-stats">
        <article><span>Team reporting</span><strong>{{ reportingCount }}/{{ live.length }}</strong><small>employees with location data</small></article>
        <article><span>Online now</span><strong class="green">{{ onlineCount }}</strong><small>updated in the last 5 minutes</small></article>
        <article><span>Selected distance</span><strong>{{ history?.summary?.distanceKm || 0 }} km</strong><small>{{ history?.summary?.pointCount || 0 }} recorded points</small></article>
      </section>

      <section class="location-layout">
        <aside class="employee-panel">
          <div class="panel-title"><div><h2>Field team</h2><p>Latest device signal</p></div><button class="refresh" (click)="loadLive()" [disabled]="loading">↻</button></div>
          <div class="employee-list" *ngIf="live.length; else noLocations">
            <button *ngFor="let item of live" (click)="select(item)" [class.selected]="selected?.employeeId === item.employeeId">
              <span class="avatar">{{ initials(item.fullName) }}</span>
              <span class="employee-copy"><strong>{{ item.fullName }}</strong><small>{{ item.trackingChangedAtUtc ? ('Tracking turned ' + (item.trackingEnabled ? 'on' : 'off') + ' · ' + (item.trackingChangedAtUtc | date:'MMM d, h:mm a')) : (item.recordedAtUtc ? (item.recordedAtUtc | date:'MMM d, h:mm a') : 'No location received') }}</small></span>
              <span class="signal" [class.online]="item.isOnline" [class.tracking-off]="!item.trackingEnabled">{{ !item.trackingEnabled ? 'Tracking off' : (item.isOnline ? 'Live' : (item.hasLocation ? 'Offline' : 'Waiting')) }}</span>
            </button>
          </div>
          <ng-template #noLocations><div class="location-empty"><b>No signals yet</b><span>Locations appear after field staff allow tracking.</span></div></ng-template>
        </aside>

        <div class="map-card">
          <div id="employee-map"></div>
          <div class="map-overlay" *ngIf="selected">
            <span class="avatar">{{ initials(selected.fullName) }}</span>
            <div><strong>{{ selected.fullName }}</strong><small *ngIf="!selected.trackingEnabled">Tracking turned off {{ selected.trackingChangedAtUtc | date:'MMM d, h:mm a' }}</small><small *ngIf="selected.trackingEnabled && selected.hasLocation">{{ selected.latitude | number:'1.5-5' }}, {{ selected.longitude | number:'1.5-5' }} · ±{{ selected.accuracyMeters | number:'1.0-0' }}m</small><small *ngIf="selected.trackingEnabled && !selected.hasLocation">Waiting for the employee's first GPS signal</small></div>
            <a *ngIf="selected.hasLocation" [href]="directionsUrl" target="_blank" rel="noopener">Open directions ↗</a>
          </div>
        </div>
      </section>

      <section class="history-card">
        <header><div><p class="eyebrow">Travel evidence</p><h2>Daily route history</h2></div><div class="filters"><label>Employee<select [(ngModel)]="historyEmployeeId"><option [ngValue]="null">Select employee</option><option *ngFor="let item of live" [ngValue]="item.employeeId">{{ item.fullName }}</option></select></label><label>Date<input type="date" [(ngModel)]="historyDate"></label><button (click)="loadHistory()" [disabled]="!canViewHistory || !historyEmployeeId">View route</button></div></header>
        <div class="permission-note" *ngIf="!canViewHistory">Daily travel history is restricted to Super Admin accounts. Admin accounts can only see live locations.</div>
        <div class="route-summary" *ngIf="history">
          <div><span>Started</span><strong>{{ history.summary.startedAtUtc ? (history.summary.startedAtUtc | date:'h:mm a') : '—' }}</strong></div>
          <div><span>Last signal</span><strong>{{ history.summary.endedAtUtc ? (history.summary.endedAtUtc | date:'h:mm a') : '—' }}</strong></div>
          <div><span>Travelled</span><strong>{{ history.summary.distanceKm }} km</strong></div>
          <div><span>GPS points</span><strong>{{ history.summary.pointCount }}</strong></div>
        </div>
        <div class="route-empty" *ngIf="canViewHistory && !history"><span>⌁</span><strong>Choose an employee and date</strong><p>The complete path, starting point, ending point, distance and timestamps will appear on the map.</p></div>
      </section>
    </section>
  `,
  styleUrls: ['./employee-locations.component.css']
})
export class EmployeeLocationsComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiService); auth = inject(AuthService); private map?: L.Map; private layer = L.layerGroup(); private timer?: ReturnType<typeof setInterval>;
  private readonly projectHouse = L.latLng(23.6612777, 90.3656087);
  live: LiveEmployeeLocation[] = []; selected?: LiveEmployeeLocation; history?: TravelHistory; loading = false;
  historyEmployeeId: number | null = null; historyDate = new Date().toISOString().slice(0, 10);
  get canViewHistory() { return this.auth.user()?.role === 'SuperAdmin'; }
  get onlineCount() { return this.live.filter(x => x.isOnline).length; }
  get reportingCount() { return this.live.filter(x => x.hasLocation).length; }
  get directionsUrl() { return this.selected ? `https://www.google.com/maps/dir/?api=1&destination=${this.selected.latitude},${this.selected.longitude}` : '#'; }
  ngOnInit() { this.loadLive(); this.timer = setInterval(() => this.loadLive(false), 30000); }
  ngAfterViewInit() { this.map = L.map('employee-map', { zoomControl: false }).setView(this.projectHouse, 17); L.control.zoom({ position: 'bottomright' }).addTo(this.map); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(this.map); L.circleMarker(this.projectHouse, { radius: 12, color: '#fff', weight: 4, fillColor: '#e11d48', fillOpacity: 1 }).bindTooltip('<b>RC Maya Kanon Project House</b>', { permanent: true, direction: 'top', offset: [0, -12] }).addTo(this.map); this.layer.addTo(this.map); }
  ngOnDestroy() { if (this.timer) clearInterval(this.timer); this.map?.remove(); }
  loadLive(show = true) { if (show) this.loading = true; this.api.liveLocations().subscribe({ next: data => { this.live = data; if (!this.selected && data.length) { this.selected = data[0]; this.historyEmployeeId = data[0].employeeId; } else this.selected = data.find(x => x.employeeId === this.selected?.employeeId) || this.selected; this.drawLive(); this.loading = false; }, error: () => this.loading = false }); }
  select(item: LiveEmployeeLocation) { this.selected = item; this.historyEmployeeId = item.employeeId; this.drawLive(); if (item.latitude != null && item.longitude != null) this.map?.flyTo([item.latitude, item.longitude], 15, { duration: .8 }); }
  loadHistory() { if (!this.historyEmployeeId || !this.canViewHistory) return; this.api.travelHistory(this.historyEmployeeId, this.historyDate).subscribe(data => { this.history = data; this.drawRoute(data.points); }); }
  initials(name: string) { return name.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase(); }
  private marker(point: LocationPoint, active = false) { return L.circleMarker([point.latitude, point.longitude], { radius: active ? 10 : 7, color: '#fff', weight: 3, fillColor: point.isMocked ? '#ef4444' : '#0f766e', fillOpacity: 1 }); }
  private drawLive() { if (!this.map) return; this.layer.clearLayers(); this.live.filter(x => x.latitude != null && x.longitude != null).forEach(x => this.marker(x as LocationPoint, x.employeeId === this.selected?.employeeId).bindTooltip(`<b>${x.fullName}</b><br>${!x.trackingEnabled ? 'Tracking off since ' + new Date(x.trackingChangedAtUtc!).toLocaleString() : (x.isOnline ? 'Live now' : 'Last seen ' + new Date(x.recordedAtUtc!).toLocaleString())}`).addTo(this.layer)); }
  private drawRoute(points: LocationPoint[]) { if (!this.map) return; this.layer.clearLayers(); if (!points.length) return; const coords = points.map(x => L.latLng(x.latitude, x.longitude)); L.polyline(coords, { color: '#0f766e', weight: 5, opacity: .9 }).addTo(this.layer); this.marker(points[0]).bindTooltip('Route started').addTo(this.layer); this.marker(points[points.length - 1], true).bindTooltip('Last location').addTo(this.layer); this.map.fitBounds(L.latLngBounds(coords), { padding: [45, 45] }); }
}
