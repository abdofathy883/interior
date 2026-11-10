import { DestroyRef, inject, signal, Signal } from '@angular/core';
import { APP_CONFIG } from '../../core/config';

/**
 * A signal that is `true` for a short moment after creation - used to show skeletons
 * during the demo so the app feels like it is talking to a server.
 */
export function fakeLoading(ms: number = APP_CONFIG.loadingDelayMs): Signal<boolean> {
  const loading = signal(true);
  const timer = setTimeout(() => loading.set(false), ms);
  inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  return loading.asReadonly();
}
