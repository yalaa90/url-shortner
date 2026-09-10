import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AutoFocusDirective } from './auto-focus.directive';

@Component({
  standalone: true,
  imports: [AutoFocusDirective],
  template: `<input appAutoFocus [focusDelay]="delay" />`,
})
class TestHostComponent {
  delay = 0;
}

describe('AutoFocusDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let input: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    fixture = TestBed.createComponent(TestHostComponent);
    input = fixture.nativeElement.querySelector('input');
  });

  it('focuses the element after view initialization', fakeAsync(() => {
    spyOn(input, 'focus');
    fixture.detectChanges();
    tick();
    expect(input.focus).toHaveBeenCalled();
  }));

  it('respects the focusDelay input', fakeAsync(() => {
    fixture.componentInstance.delay = 100;
    fixture.detectChanges();
    const focusSpy = spyOn(input, 'focus');
    tick();
    expect(focusSpy).not.toHaveBeenCalled();
    tick(100);
    expect(focusSpy).toHaveBeenCalled();
  }));
});