import { Injectable, signal } from '@angular/core';

export type QuickAddTab = 'expense' | 'payment';

/** UI state of the quick-add bottom sheet (opened by the FAB or by "add" buttons on screens). */
@Injectable({ providedIn: 'root' })
export class QuickAddService {
  /** `null` = closed. */
  readonly tab = signal<QuickAddTab | null>(null);
  /** Last client used - remembered so repeated entries need fewer taps. */
  readonly lastClientId = signal<string>('');

  open(tab: QuickAddTab = 'expense', clientId?: string): void {
    if (clientId) this.lastClientId.set(clientId);
    this.tab.set(tab);
  }

  close(): void {
    this.tab.set(null);
  }
}
