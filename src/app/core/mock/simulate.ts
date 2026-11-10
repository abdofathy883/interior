import { APP_CONFIG } from '../config';

/** Run `work` after a short fake network delay. */
export function simulate<T>(work: () => T, ms: number = APP_CONFIG.saveDelayMs): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(work());
      } catch (e) {
        reject(e);
      }
    }, ms);
  });
}
