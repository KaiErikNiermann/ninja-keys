/**
 * The colour theme: the viewer's stored choice, else the system's. app.html
 * applies it before the first paint; this keeps it in sync afterwards.
 */

export type ThemeChoice = 'light' | 'dark' | 'system';

const KEY = 'theme';

function stored(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

class Theme {
  #systemDark = $state(false);
  choice = $state<ThemeChoice>('system');

  readonly dark = $derived(
    this.choice === 'dark' || (this.choice === 'system' && this.#systemDark)
  );

  /** Start following the stored choice and the system; browser only. */
  start(): () => void {
    this.choice = stored();
    const query = matchMedia('(prefers-color-scheme: dark)');
    const follow = () => {
      this.#systemDark = query.matches;
    };
    follow();
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }

  set(choice: ThemeChoice): void {
    this.choice = choice;
    try {
      if (choice === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, choice);
    } catch {
      // Storage can be unavailable (private windows); the choice still holds
      // for this page view.
    }
  }

  /** Cycle light, dark, system. */
  next(): void {
    const order: readonly ThemeChoice[] = ['light', 'dark', 'system'];
    this.set(
      order[(order.indexOf(this.choice) + 1) % order.length] ?? 'system'
    );
  }
}

export const theme = new Theme();
