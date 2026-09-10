import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReferrerTableComponent } from './referrer-table.component';

describe('ReferrerTableComponent', () => {
  let fixture: ComponentFixture<ReferrerTableComponent>;
  let component: ReferrerTableComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NoopAnimationsModule, ReferrerTableComponent] });
    fixture = TestBed.createComponent(ReferrerTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sorts referrers by count descending and computes percentages off the max', () => {
    component.referrers = { twitter: 40, google: 60 };
    fixture.detectChanges();

    expect(component.displayRows).toEqual([
      { source: 'google', count: 60 },
      { source: 'twitter', count: 40 },
    ]);
    expect(component.percentage(60)).toBe(100);
    expect(component.percentage(30)).toBe(50);

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    expect(rows.length).toBe(2);
    expect((rows[0] as HTMLElement).textContent).toContain('Google');
    expect((rows[0] as HTMLElement).textContent).toContain('60');
  });

  it('tolerates null or undefined referrers', () => {
    component.referrers = null;
    expect(component.displayRows).toEqual([]);
    expect(component.percentage(10)).toBe(0);
  });

  it('shows an empty state when there is no data', () => {
    component.referrers = {};
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No referrer data available yet.');
  });
});