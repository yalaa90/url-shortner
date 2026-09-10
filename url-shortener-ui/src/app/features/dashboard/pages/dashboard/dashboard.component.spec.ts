import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { DashboardComponent } from './dashboard.component';
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

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let store: MockStore<AppState>;
  let dispatch: jasmine.Spy;

  function setLinks(links: ShortLink[], loading = false): void {
    store.setState({
      auth: initialAuthState,
      links: linkAdapter.setAll(links, { ...initialLinkState, loading }),
    });
    fixture.detectChanges();
  }

  const statValues = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.stat-value')).map(
      (el) => (el as HTMLElement).textContent ?? ''
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, DashboardComponent],
      providers: [
        provideRouter([]),
        provideMockStore<AppState>({ initialState }),
      ],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore<AppState>);
    dispatch = spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  it('dispatches loadLinks on initialization', () => {
    expect(dispatch).toHaveBeenCalledWith(linkActions.loadLinks({ page: 0, size: 20 }));
  });

  it('renders the computed stat cards', () => {
    setLinks([
      makeLink('aaa', { active: true, clickCount: 10 }),
      makeLink('bbb', { active: true, clickCount: 5 }),
      makeLink('ccc', { active: false, clickCount: 0 }),
    ]);

    expect(statValues()).toEqual(['3', '2', '15', '5']);
  });

  it('renders recent links with their short url and click count', () => {
    setLinks([makeLink('aaa', { clickCount: 2 })]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('http://localhost/s/aaa');
    expect(el.textContent).toContain('2 clicks');
  });

  it('shows the empty state when there are no links', () => {
    setLinks([]);
    expect(fixture.nativeElement.textContent).toContain('No links yet.');
  });

  it('shows a loading spinner while links are loading', () => {
    setLinks([], true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();
  });
});