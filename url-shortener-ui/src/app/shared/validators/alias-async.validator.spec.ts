import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AliasAsyncValidator } from './alias-async.validator';

describe('AliasAsyncValidator', () => {
  let validator: AliasAsyncValidator;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    validator = TestBed.inject(AliasAsyncValidator);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns null immediately for empty values', () => {
    let result: unknown = 'untouched';
    validator.validate(new FormControl('   ')).subscribe((res) => (result = res));
    expect(result).toBeNull();
  });

  it('rejects malformed aliases without hitting the network', () => {
    let result: unknown;
    validator.validate(new FormControl('ab')).subscribe((res) => (result = res));
    expect(result).toEqual({ aliasInvalid: true });
    httpMock.expectNone('/api/v1/links/ab/exists');
  });

  it('returns null when the alias is available', fakeAsync(() => {
    let result: unknown;
    validator.validate(new FormControl('my-alias')).subscribe((res) => (result = res));
    tick(300);
    const req = httpMock.expectOne('/api/v1/links/my-alias/exists');
    req.flush({
      success: true,
      data: { alias: 'my-alias', available: true },
    });
    expect(result).toBeNull();
  }));

  it('returns aliasTaken when the alias is unavailable', fakeAsync(() => {
    let result: unknown;
    validator.validate(new FormControl('taken')).subscribe((res) => (result = res));
    tick(300);
    const req = httpMock.expectOne('/api/v1/links/taken/exists');
    req.flush({
      success: true,
      data: { alias: 'taken', available: false },
    });
    expect(result).toEqual({ aliasTaken: { alias: 'taken' } });
  }));
});