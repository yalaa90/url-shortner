import {
  Component,
  ContentChild,
  ContentChildren,
  Directive,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface TableColumn<T> {
  key: keyof T & string;
  header: string;
  sortable?: boolean;
}

@Directive({ selector: '[tableColumnTemplate]', standalone: true })
export class TableColumnTemplateDirective<T> {
  @Input() tableColumnTemplate = '';
  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}
}

@Directive({ selector: '[tableActions]', standalone: true })
export class TableActionsDirective<T> {
  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}
}

@Component({
  selector: 'app-shared-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-form-field appearance="outline" class="filter-field">
      <mat-label>Filter</mat-label>
      <input matInput (input)="onFilter($event)" placeholder="Search..." />
    </mat-form-field>

    @if (loading) {
      <div class="table-loading">
        <mat-spinner diameter="32" />
      </div>
    } @else {
      <div class="table-scroll">
        <table mat-table [dataSource]="filteredData" matSort (matSortChange)="onSort($event)">
          @for (column of columns; track column.key) {
            <ng-container matColumnDef="{{ column.key }}">
              <th mat-header-cell *matHeaderCellDef mat-sort-header [disabled]="!column.sortable">
                {{ column.header }}
              </th>
              <td mat-cell *matCellDef="let row">
                @if (columnTemplates[column.key]) {
                  <ng-container
                    *ngTemplateOutlet="columnTemplates[column.key].templateRef; context: { $implicit: row }"
                  />
                } @else {
                  {{ row[column.key] }}
                }
              </td>
            </ng-container>
          }

          @if (actions) {
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <ng-container *ngTemplateOutlet="actions.templateRef; context: { $implicit: row }" />
              </td>
            </ng-container>
          }

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>

        @if (!filteredData.length) {
          <div class="empty-cell">No records found</div>
        }
      </div>
    }

    <mat-paginator
      [length]="data.length"
      [pageSize]="pageSize"
      [pageSizeOptions]="[10, 20, 50]"
      aria-label="Pagination"
      (page)="onPage($event)"
    />
  `,
  styles: [
    `
      .filter-field {
        width: 100%;
        margin-bottom: 8px;
      }
      .table-scroll {
        overflow-x: auto;
        min-height: 120px;
        position: relative;
      }
      .table-loading {
        display: flex;
        justify-content: center;
        padding: 48px;
      }
      table {
        width: 100%;
      }
      .empty-cell {
        padding: 24px;
        text-align: center;
        color: var(--sys-on-surface-variant, rgba(0, 0, 0, 0.6));
      }
    `,
  ],
})
export class SharedTableComponent<T extends Record<string, unknown>> {
  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];
  @Input({ transform: booleanAttribute }) loading = false;
  @Input() pageSize = 20;
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() filterChange = new EventEmitter<string>();

  @ContentChildren(TableColumnTemplateDirective) columnTemplateList!: QueryList<TableColumnTemplateDirective<T>>;
  @ContentChild(TableActionsDirective) actions?: TableActionsDirective<T>;

  columnTemplates: Record<string, TableColumnTemplateDirective<T>> = {};
  filteredData: T[] = [];
  displayedColumns: string[] = [];

  ngAfterContentInit(): void {
    this.columnTemplates = this.columnTemplateList.reduce(
      (acc, directive) => {
        if (directive.tableColumnTemplate) {
          acc[directive.tableColumnTemplate] = directive;
        }
        return acc;
      },
      {} as Record<string, TableColumnTemplateDirective<T>>
    );
    this.refresh();
  }

  ngOnChanges(): void {
    this.refresh();
  }

  private refresh(): void {
    this.filteredData = [...this.data];
    this.displayedColumns = [
      ...this.columns.map((column) => column.key),
      ...(this.actions ? ['actions'] : []),
    ];
  }

  onPage(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onSort(event: Sort): void {
    this.sortChange.emit(event);
  }

  onFilter(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter((row) =>
      this.columns.some((column) => String(row[column.key]).toLowerCase().includes(term))
    );
    this.filterChange.emit(term);
  }
}
