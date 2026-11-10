import { inject, Injectable } from '@angular/core';
import { DemoStore } from '../data/store';
import { simulate } from './simulate';

/** Mock-only helper (has no real-backend equivalent): restore the seed data. */
@Injectable({ providedIn: 'root' })
export class DemoService {
  private readonly store = inject(DemoStore);

  resetData(): Promise<void> {
    return simulate(() => this.store.reset(), 600);
  }
}
