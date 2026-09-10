import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ShellComponent } from './shell.component';
import { authActions } from '../../state/auth/auth.actions';
import { selectCurrentUser } from '../../state/auth/auth.selectors';

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let component: ShellComponent;
  let store: MockStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ShellComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideMockStore({
          selectors: [
            {
              selector: selectCurrentUser,
              value: { id: '1', email: 'user@example.com', roles: ['user'], emailVerified: true },
            },
          ],
        }),
      ],
    });
    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    fixture.detectChanges();
  });

  it('renders the brand and primary navigation links', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('URL Shortener');
    expect(
      fixture.nativeElement.querySelectorAll(
        'a[aria-label="Dashboard"], a[aria-label="My Links"], a[aria-label="Settings"]'
      ).length
    ).toBe(3);
  });

  it('shows the user initial from the current user email', () => {
    expect(fixture.nativeElement.textContent).toContain('U');
  });

  it('toggles the dark mode via the toolbar button', () => {
    const before = component.themeService.darkMode();
    const button = fixture.nativeElement.querySelector(
      'button[aria-label*="Switch to"]'
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(component.themeService.darkMode()).toBe(!before);
  });

  it('dispatches logout', () => {
    const dispatchSpy = spyOn(store, 'dispatch');
    component.logout();
    expect(dispatchSpy).toHaveBeenCalledWith(authActions.logout());
  });
});