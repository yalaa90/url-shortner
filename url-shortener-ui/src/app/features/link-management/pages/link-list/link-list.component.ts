import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { linkActions } from '../../../../state/links/link.actions';
import { selectLinks, selectLinksLoading } from '../../../../state/links/link.selectors';
import { ShortLink } from '../../../../shared/models/link.model';
import {
  SharedTableComponent,
  TableActionsDirective,
  TableColumn,
  TableColumnTemplateDirective,
} from '../../../../shared/components/shared-table/shared-table.component';
import { CopyToClipboardComponent } from '../../../../shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { DateFormatPipe } from '../../../../shared/pipes/date-format.pipe';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe';
import { SharedDialogComponent } from '../../../../shared/components/shared-dialog/shared-dialog.component';

type LinkRow = ShortLink & Record<string, unknown>;

@Component({
  selector: 'app-link-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    SharedTableComponent,
    TableColumnTemplateDirective,
    TableActionsDirective,
    CopyToClipboardComponent,
    DateFormatPipe,
    TruncatePipe,
  ],
  template: `
    <div class="link-list-page">
      <header class="page-header">
        <div>
          <h1>My Links</h1>
          <p class="subtitle">Create, manage and track your short links.</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/links/create" aria-label="Create a new link">
          <mat-icon fontIcon="add_link"></mat-icon>
          New Link
        </a>
      </header>

      <mat-card>
        <mat-card-content>
          <app-shared-table
            [data]="(links$ | async) ?? []"
            [columns]="columns"
            [loading]="loading$ | async"
            [pageSize]="20"
          >
            <ng-template tableColumnTemplate="shortUrl" let-row>
              <span class="short-url-cell">
                <a [routerLink]="['/links', row.shortCode]" class="short-link">{{ row.shortUrl }}</a>
                <app-copy-to-clipboard [text]="row.shortUrl"></app-copy-to-clipboard>
              </span>
            </ng-template>

            <ng-template tableColumnTemplate="originalUrl" let-row>
              <span [title]="row.originalUrl">{{ row.originalUrl | truncate: 60 }}</span>
            </ng-template>

            <ng-template tableColumnTemplate="createdAt" let-row>
              {{ row.createdAt | dateFormat: 'short' }}
            </ng-template>

            <ng-template tableColumnTemplate="active" let-row>
              <span [class]="'status-chip ' + (row.active ? 'status-active' : 'status-inactive')">
                {{ row.active ? 'Active' : 'Disabled' }}
              </span>
            </ng-template>

            <ng-template tableActions let-row>
              <button
                mat-icon-button
                [routerLink]="['/links', row.shortCode]"
                matTooltip="View analytics"
                aria-label="View analytics"
              >
                <mat-icon fontIcon="insert_chart_outlined"></mat-icon>
              </button>
              <button
                mat-icon-button
                matTooltip="Deactivate link"
                aria-label="Deactivate link"
                [disabled]="!row.active"
                (click)="confirmDeactivate(row)"
              >
                <mat-icon fontIcon="delete_outline"></mat-icon>
              </button>
            </ng-template>
          </app-shared-table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .subtitle {
        color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6));
        margin: 0;
      }
      .short-url-cell {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .short-link {
        font-weight: 500;
        text-decoration: none;
      }
      .status-chip {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status-active {
        background: rgba(46, 125, 50, 0.12);
        color: #2e7d32;
      }
      .status-inactive {
        background: rgba(0, 0, 0, 0.08);
        color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6));
      }
    `,
  ],
})
export class LinkListComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  readonly links$: Observable<LinkRow[]> = this.store.select(selectLinks) as Observable<LinkRow[]>;
  readonly loading$: Observable<boolean> = this.store.select(selectLinksLoading);

  readonly columns: TableColumn<LinkRow>[] = [
    { key: 'shortUrl', header: 'Short Link', sortable: true },
    { key: 'originalUrl', header: 'Destination', sortable: true },
    { key: 'clickCount', header: 'Clicks', sortable: true },
    { key: 'createdAt', header: 'Created', sortable: true },
    { key: 'active', header: 'Status', sortable: true },
  ];

  ngOnInit(): void {
    this.store.dispatch(linkActions.loadLinks({ page: 0, size: 20 }));
  }

  confirmDeactivate(link: ShortLink): void {
    const ref = this.dialog.open(SharedDialogComponent, {
      data: {
        title: 'Deactivate link?',
        message: `${link.shortUrl} will no longer redirect.`,
        confirmLabel: 'Deactivate',
        cancelLabel: 'Cancel',
        danger: true,
      },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.store.dispatch(linkActions.deactivateLink({ code: link.shortCode }));
      }
    });
  }
}