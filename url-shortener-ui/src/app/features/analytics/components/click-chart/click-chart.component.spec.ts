import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ClickChartComponent } from './click-chart.component';
import { TimeSeriesPoint } from '../../../../core/services/analytics-api.service';

describe('ClickChartComponent', () => {
  let fixture: ComponentFixture<ClickChartComponent>;
  let component: ClickChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NoopAnimationsModule, ClickChartComponent] });
    fixture = TestBed.createComponent(ClickChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with no chart data', () => {
    expect(component.chartData).toEqual([]);
  });

  it('maps the time series points into chart series', () => {
    const points: TimeSeriesPoint[] = [
      { timestamp: '2024-01-01T00:00:00Z', clicks: 5 },
      { timestamp: '2024-01-02T00:00:00Z', clicks: 10 },
    ];
    component.points = points;

    expect(component.chartData.length).toBe(2);
    expect(component.chartData[0].name).toBe(new Date('2024-01-01T00:00:00Z').toLocaleDateString());
    expect(component.chartData[0].value).toBe(5);
    expect(component.chartData[1].value).toBe(10);
  });

  it('tolerates null or undefined points', () => {
    component.points = null;
    expect(component.chartData).toEqual([]);
  });

  it('renders the ngx line chart', () => {
    component.points = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ngx-charts-line-chart')).toBeTruthy();
  });
});