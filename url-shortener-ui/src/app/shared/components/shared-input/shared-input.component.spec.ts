import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SharedInputComponent } from './shared-input.component';

describe('SharedInputComponent', () => {
  let fixture: ComponentFixture<SharedInputComponent>;
  let component: SharedInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedInputComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(SharedInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('reflects values written by the control value accessor', () => {
    component.writeValue('hello');
    expect(component.value).toBe('hello');

    component.writeValue(null as unknown as string);
    expect(component.value).toBe('');
  });

  it('propagates changes and touches to registered callbacks', () => {
    const onChange = jasmine.createSpy();
    const onTouched = jasmine.createSpy();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'typed';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onChange).toHaveBeenCalledWith('typed');
    expect(component.value).toBe('typed');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(onTouched).toHaveBeenCalled();
  });

  it('supports the disabled state', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
    expect(component.disabled).toBe(true);
  });

  it('renders label, placeholder, hint, error and autocomplete', () => {
    component.label = 'URL';
    component.placeholder = 'https://...';
    component.hint = 'Must be https';
    component.errorMessage = 'Invalid URL';
    component.autocomplete = 'off';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    expect(el.textContent).toContain('URL');
    expect(input.placeholder).toBe('https://...');
    expect(el.querySelector('mat-hint')?.textContent ?? '').toContain('Must be https');
    expect(input.autocomplete).toBe('off');
  });

  it('shows a spinner while loading', () => {
    component.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
  });
});

describe('SharedInputComponent with a bound control', () => {
  @Component({
    standalone: true,
    imports: [ReactiveFormsModule, SharedInputComponent],
    providers: [provideNoopAnimations()],
    template: `
      <form [formGroup]="form">
        <app-shared-input
          formControlName="url"
          [errorMessage]="errorMessage"
          label="URL"
        ></app-shared-input>
      </form>
    `,
  })
  class ErrorHost {
    form = new FormGroup({ url: new FormControl('') });
    errorMessage = 'Invalid URL';
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('passes the error message of a bound control to the input', () => {
    TestBed.configureTestingModule({ imports: [ErrorHost], providers: [provideNoopAnimations()] });
    const host = TestBed.createComponent(ErrorHost);
    host.detectChanges();

    const inner = host.debugElement.query(By.directive(SharedInputComponent));
    expect(inner.componentInstance.errorMessage).toBe('Invalid URL');
  });
});