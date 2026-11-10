import { computed, inject, Injectable, signal } from '@angular/core';
import { DemoStore } from '../data/store';
import { AppUser, SessionUser } from '../models/models';
import { AuthService } from '../services/contracts';
import { simulate } from './simulate';

const SESSION_KEY = 'decor-track-session-v1';

/** Strip the password before exposing a user to the rest of the app. */
function toSession(u: AppUser): SessionUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role, clientId: u.clientId };
}

@Injectable()
export class MockAuthService extends AuthService {
  private readonly store = inject(DemoStore);
  private readonly _user = signal<SessionUser | null>(null);
  override readonly user = computed(() => this._user());

  constructor() {
    super();
    this.restore();
  }

  override async login(email: string, password: string): Promise<SessionUser> {
    const found = await simulate(() =>
      this.store.users().find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password),
    );
    if (!found) throw new Error('INVALID_CREDENTIALS');
    const session = toSession(found);
    this._user.set(session);
    try {
      localStorage.setItem(SESSION_KEY, session.id);
    } catch {
      /* ignore */
    }
    return session;
  }

  override logout(): void {
    this._user.set(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  private restore(): void {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      const found = id ? this.store.users().find((u) => u.id === id) : undefined;
      if (found) this._user.set(toSession(found));
    } catch {
      /* ignore */
    }
  }
}
