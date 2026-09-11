import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LinkState, selectAllLinks } from './link.reducer';

export const selectLinkState = createFeatureSelector<LinkState>('links');

export const selectLinks = createSelector(selectLinkState, selectAllLinks);

export const selectLinksLoading = createSelector(selectLinkState, (state) => state.loading);

export const selectLinksError = createSelector(selectLinkState, (state) => state.error);

export const selectLinksCreating = createSelector(selectLinkState, (state) => state.creating);

export const selectHasMoreLinks = createSelector(selectLinkState, (state) => state.hasMore);

export const selectNextCursor = createSelector(selectLinkState, (state) => state.nextCursor);

export const selectActiveLinks = createSelector(selectAllLinks, (links) =>
  links.filter((link) => link.active)
);

export const selectLinkByCode = (code: string) =>
  createSelector(selectLinkState, (state) => state.entities[code]);

export const selectLastCreatedCode = createSelector(
  selectLinkState,
  (state) => state.lastCreatedCode
);

export const selectLastCreatedLink = createSelector(
  selectLastCreatedCode,
  selectLinkState,
  (code, state) => (code ? state.entities[code] : undefined)
);
