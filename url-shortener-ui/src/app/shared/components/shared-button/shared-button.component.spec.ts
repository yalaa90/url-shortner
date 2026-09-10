import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SharedButtonComponent } from './shared-button.component';

describe('SharedButtonComponent', () => {
  let fixture: ComponentFixture<SharedButtonComponent>;
  let component: SharedButtonComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NoopAnimationsModule, SharedButtonComponent] });
    fixture = TestBed.createComponent(SharedButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the label', () => {
    component.label = 'Save';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Save');
  });

  it('uses the given type on the native button', () => {
    component.type = 'submit';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').type).toBe('submit');
  });

  it('disables the button when disabled or loading', () => {
    component.disabled = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);

    component.disabled = false;
    component.loading = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('is-loading')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
  });

  it('honours an explicit aria-label', () => {
    component.label = 'Save';
    component.ariaLabel = 'Save changes';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(
      'Save changes'
    );
  });

  it('applies the variant class', () => {
    component.variant = 'danger';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').classList.contains('variant-danger')).toBe(
      true
    );
  });

  it('emits onClick when clicked', () => {
    spyOn(component.onClick, 'emit');
    fixture.nativeElement.querySelector('button').click();
    expect(component.onClick.emit).toHaveBeenCalled();
  });
});