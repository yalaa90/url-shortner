import { HttpInterceptorFn } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';

export const loadingState$ = new BehaviorSubject<number>(0);

export const isLoading$ = loadingState$.asObservable();

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  loadingState$.next(loadingState$.value + 1);

  return next(req).pipe(
    finalize(() => {
      loadingState$.next(Math.max(0, loadingState$.value - 1));
    })
  );
};