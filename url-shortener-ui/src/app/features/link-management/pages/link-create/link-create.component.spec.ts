import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { LinkCreateComponent } from './link-create.component';
import { linkActions } from '../../../../state/links/link.actions';
import { initialLinkState, linkAdapter } from '../../../../state/links/link.reducer';
import { initialAuthState } from '../../../../state/auth/auth.reducer';
import { AppState } from '../../../../state/app.state';
import { ShortLink } from '../../../../shared/models/link.model';

const initialState: AppState = { auth: initialAuthState, links: initialLinkState };

const createdLink: ShortLink = {
  id: 1,
  shortCode: 'abc',
  shortUrl: 'http://localhost/s/abc',
  originalUrl: 'https://example.com/target',
  active: true,
  createdAt: '2024-01-01T00:00:00Z',
  clickCount: 0,
};

describe('LinkCreateComponent', () => {
  let fixture: ComponentFixture<LinkCreateComponent>;
  let component: LinkCreateComponent;
  let store: MockStore<AppState>;
  let dispatch: jasmine.Spy;
  let httpMock: HttpTestingController;

  function setCreatedLink(): void {
    store.setState({
      auth: initialAuthState,
      links: linkAdapter.addOne(createdLink, {
        ...initialLinkState,
        creating: false,
        lastCreatedCode: createdLink.shortCode,
      }),
    });
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, LinkCreateComponent],
      providers: [
        provideRouter([]),
        provideMockStore<AppState>({ initialState }),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(LinkCreateComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore<AppState>);
    dispatch = spyOn(store, 'dispatch');
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('renders the create link form', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Create Short Link');
    expect(el.querySelectorAll('mat-form-field').length).toBe(3);
    expect(component.tomorrowLocal.length).toBe(10);
  });

  it('dispatches createLink with the trimmed payload on a valid submit', fakeAsync(() => {
    component.createForm.get('url')?.setValue(' https://example.com/somewhere ');
    fixture.detectChanges();
    tick(50);
    expect(component.createForm.valid).toBeTrue();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    button.click();

    expect(dispatch).toHaveBeenCalledWith(
      linkActions.createLink({
        payload: {
          url: 'https://example.com/somewhere',
          customAlias: undefined,
          expiresAt: undefined,
        },
      })
    );
  }));

  it('does not dispatch when the URL is invalid', fakeAsync(() => {
    component.createForm.get('url')?.setValue('not-a-url');
    fixture.detectChanges();
    tick(50);

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    button.click();
    expect(dispatch).not.toHaveBeenCalled();
    expect(component.getError('url', 'urlInvalid')).toBeTrue();
  }));

  it('runs the async alias availability check', fakeAsync(() => {
    const alias = component.createForm.get('customAlias');
    alias?.setValue('taken');
    tick(300);

    httpMock
      .expectOne('/api/v1/links/taken/exists')
      .flush({ success: true, data: { alias: 'taken', available: false } });
    tick();
    expect(alias?.hasError('aliasTaken')).toBeTrue();
  }));

  it('marks malformed aliases as invalid', () => {
    const alias = component.createForm.get('customAlias');
    alias?.setValue('ab');
    expect(alias?.hasError('aliasInvalid')).toBeTrue();
    httpMock.expectNone('/api/v1/links/ab/exists');
  });

  it('shows the success card with a QR code once a link is created', fakeAsync(() => {
    setCreatedLink();
    flush();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Your link is ready!');
    expect(component.createdLink?.shortCode).toBe('abc');
    expect(component.qrCode).toContain('data:image');

    const img = fixture.nativeElement.querySelector('img[alt="QR code for short link"]') as HTMLImageElement;
    expect(img.src).toContain('data:image');
  }));

  it('resets the form and hides the success card', fakeAsync(() => {
    setCreatedLink();
    fixture.detectChanges();
    tick();

    component.resetForm();
    fixture.detectChanges();
    expect(component.createdLink).toBeNull();
    expect(component.qrCode).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Create Short Link');
  }));
});