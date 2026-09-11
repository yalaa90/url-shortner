import { Injectable } from '@angular/core';
import { AsyncValidator, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, first } from 'rxjs/operators';
import { ApiResponse, AliasCheckResponse } from '../models/link.model';

@Injectable({ providedIn: 'root' })
export class AliasAsyncValidator implements AsyncValidator {
  constructor(private readonly http: HttpClient) {}

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const alias = control.value?.trim();
    if (!alias) {
      return of(null);
    }

    if (!/^[a-zA-Z0-9_-]{3,64}$/.test(alias)) {
      return of({ aliasInvalid: true });
    }

    return timer(300).pipe(
      switchMap(() =>
        this.http.get<ApiResponse<AliasCheckResponse>>(
          `/api/v1/links/${encodeURIComponent(alias)}/exists`
        )
      ),
      map((response) =>
        response.data.available ? null : { aliasTaken: { alias } }
      ),
      first()
    );
  }
}
