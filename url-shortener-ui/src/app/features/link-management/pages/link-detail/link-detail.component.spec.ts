import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { LinkDetailComponent } from './link-detail.component';
import { ShortLink } from '../../../../shared/models/link.model';

describe('LinkDetailComponent', () => {
  let fixture: ComponentFixture<LinkDetailComponent>;
  let component: LinkDetailComponent;
  let httpMock: HttpTestingController;

  const link: ShortLink = {
    id: 1,
    shortCode: 'abc',
    shortUrl: 'http://localhost/s/abc',
    originalUrl: 'https://example.com/target',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    clickCount: 42,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, LinkDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'code' ? 'abc' : null) } } },
        },
      ],
    });
    fixture = TestBed.createComponent(LinkDetailComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests the link details and renders them', fakeAsync(() => {
    fixture.detectChanges();
    const req = httpMock.expectOne('http://localhost:8080/api/v1/links/abc/details');
    expect(req.request.method).toBe('GET');
    req.flush({ data: link });
    tick();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('https://example.com/target');
    expect(el.textContent).toContain('abc');
    expect(el.textContent).toContain('Active');
    expect(el.textContent).toContain('42');
    expect(el.textContent).toContain('Never');
    expect(el.querySelector('img[alt="QR code for short link"]')).toBeTruthy();
  }));

  it('generates a QR data URL for the short URL', fakeAsync(() => {
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:8080/api/v1/links/abc/details').flush({ data: link });
    tick();
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img[alt="QR code for short link"]') as HTMLImageElement;
    expect(img.src).toContain('data:image/png');
  }));

  it('shows a spinner while the details are loading', () => {
    fixture.detectChanges();
    expect(component.qrCode).toBe('');
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeTruthy();

    httpMock.expectOne('http://localhost:8080/api/v1/links/abc/details').flush({ data: undefined });
  });
});