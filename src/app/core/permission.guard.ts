import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const permissionGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permissions = route.data?.['permissions'] as string[] | undefined;
  return !permissions?.length || auth.hasPermission(...permissions) || router.createUrlTree(['/']);
};
