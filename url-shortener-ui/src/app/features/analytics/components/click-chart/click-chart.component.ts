import { Component, Input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatCardModule } from '@angular/material/card';
import { TimeSeriesPoint } from '../../../../core/services/analytics-api.service';

export interface ChartDatum {
  name: string;
  value: number;
}

@Component({
  selector: 'app-click-chart',
  standalone: true,
  imports: [NgxChartsModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Clicks over time</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <ngx-charts-line-chart
          [results]="chartData"
          [xAxis]="true"
          [yAxis]="true"
          [showXAxisLabel]="true"
          xAxisLabel="Date"
          [showYAxisLabel]="true"
          yAxisLabel="Clicks"
          [legend]="true"
          [animations]="false"
          [roundDomains]="true"
        >
        </ngx-charts-line-chart>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      ngx-charts-line-chart {
        display: block;
        height: 320px;
      }
    `,
  ],
})
export class ClickChartComponent {
  @Input() set points(points: TimeSeriesPoint[] | null | undefined) {
    this.chartData = (points ?? []).map((point) => ({
      name: new Date(point.timestamp).toLocaleDateString(),
      value: point.clicks,
    }));
  }

  chartData: ChartDatum[] = [];
}