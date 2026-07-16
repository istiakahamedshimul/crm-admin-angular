import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
@Component({selector:'app-transport-nav',standalone:true,imports:[RouterLink,RouterLinkActive],template:`
<nav class="transport-nav" aria-label="Transport sections">
 <a routerLink="/transport/requests" routerLinkActive="active">Visit Requests</a>
 <a routerLink="/transport/schedule" routerLinkActive="active">Schedule Visit</a>
 <a routerLink="/transport/vehicles" routerLinkActive="active">Vehicles</a>
</nav>`}) export class TransportNavComponent {}
