import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('creates an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns an empty string for nullish or empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('returns the value unchanged when within the limit', () => {
    expect(pipe.transform('hello world', 20)).toBe('hello world');
  });

  it('truncates with the default ellipsis', () => {
    const result = pipe.transform('abcdefghijklmnopqrstuvwxyz', 10);
    expect(result).toBe('abcdefg...');
  });

  it('truncates with a custom ellipsis', () => {
    const result = pipe.transform('abcdefghijklmnopqrstuvwxyz', 10, '…');
    expect(result).toBe('abcdefghi…');
  });

  it('uses default limit of 50', () => {
    const value = 'a'.repeat(60);
    expect(pipe.transform(value)).toBe('a'.repeat(47) + '...');
  });
});