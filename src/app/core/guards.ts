import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from './models/models';
import { AuthService } from './services/contracts';

const homeFor = (role: Role) => (role === 'admin' ? '/admin' : '/portal');

/** Only allow the given role; others are bounced to their own home or to /login. */
export const roleGuard =
  (role: Role): CanActivateFn =>
  () => {
    const user = inject(AuthService).user();
    const router = inject(Router);
    if (!user) return router.createUrlTree(['/login']);
    if (user.role !== role) return router.createUrlTree([homeFor(user.role)]);
    return true;
  };

/** `/login`: skip it when a session already exists. */
export const guestGuard: CanActivateFn = () => {
  const user = inject(AuthService).user();
  return user ? inject(Router).createUrlTree([homeFor(user.role)]) : true;
};

/** `/` and unknown URLs: send to the right home. */
export const homeGuard: CanActivateFn = () => {
  const user = inject(AuthService).user();
  const router = inject(Router);
  return router.createUrlTree([user ? homeFor(user.role) : '/login']);
};
