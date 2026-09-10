import { linkActions } from './link.actions';
import { initialLinkState, linkAdapter, linkReducer, LinkState } from './link.reducer';
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

describe('linkReducer', () => {
  it('starts with the initial state', () => {
    expect(linkReducer(undefined, { type: 'unknown' })).toEqual(initialLinkState);
  });

  it('sets loading and clears errors on loadLinks', () => {
    const prior: LinkState = { ...initialLinkState, error: 'old error' };
    const state = linkReducer(prior, linkActions.loadLinks({}));
    expect(state.loading).toBeTrue();
    expect(state.error).toBeNull();
  });

  it('upserts links on loadLinksSuccess', () => {
    const links = [makeLink('abc'), makeLink('def')];
    const page = {
      content: links,
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    const state = linkReducer(initialLinkState, linkActions.loadLinksSuccess({ links, page }));
    expect(state.loading).toBeFalse();
    expect(state.entities['abc']).toEqual(links[0]);
    expect(state.entities['def']).toEqual(links[1]);
  });

  it('stores the error and stops loading on loadLinksFailure', () => {
    const state = linkReducer(initialLinkState, linkActions.loadLinksFailure({ error: 'boom' }));
    expect(state.loading).toBeFalse();
    expect(state.error).toBe('boom');
  });

  it('sets creating on createLink', () => {
    const state = linkReducer(initialLinkState, linkActions.createLink({ payload: { url: 'https://example.com' } }));
    expect(state.creating).toBeTrue();
  });

  it('upserts the created link and prunes optimistic codes on createLinkSuccess', () => {
    const prior: LinkState = {
      ...initialLinkState,
      creating: true,
      optimisticCodes: ['abc'],
      entities: {},
    };
    const link = makeLink('abc');
    const state = linkReducer(prior, linkActions.createLinkSuccess({ link }));
    expect(state.creating).toBeFalse();
    expect(state.entities['abc']).toEqual(link);
    expect(state.lastCreatedCode).toBe('abc');
    expect(state.optimisticCodes).toEqual([]);
  });

  it('clears creating on createLinkFailure', () => {
    const prior: LinkState = { ...initialLinkState, creating: true };
    const state = linkReducer(prior, linkActions.createLinkFailure({ error: 'nope' }));
    expect(state.creating).toBeFalse();
    expect(state.error).toBe('nope');
  });

  it('removes a code on pruneOptimistic', () => {
    const prior: LinkState = { ...initialLinkState, optimisticCodes: ['abc', 'def'] };
    const state = linkReducer(prior, linkActions.pruneOptimistic({ shortCode: 'abc' }));
    expect(state.optimisticCodes).toEqual(['def']);
  });

  it('deactivates a link on deactivateLinkSuccess', () => {
    const link = makeLink('abc', { active: true, clickCount: 3 });
    const prior = linkAdapter.setAll([link], initialLinkState);
    const state = linkReducer(prior, linkActions.deactivateLinkSuccess({ code: 'abc' }));
    expect(state.entities['abc']?.active).toBeFalse();
  });

  it('applies patches on updateLink', () => {
    const link = makeLink('abc');
    const prior = linkAdapter.setAll([link], initialLinkState);
    const state = linkReducer(prior, linkActions.updateLink({ code: 'abc', patch: { originalUrl: 'https://new.dev' } }));
    expect(state.entities['abc']?.originalUrl).toBe('https://new.dev');
  });

  it('resets to the initial state', () => {
    const link = makeLink('abc');
    const prior = linkAdapter.setAll([link], { ...initialLinkState, loading: true });
    expect(linkReducer(prior, linkActions.reset())).toEqual(initialLinkState);
  });
});