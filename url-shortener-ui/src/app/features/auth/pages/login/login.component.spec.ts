import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { LoginComponent } from './login.component';
import { authActions } from '../../../../state/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '../../../../state/auth/auth.selectors';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let store: MockStore;
  let dispatch: jasmine.Spy;

  function fillInputs(username: string, password: string): void {
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    inputs[0].value = username;
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1].value = password;
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, LoginComponent],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectAuthLoading, value: false },
            { selector: selectAuthError, value: null },
          ],
        }),
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    dispatch = spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  it('renders the login form', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Welcome back');
    expect(el.querySelectorAll('input').length).toBe(2);
  });

  it('dispatches loginRequest on a valid submit', () => {
    fillInputs('user@example.com', 'secret');
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    button.click();

    expect(dispatch).toHaveBeenCalledWith(
      authActions.loginRequest({ username: 'user@example.com', password: 'secret' })
    );
  });

  it('does not dispatch when the form is invalid', () => {
    fillInputs('', '');
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    button.click();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('produces field error messages once touched', () => {
    component.loginForm.get('username')?.setValue('');
    component.loginForm.get('username')?.markAsTouched();
    expect(component.fieldError('username')).toBe('This field is required');

    component.loginForm.get('username')?.setValue('not-an-email');
    component.loginForm.get('username')?.markAsTouched();
    expect(component.fieldError('username')).toBe('Enter a valid email address');
  });

  it('exposes loading and error observables', () => {
    expect(component.loading$).toBeDefined();
    component.error$.subscribe((err) => expect(err).toBeNull());
  });
});