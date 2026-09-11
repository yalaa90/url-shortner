import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsComponent } from './settings.component';
import { authActions } from '../../../../state/auth/auth.actions';
import { selectCurrentUser } from '../../../../state/auth/auth.selectors';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let store: MockStore;
  let dispatch: jasmine.Spy;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    localStorage.clear();
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SettingsComponent],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            {
              selector: selectCurrentUser,
              value: { id: '1', email: 'user@example.com', roles: ['user'], emailVerified: true },
            },
          ],
        }),
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  it('shows the current user email', () => {
    expect(fixture.nativeElement.textContent).toContain('user@example.com');
  });

  it('engages dark mode and shows a snackbar', () => {
    if (component.themeService.darkMode()) {
      component.themeService.toggle();
    }
    expect(component.themeService.darkMode()).toBe(false);

    component.onThemeToggle(true);

    expect(component.themeService.darkMode()).toBe(true);
    expect(snackBar.open).toHaveBeenCalledWith('Dark mode enabled', 'Dismiss', jasmine.anything());
  });

  it('engages light mode and shows a snackbar', () => {
    if (!component.themeService.darkMode()) {
      component.themeService.toggle();
    }
    expect(component.themeService.darkMode()).toBe(true);

    component.onThemeToggle(false);

    expect(component.themeService.darkMode()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Light mode enabled', 'Dismiss', jasmine.anything());
  });

  it('keeps the mode but still confirms when it has not changed', () => {
    const kept = component.themeService.darkMode();

    component.onThemeToggle(kept);

    expect(component.themeService.darkMode()).toBe(kept);
    expect(snackBar.open).toHaveBeenCalledWith(
      `${kept ? 'Dark' : 'Light'} mode enabled`,
      'Dismiss',
      jasmine.anything()
    );
  });

  it('dispatches logout', () => {
    component.logout();
    expect(dispatch).toHaveBeenCalledWith(authActions.logout());
  });
});