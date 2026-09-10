import { linkActions } from './link.actions';
import { CreateLinkPayload, ShortLink } from '../../shared/models/link.model';

describe('linkActions', () => {
  const link: ShortLink = {
    id: 1,
    shortCode: 'abc',
    shortUrl: 'http://localhost/s/abc',
    originalUrl: 'https://example.com',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    clickCount: 0,
  };

  it('creates the loadLinks action', () => {
    const action = linkActions.loadLinks({ page: 2, size: 50 });
    expect(action.type).toBe('[Links] Load Links');
    expect(action.page).toBe(2);
    expect(action.size).toBe(50);
  });

  it('creates the loadLinksSuccess action', () => {
    const page = {
      content: [link],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    };
    const action = linkActions.loadLinksSuccess({ links: [link], page });
    expect(action.type).toBe('[Links] Load Links Success');
    expect(action.links).toEqual([link]);
    expect(action.page).toEqual(page);
  });

  it('creates the loadLinksFailure action', () => {
    const action = linkActions.loadLinksFailure({ error: 'nope' });
    expect(action.type).toBe('[Links] Load Links Failure');
    expect(action.error).toBe('nope');
  });

  it('creates the createLink action from a payload', () => {
    const payload: CreateLinkPayload = { url: 'https://example.com' };
    const action = linkActions.createLink({ payload });
    expect(action.type).toBe('[Links] Create Link');
    expect(action.payload).toEqual(payload);
  });

  it('creates the createLinkSuccess action', () => {
    const action = linkActions.createLinkSuccess({ link });
    expect(action.type).toBe('[Links] Create Link Success');
    expect(action.link).toEqual(link);
  });

  it('creates the createLinkFailure action', () => {
    const action = linkActions.createLinkFailure({ error: new Error('x') });
    expect(action.type).toBe('[Links] Create Link Failure');
    expect(action.error).toBeInstanceOf(Error);
  });

  it('creates the pruneOptimistic action', () => {
    const action = linkActions.pruneOptimistic({ shortCode: 'abc' });
    expect(action.type).toBe('[Links] Prune Optimistic');
    expect(action.shortCode).toBe('abc');
  });

  it('creates deactivate actions', () => {
    expect(linkActions.deactivateLink({ code: 'abc' }).type).toBe('[Links] Deactivate Link');
    expect(linkActions.deactivateLinkSuccess({ code: 'abc' }).type).toBe(
      '[Links] Deactivate Link Success'
    );
    expect(linkActions.deactivateLinkFailure({ error: 'x' }).type).toBe(
      '[Links] Deactivate Link Failure'
    );
  });

  it('creates the updateLink action', () => {
    const action = linkActions.updateLink({ code: 'abc', patch: { active: false } });
    expect(action.type).toBe('[Links] Update Link');
    expect(action.code).toBe('abc');
    expect(action.patch).toEqual({ active: false });
  });

  it('creates the reset action', () => {
    expect(linkActions.reset().type).toBe('[Links] Reset');
  });
});