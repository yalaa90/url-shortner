import { FormControl } from '@angular/forms';
import { customAliasValidator, urlValidator } from './url.validator';

describe('urlValidator', () => {
  let validator: ReturnType<typeof urlValidator>;

  beforeEach(() => {
    validator = urlValidator();
  });

  it('treats an empty value as valid', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('   '))).toBeNull();
  });

  it('accepts http and https URLs', () => {
    expect(validator(new FormControl('https://example.com'))).toBeNull();
    expect(validator(new FormControl('https://example.com/path?q=1'))).toBeNull();
    expect(validator(new FormControl('http://localhost:8080/a'))).toBeNull();
  });

  it('rejects non-http(s) protocols', () => {
    const result = validator(new FormControl('ftp://example.com'));
    expect(result).toEqual({
      urlInvalid: { message: 'URL must use http or https' },
    });
  });

  it('rejects strings that are not URLs', () => {
    const result = validator(new FormControl('not a url'));
    expect(result).toEqual({ urlInvalid: { message: 'Enter a valid URL' } });
  });
});

describe('customAliasValidator', () => {
  let validator: ReturnType<typeof customAliasValidator>;

  beforeEach(() => {
    validator = customAliasValidator();
  });

  it('treats an empty value as valid', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('accepts alphanumeric underscore and dash aliases between 3 and 64 chars', () => {
    expect(validator(new FormControl('abc'))).toBeNull();
    expect(validator(new FormControl('my_alias-1'))).toBeNull();
    expect(validator(new FormControl('a'.repeat(64)))).toBeNull();
  });

  it('rejects too-short aliases', () => {
    expect(validator(new FormControl('ab'))).not.toBeNull();
  });

  it('rejects aliases with invalid characters', () => {
    const result = validator(new FormControl('my alias!'));
    expect(result).toEqual({
      aliasInvalid: { message: '3-64 chars, letters, numbers, - or _ only' },
    });
  });
});