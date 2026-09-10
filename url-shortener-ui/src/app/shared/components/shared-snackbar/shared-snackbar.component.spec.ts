import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { SharedSnackbarComponent } from './shared-snackbar.component';

describe('SharedSnackbarComponent', () => {
  let fixture: ComponentFixture<SharedSnackbarComponent>;
  let component: SharedSnackbarComponent;
  let snackbarRef: jasmine.SpyObj<MatSnackBarRef<SharedSnackbarComponent>>;

  beforeEach(() => {
    snackbarRef = jasmine.createSpyObj<MatSnackBarRef<SharedSnackbarComponent>>(
      'MatSnackBarRef',
      ['dismiss']
    );
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SharedSnackbarComponent],
      providers: [{ provide: MatSnackBarRef, useValue: snackbarRef }],
    });
    fixture = TestBed.createComponent(SharedSnackbarComponent);
    component = fixture.componentInstance;
    component.message = 'Saved successfully';
    component.type = 'success';
    fixture.detectChanges();
  });

  it('renders the message with the type attribute', () => {
    const content = fixture.nativeElement.querySelector('.snackbar-content');
    expect(fixture.nativeElement.textContent).toContain('Saved successfully');
    expect(content.getAttribute('data-type')).toBe('success');
  });

  it('dismisses the snackbar via the Close button', () => {
    (fixture.nativeElement.querySelector('button[aria-label="Dismiss"]') as HTMLButtonElement).click();
    expect(snackbarRef.dismiss).toHaveBeenCalled();
  });
});