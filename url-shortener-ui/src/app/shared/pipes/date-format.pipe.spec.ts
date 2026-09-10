import { DateFormatPipe } from './date-format.pipe';

describe('DateFormatPipe', () => {
  let pipe: DateFormatPipe;

  beforeEach(() => {
    pipe = new DateFormatPipe();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('creates an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns a dash for nullish or empty input', () => {
    expect(pipe.transform(null)).toBe('-');
    expect(pipe.transform(undefined)).toBe('-');
  });

  it('formats dates with Intl for medium format by default', () => {
    const date = new Date('2024-01-15T10:30:00');
    const locales = navigator.language || 'en-US';
    const expected = new Intl.DateTimeFormat(locales, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
    expect(pipe.transform(date)).toBe(expected);
    expect(pipe.transform('2024-01-15T10:30:00')).toBe(expected);
  });

  it('formats with short and long options', () => {
    const date = new Date('2024-01-15T10:30:00');
    const locales = navigator.language || 'en-US';
    expect(pipe.transform(date, 'short')).toBe(
      new Intl.DateTimeFormat(locales, { dateStyle: 'short' }).format(date)
    );
    expect(pipe.transform(date, 'long')).toBe(
      new Intl.DateTimeFormat(locales, { dateStyle: 'long', timeStyle: 'long' }).format(date)
    );
  });

  it('returns "just now" for timestamps under a minute old', () => {
    jasmine.clock().mockDate(new Date('2024-06-01T12:00:00'));
    const recent = new Date('2024-06-01T11:59:30');
    expect(pipe.transform(recent, 'relative')).toBe('just now');
  });

  it('returns relative minutes', () => {
    jasmine.clock().mockDate(new Date('2024-06-01T12:00:00'));
    const recent = new Date('2024-06-01T11:55:00');
    expect(pipe.transform(recent, 'relative')).toBe('5 minutes ago');
  });

  it('returns relative hours', () => {
    jasmine.clock().mockDate(new Date('2024-06-01T12:00:00'));
    const recent = new Date('2024-06-01T10:00:00');
    expect(pipe.transform(recent, 'relative')).toBe('2 hours ago');
  });

  it('returns relative days', () => {
    jasmine.clock().mockDate(new Date('2024-06-01T12:00:00'));
    const recent = new Date('2024-05-25T12:00:00');
    expect(pipe.transform(recent, 'relative')).toBe('7 days ago');
  });

  it('falls back to a locale date for dates older than 30 days', () => {
    jasmine.clock().mockDate(new Date('2024-06-01T12:00:00'));
    const old = new Date('2024-01-15T10:30:00');
    expect(pipe.transform(old, 'relative')).toBe(old.toLocaleDateString());
  });
});