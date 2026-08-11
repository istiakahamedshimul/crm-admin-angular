import { inject } from '@angular/core'; import { CanActivateFn, Router } from '@angular/router'; import { AuthService } from './auth.service';
export const roleGuard: CanActivateFn = route => { const auth=inject(AuthService); const router=inject(Router); const roles=route.data?.['roles'] as string[]|undefined; return !roles||auth.hasRole(...roles)||router.createUrlTree(['/']); };
