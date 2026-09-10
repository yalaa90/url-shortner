import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { LinkListComponent } from './link-list.component';
import { linkActions } from '../../../../state/links/link.actions';
import { initialLinkState, linkAdapter } from '../../../../state/links/link.reducer';
import { initialAuthState } from '../../../../state/auth/auth.reducer';
import { AppState } from '../../../../state/app.state';
import { ShortLink } from '../../../../shared/models/link.model';

const initialState: AppState = { auth: initialAuthState, links: initialLinkState };

function makeLink(shortCode: string, extra: Partial<ShortLink> = {}): ShortLink {
  return {
    id: shortCode.length,
    shortCode,
    shortUrl: `http://localhost/s/${shortCode}`,
    originalUrl: `https://example.com/${shortCode}`,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    clickCount: 0,
    ...extra,
  };
}

describe('LinkListComponent', () => {
  let fixture: ComponentFixture<LinkListComponent>;
  let component: LinkListComponent;
  let store: MockStore<AppState>;
  let dispatch: jasmine.Spy;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, LinkListComponent],
      providers: [
        provideRouter([]),
        provideMockStore<AppState>({ initialState }),
        { provide: MatDialog, useValue: dialog },
      ],
    });
    fixture = TestBed.createComponent(LinkListComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore<AppState>);
    dispatch = spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  function setLinks(links: ShortLink[]): void {
    store.setState({
      auth: initialAuthState,
      links: linkAdapter.setAll(links, { ...initialLinkState, loading: false }),
    });
    fixture.detectChanges();
  }

  it('dispatches loadLinks on initialization', () => {
    expect(dispatch).toHaveBeenCalledWith(linkActions.loadLinks({ page: 0, size: 20 }));
  });

  it('renders table headers and rows for the links', () => {
    setLinks([makeLink('aaa', { clickCount: 7 }), makeLink('bbb', { active: false })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Short Link');
    expect(el.textContent).toContain('Destination');
    expect(el.textContent).toContain('Status');
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(2);
    expect(el.textContent).toContain('Active');
    expect(el.textContent).toContain('Disabled');
  });

  it('opens the deactivate dialog and dispatches deactivateLink when confirmed', () => {
    setLinks([makeLink('aaa')]);

    const afterClosed = new Subject<boolean>();
    dialog.open.and.returnValue({ afterClosed: () => afterClosed.asObservable() } as MatDialogRef<unknown>);

    const deactivateBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Deactivate link"]'
    ) as HTMLButtonElement;
    deactivateBtn.click();

    expect(dialog.open).toHaveBeenCalled();
    afterClosed.next(true);

    expect(dispatch).toHaveBeenCalledWith(linkActions.deactivateLink({ code: 'aaa' }));
  });

  it('does not dispatch when the dialog is cancelled', () => {
    setLinks([makeLink('aaa')]);

    const afterClosed = new Subject<boolean>();
    dialog.open.and.returnValue({ afterClosed: () => afterClosed.asObservable() } as MatDialogRef<unknown>);

    const deactivateBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Deactivate link"]'
    ) as HTMLButtonElement;
    deactivateBtn.click();
    afterClosed.next(false);

    expect(dispatch).not.toHaveBeenCalledWith(linkActions.deactivateLink({ code: 'aaa' }));
    expect(component.confirmDeactivate).toBeDefined();
  });
});