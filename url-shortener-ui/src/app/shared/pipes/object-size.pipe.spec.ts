import { ObjectSizePipe } from './object-size.pipe';

describe('ObjectSizePipe', () => {
  let pipe: ObjectSizePipe;

  beforeEach(() => {
    pipe = new ObjectSizePipe();
  });

  it('creates an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns 0 for nullish input', () => {
    expect(pipe.transform(null)).toBe(0);
    expect(pipe.transform(undefined)).toBe(0);
  });

  it('returns 0 for an empty object', () => {
    expect(pipe.transform({})).toBe(0);
  });

  it('counts object keys', () => {
    expect(pipe.transform({ a: 1, b: 2, c: 3 })).toBe(3);
  });
});