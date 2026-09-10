import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClickOutsideDirective } from './click-outside.directive';

@Component({
  standalone: true,
  imports: [ClickOutsideDirective],
  template: `
    <div class="inner" appClickOutside (clickOutside)="onOutside()"></div>
    <div class="other"></div>
  `,
})
class TestHostComponent {
  onOutside = jasmine.createSpy('onOutside');
}

describe('ClickOutsideDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({ imports: [TestHostComponent] }).createComponent(
      TestHostComponent
    );
    fixture.detectChanges();
  });

  it('emits when a mousedown happens outside the element', () => {
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(fixture.componentInstance.onOutside).toHaveBeenCalled();
  });

  it('does not emit when a mousedown happens inside the element', () => {
    const inner = fixture.debugElement.query(By.css('.inner')).nativeElement as HTMLElement;
    inner.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(fixture.componentInstance.onOutside).not.toHaveBeenCalled();
  });

  it('emits when another element inside the document is clicked', () => {
    const other = fixture.debugElement.query(By.css('.other')).nativeElement as HTMLElement;
    other.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(fixture.componentInstance.onOutside).toHaveBeenCalled();
  });
});