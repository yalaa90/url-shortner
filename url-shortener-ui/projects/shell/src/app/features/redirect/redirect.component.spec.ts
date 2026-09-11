import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { RedirectComponent } from './redirect.component';

describe('RedirectComponent', () => {
  let fixture: ComponentFixture<RedirectComponent>;
  let component: RedirectComponent;
  let httpMock: HttpTestingController;
  let replace: jasmine.Spy;

  beforeEach(() => {
    replace = jasmine.createSpy('replace');
    const fakeDefaultView: Record<string, unknown> = {};
    for (const key of Object.getOwnPropertyNames(window)) {
      const value = (window as unknown as Record<string, unknown>)[key];
      fakeDefaultView[key] = typeof value === 'function' ? (value as Function).bind(window) : value;
    }
    Object.defineProperty(fakeDefaultView, 'location', {
      configurable: true,
      value: { replace },
    });
    Object.defineProperty(document, 'defaultView', {
      configurable: true,
      value: fakeDefaultView,
    });
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RedirectComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ code: 'abc' }) } } },
      ],
    });
    fixture = TestBed.createComponent(RedirectComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    delete (document as unknown as Record<string, unknown>)['defaultView'];
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('redirects to the original URL on a successful lookup', fakeAsync(() => {
    fixture.detectChanges();

    httpMock
      .expectOne('http://localhost:8080/api/v1/links/abc')
      .flush({ data: { originalUrl: 'https://example.com/target' } });
    tick();

    expect(replace).toHaveBeenCalledWith('https://example.com/target');
  }));

  it('shows not found when the payload has no URL', fakeAsync(() => {
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:8080/api/v1/links/abc').flush({ data: {} });
    tick();

    expect(replace).not.toHaveBeenCalled();
    expect(component.state).toBe('notFound');
  }));

  it('shows not found on a 404', fakeAsync(() => {
    fixture.detectChanges();

    httpMock
      .expectOne('http://localhost:8080/api/v1/links/abc')
      .flush({ error: { detail: 'Missing' } }, { status: 404, statusText: 'Not Found' });
    tick();

    expect(component.state).toBe('notFound');
  }));

  it('shows an error state on a server failure', fakeAsync(() => {
    fixture.detectChanges();

    httpMock
      .expectOne('http://localhost:8080/api/v1/links/abc')
      .flush({ error: { detail: 'Boom' } }, { status: 500, statusText: 'Internal Server Error' });
    tick();

    expect(component.state).toBe('error');
  }));
});