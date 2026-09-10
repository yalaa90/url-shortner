import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import {
  SharedTableComponent,
  TableActionsDirective,
  TableColumnTemplateDirective,
  TableColumn,
} from './shared-table.component';

interface Row extends Record<string, unknown> {
  name: string;
  active: boolean;
}

@Component({
  standalone: true,
  selector: 'app-host',
  imports: [CommonModule, SharedTableComponent, TableColumnTemplateDirective, TableActionsDirective],
  template: `
    <app-shared-table
      [data]="rows()"
      [columns]="columns"
      (pageChange)="page($event)"
      (sortChange)="sort($event)"
      (filterChange)="filter($event)"
    >
      <ng-template tableColumnTemplate="name" let-row>{{ row.name | uppercase }}</ng-template>
      <ng-template tableActions let-row>
        <button (click)="act(row)">Go</button>
      </ng-template>
    </app-shared-table>
  `,
})
class HostComponent {
  rows = signal<Row[]>([
    { name: 'alpha', active: true },
    { name: 'beta', active: false },
  ]);
  columns: TableColumn<Row>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'active', header: 'Active' },
  ];
  act = jasmine.createSpy();
  page = jasmine.createSpy();
  sort = jasmine.createSpy();
  filter = jasmine.createSpy();
}

describe('SharedTableComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NoopAnimationsModule, HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders headers with the configured columns', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Name');
    expect(el.textContent).toContain('Active');
  });

  it('renders rows including custom column templates and action buttons', () => {
    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    expect(rows.length).toBe(2);
    expect((rows[0] as HTMLElement).textContent).toContain('ALPHA');
    expect((rows[0] as HTMLElement).textContent).toContain('true');

    const btn = (rows[0] as HTMLElement).querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(host.act).toHaveBeenCalledWith({ name: 'alpha', active: true });
  });

  it('filters rows locally and emits the filter term', () => {
    const filterInput = fixture.nativeElement.querySelector(
      'input[placeholder="Search..."]'
    ) as HTMLInputElement;
    filterInput.value = 'BETA';
    filterInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    expect(rows.length).toBe(1);
    expect((rows[0] as HTMLElement).textContent).toContain('BETA');
    expect(host.filter).toHaveBeenCalledWith('beta');
  });

  it('shows the empty row text when there is no data', () => {
    host.rows.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No records found');
  });

  it('shows a loader instead of rows while loading', () => {
    const table = fixture.debugElement.query((d) =>
      d.componentInstance instanceof SharedTableComponent
    ).componentInstance as SharedTableComponent<Row>;
    table.loading = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(0);
  });

  it('emits pagination and sort events', () => {
    const table = fixture.debugElement.query((d) =>
      d.componentInstance instanceof SharedTableComponent
    ).componentInstance as SharedTableComponent<Row>;

    const pageEvent: PageEvent = {
      pageIndex: 2,
      pageSize: 20,
      length: 50,
      previousPageIndex: 1,
    };
    table.onPage(pageEvent);
    expect(host.page).toHaveBeenCalledWith(pageEvent);

    table.onSort({ active: 'name', direction: 'asc' } as Sort);
    expect(host.sort).toHaveBeenCalledWith({ active: 'name', direction: 'asc' });
  });
});