import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

function makeMatchMedia(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  };
}

function setup(stored: string | null, prefersDark = false): ThemeService {
  localStorage.clear();
  if (stored === null) {
    localStorage.removeItem('urlshortener_theme');
  } else {
    localStorage.setItem('urlshortener_theme', stored);
  }
  spyOn(window, 'matchMedia').and.returnValue(makeMatchMedia(prefersDark));
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(ThemeService);
}

describe('ThemeService', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('uses prefers-color-scheme when nothing is stored', () => {
    const service = setup(null, true);
    expect(service.darkMode()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('uses a light default when nothing is stored and OS prefers light', () => {
    const service = setup(null, false);
    expect(service.darkMode()).toBeFalse();
    expect(localStorage.getItem('urlshortener_theme')).toBe('light');
  });

  it('reads the stored dark preference', () => {
    const service = setup('dark');
    expect(service.darkMode()).toBeTrue();
  });

  it('toggles the mode and persists the change', () => {
    const service = setup('light');
    expect(service.darkMode()).toBeFalse();

    service.toggle();
    expect(service.darkMode()).toBeTrue();
    expect(localStorage.getItem('urlshortener_theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();

    service.toggle();
    expect(service.darkMode()).toBeFalse();
    expect(localStorage.getItem('urlshortener_theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });
});