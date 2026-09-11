import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  roles: string[];
  emailVerified: boolean;
}

export const authActions = createActionGroup({
  source: 'Auth',
  events: {
    loginRequest: props<{ username: string; password: string }>(),
    loginSuccess: props<{ profile: UserProfile }>(),
    loginFailure: props<{ error: unknown }>(),
    logout: emptyProps(),
    logoutSuccess: emptyProps(),
    loadProfile: emptyProps(),
    profileLoaded: props<{ profile: UserProfile }>(),
  },
});

export type AuthAction = ReturnType<(typeof authActions)['loginRequest']>;
