import { AuthState } from './auth/auth.reducer';
import { LinkState } from './links/link.reducer';

export interface AppState {
  auth: AuthState;
  links: LinkState;
}

export { linkActions } from './links/link.actions';
export { authActions } from './auth/auth.actions';