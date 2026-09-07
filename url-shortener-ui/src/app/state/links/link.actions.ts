import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  CreateLinkPayload,
  CursorPage,
  Page,
  ShortLink,
} from '../../shared/models/link.model';

export const linkActions = createActionGroup({
  source: 'Links',
  events: {
    'Load Links': props<{ page?: number; size?: number }>(),
    'Load Links Success': props<{ links: ShortLink[]; page: Page<ShortLink>; cursorPage: CursorPage<ShortLink> }>(),
    'Load Links Failure': props<{ error: unknown }>(),
    'Create Link': props<{ payload: CreateLinkPayload }>(),
    'Create Link Success': props<{ link: ShortLink }>(),
    'Create Link Failure': props<{ error: unknown }>(),
    'Prune Optimistic': props<{ shortCode: string }>(),
    'Deactivate Link': props<{ code: string }>(),
    'Deactivate Link Success': props<{ code: string }>(),
    'Deactivate Link Failure': props<{ error: unknown }>(),
    'Update Link': props<{ code: string; patch: Partial<ShortLink> }>(),
    'Reset': emptyProps(),
  },
});