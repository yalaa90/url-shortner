import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { ShortLink } from '../../shared/models/link.model';
import { linkActions } from './link.actions';

export interface LinkState extends EntityState<ShortLink> {
  loading: boolean;
  error: unknown;
  nextCursor?: string;
  hasMore: boolean;
  creating: boolean;
  optimisticCodes: string[];
  lastCreatedCode?: string;
}

export const linkAdapter = createEntityAdapter<ShortLink>({
  selectId: (link) => link.shortCode,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

export const initialLinkState: LinkState = linkAdapter.getInitialState({
  loading: false,
  error: null,
  nextCursor: undefined,
  hasMore: false,
  creating: false,
  optimisticCodes: [],
});

export const linkReducer = createReducer(
  initialLinkState,
  on(linkActions.loadLinks, (state): LinkState => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(linkActions.loadLinksSuccess, (state, { links, cursorPage }): LinkState =>
    linkAdapter.upsertMany(links, {
      ...state,
      loading: false,
      nextCursor: cursorPage.nextCursor,
      hasMore: cursorPage.hasMore,
    })
  ),
  on(linkActions.loadLinksFailure, (state, { error }): LinkState => ({
    ...state,
    loading: false,
    error,
  })),
  on(linkActions.createLink, (state): LinkState => ({
    ...state,
    creating: true,
  })),
  on(linkActions.createLinkSuccess, (state, { link }): LinkState =>
    linkAdapter.upsertOne(link, {
      ...state,
      creating: false,
      lastCreatedCode: link.shortCode,
      optimisticCodes: state.optimisticCodes.filter((code) => code !== link.shortCode),
    })
  ),
  on(linkActions.createLinkFailure, (state, { error }): LinkState => ({
    ...state,
    creating: false,
    error,
  })),
  on(linkActions.pruneOptimistic, (state, { shortCode }): LinkState => ({
    ...state,
    optimisticCodes: state.optimisticCodes.filter((code) => code !== shortCode),
  })),
  on(linkActions.deactivateLinkSuccess, (state, { code }): LinkState =>
    linkAdapter.updateOne(
      { id: code, changes: { active: false } },
      state
    )
  ),
  on(linkActions.updateLink, (state, { code, patch }): LinkState =>
    linkAdapter.updateOne({ id: code, changes: patch }, state)
  ),
  on(linkActions.reset, (): LinkState => initialLinkState)
);

export const { selectAll: selectAllLinks, selectEntities: selectLinkEntities } =
  linkAdapter.getSelectors();