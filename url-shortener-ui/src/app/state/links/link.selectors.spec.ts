import {
  selectActiveLinks,
  selectHasMoreLinks,
  selectLastCreatedCode,
  selectLastCreatedLink,
  selectLinkByCode,
  selectLinks,
  selectLinksCreating,
  selectLinksError,
  selectLinksLoading,
  selectNextCursor,
} from './link.selectors';
import { initialLinkState, linkAdapter, LinkState } from './link.reducer';
import { ShortLink } from '../../shared/models/link.model';

function makeLink(shortCode: string, extra: Partial<ShortLink> = {}): ShortLink {
  return {
    id: shortCode.length,
    shortCode,
    shortUrl: `http://localhost/s/${shortCode}`,
    originalUrl: 'https://example.com',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    clickCount: 0,
    ...extra,
  };
}

describe('link selectors', () => {
  let state: LinkState;

  beforeEach(() => {
    state = linkAdapter.setAll(
      [
        makeLink('xyz', { createdAt: '2024-03-01T00:00:00Z', clickCount: 3 }),
        makeLink('later', { createdAt: '2024-02-01T00:00:00Z', clickCount: 2 }),
        makeLink('abc', { active: false }),
      ],
      {
        ...initialLinkState,
        loading: true,
        error: 'bad',
        nextCursor: 'cursor-2',
        hasMore: true,
        creating: true,
        optimisticCodes: ['xyz'],
        lastCreatedCode: 'xyz',
      }
    );
  });

  it('selects all links ordered by the sort comparer', () => {
    const links = selectLinks.projector(state);
    expect(links.map((l) => l.shortCode)).toEqual(['xyz', 'later', 'abc']);
  });

  it('selects the loading flag and error', () => {
    expect(selectLinksLoading.projector(state)).toBeTrue();
    expect(selectLinksError.projector(state)).toBe('bad');
  });

  it('selects the creating flag', () => {
    expect(selectLinksCreating.projector(state)).toBeTrue();
  });

  it('selects cursor pagination metadata', () => {
    expect(selectHasMoreLinks.projector(state)).toBeTrue();
    expect(selectNextCursor.projector(state)).toBe('cursor-2');
  });

  it('selects only active links', () => {
    const links = selectActiveLinks.projector(selectLinks.projector(state));
    expect(links.map((l) => l.shortCode)).toEqual(['xyz', 'later']);
  });

  it('selects a link by code', () => {
    expect(selectLinkByCode('abc').projector(state)?.shortCode).toBe('abc');
    expect(selectLinkByCode('missing').projector(state)).toBeUndefined();
  });

  it('selects the last created code and link', () => {
    expect(selectLastCreatedCode.projector(state)).toBe('xyz');
    expect(selectLastCreatedLink.projector('xyz', state)?.shortCode).toBe('xyz');
    expect(selectLastCreatedLink.projector(undefined, state)).toBeUndefined();
  });
});