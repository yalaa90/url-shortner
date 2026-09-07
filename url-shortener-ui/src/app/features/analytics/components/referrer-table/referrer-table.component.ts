import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface ReferrerRow {
  source: string;
  count: number;
}

@Component({
  selector: 'app-referrer-table',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatProgressBarModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Top referrers</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (displayRows.length) {
          <table mat-table [dataSource]="displayRows" class="referrer-table">
            <ng-container matColumnDef="source">
              <th mat-header-cell *matHeaderCellDef>Source</th>
              <td mat-cell *matCellDef="let row">
                <span class="source-name">{{ row.source | titlecase }}</span>
                <mat-progress-bar
                  mode="determinate"
                  [value]="percentage(row.count)"
                  class="source-bar"
                ></mat-progress-bar>
              </td>
            </ng-container>

            <ng-container matColumnDef="count">
              <th mat-header-cell *matHeaderCellDef class="count-header">Clicks</th>
              <td mat-cell *matCellDef="let row" class="count-cell">{{ row.count }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['source', 'count']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['source', 'count']"></tr>
          </table>
        } @else {
          <p class="empty-text">No referrer data available yet.</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .referrer-table {
        width: 100%;
      }
      .source-name {
        font-weight: 500;
      }
      .source-bar {
        margin-top: 4px;
      }
      .count-header {
        width: 90px;
      }
      .count-cell {
        font-variant-numeric: tabular-nums;
      }
      .empty-text {
        opacity: 0.7;
        padding: 16px 0;
      }
    `,
  ],
})
export class ReferrerTableComponent {
  @Input() set referrers(referrers: Record<string, number> | null | undefined) {
    const entries = Object.entries(referrers ?? {}).sort((a, b) => b[1] - a[1]);
    this.maxCount = entries.reduce((max, [, count]) => Math.max(max, count), 0);
    this.displayRows = entries.map(([source, count]) => ({ source, count }));
  }

  displayRows: ReferrerRow[] = [];
  private maxCount = 0;

  percentage(count: number): number {
    return this.maxCount ? Math.round((count / this.maxCount) * 100) : 0;
  }
}