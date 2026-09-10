import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CopyToClipboardComponent } from './copy-to-clipboard.component';

describe('CopyToClipboardComponent', () => {
  let fixture: ComponentFixture<CopyToClipboardComponent>;
  let component: CopyToClipboardComponent;
  let clipboardWriteText: jasmine.Spy;

  beforeEach(() => {
    clipboardWriteText = jasmine.createSpy().and.resolveTo();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWriteText },
      configurable: true,
    });

    TestBed.configureTestingModule({ imports: [NoopAnimationsModule, CopyToClipboardComponent] });
    fixture = TestBed.createComponent(CopyToClipboardComponent);
    component = fixture.componentInstance;
    component.text = 'http://localhost/s/abc';
    fixture.detectChanges();
  });

  it('copies via the clipboard API and resets after two seconds', fakeAsync(() => {
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    tick();
    fixture.detectChanges();

    expect(clipboardWriteText).toHaveBeenCalledWith('http://localhost/s/abc');
    expect(fixture.nativeElement.textContent).toContain('Copied');

    tick(2000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Copy');
  }));

  it('falls back to execCommand when the clipboard API fails', fakeAsync(() => {
    clipboardWriteText.and.rejectWith('denied');
    const execCommand = spyOn(document, 'execCommand');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    tick();

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(component.copied).toBe(true);

    tick(2000);
    expect(component.copied).toBe(false);
  }));

  it('is disabled when the disabled input is set', () => {
    component.disabled = true;
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('exposes a copy-to-clipboard aria-label', () => {
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(
      'Copy to clipboard'
    );
  });
});