import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  function fillInputs(email: string, password: string, confirm: string): void {
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    inputs[0].value = email;
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1].value = password;
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[2].value = confirm;
    inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(() => {
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RegisterComponent],
      providers: [provideRouter([]), { provide: MatSnackBar, useValue: snackBar }],
    });
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the register form', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Create an account');
    expect(el.querySelectorAll('input').length).toBe(3);
  });

  it('opens the snackbar and resets on a valid submit', () => {
    fillInputs('user@example.com', 'Str0ng!Password', 'Str0ng!Password');
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    button.click();

    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/user@example\.com/),
      'Dismiss',
      jasmine.anything()
    );
    expect(component.registerForm.pristine).toBeTrue();
    expect(component.registerForm.value.email).toBeFalsy();
  });

  it('does nothing when the form is invalid', () => {
    fillInputs('user@example.com', 'weak', 'weak');
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    button.click();
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('surfaces password strength errors', () => {
    component.registerForm.get('password')?.setValue('weak');
    component.registerForm.get('password')?.markAsTouched();
    expect(component.fieldError('password')).toContain('at least 12 characters');
  });

  it('flags mismatched passwords on the form group', () => {
    component.registerForm.patchValue({ password: 'Str0ng!Password', confirmPassword: 'Other!Password' });
    expect(component.registerForm.errors?.['passwordsMismatch']).toBeTruthy();
  });
});