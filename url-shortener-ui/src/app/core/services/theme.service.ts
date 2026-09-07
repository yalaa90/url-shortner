import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'urlshortener_theme';
  readonly darkMode = signal<boolean>(this.initialValue());

  constructor() {
    this.apply();
  }

  toggle(): void {
    this.darkMode.update((value) => !value);
    this.apply();
  }

  private initialValue(): boolean {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private apply(): void {
    document.documentElement.classList.toggle('dark', this.darkMode());
    localStorage.setItem(this.storageKey, this.darkMode() ? 'dark' : 'light');
  }
}